// templatesApi.js
// All database + storage operations for the Templates module.
//
// Storage bucket: "excel-templates"   (create this in Supabase Dashboard)
// Database table: "templates"         (see supabase SQL in walkthrough.md)
//
// Storage layout: files are organized as `{section-name}/{original-file-name}`
// so the bucket mirrors the section structure and files keep a readable name
// when browsed directly in Supabase Storage. Uniqueness is handled by
// appending `-2`, `-3`, etc. only if a name collision actually occurs.

import { supabase } from "../lib/supabaseClient";

const BUCKET = "excel-templates";

// ── Shared select fragment ────────────────────────────────────────────────────
// `section.division` is the important part here — without it, every template
// falls back to "Unassigned" in the UI because templates.division_id is never
// set directly (a template's division is derived from its section).
const TEMPLATE_SELECT = `
  id,
  name,
  file_name,
  storage_path,
  section_id,
  division_id,
  created_at,
  created_by,
  section:sections ( id, name, division_id, division:divisions ( id, name ) ),
  division:divisions ( id, name )
`;

// ── Path helpers ───────────────────────────────────────────────────────────────
// Keep folder/file names readable in the storage browser: strip characters
// Supabase Storage dislikes, collapse whitespace, but don't mangle casing.
function safeSegment(str, fallback = "unassigned") {
  const cleaned = (str ?? "")
    .toString()
    .trim()
    .replace(/[\\/]+/g, "-") // no nested paths from a name
    .replace(/[^a-zA-Z0-9 ._-]/g, "")
    .replace(/\s+/g, "_");
  return cleaned || fallback;
}

function splitExt(fileName = "") {
  const idx = fileName.lastIndexOf(".");
  if (idx <= 0) return { base: fileName, ext: "" };
  return { base: fileName.slice(0, idx), ext: fileName.slice(idx + 1) };
}

function isDuplicateStorageError(error) {
  const msg = (error?.message || "").toLowerCase();
  return msg.includes("already exists") || msg.includes("duplicate");
}

// Uploads `file` into `folder`, using `file.name` as the object name. If that
// name is already taken in the folder, retries as "name-2.ext", "name-3.ext"…
async function uploadWithReadableName(folder, originalFileName, file, { upsert = false } = {}) {
  const { base, ext } = splitExt(safeSegment(originalFileName, "template"));
  const suffix = ext ? `.${ext}` : "";
  const maxAttempts = 25;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateName = attempt === 0 ? `${base}${suffix}` : `${base}-${attempt + 1}${suffix}`;
    const path = `${folder}/${candidateName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert });
    if (!error) return path;
    if (upsert || !isDuplicateStorageError(error) || attempt === maxAttempts - 1) {
      throw new Error(error.message);
    }
    // name taken — loop and try the next suffix
  }
  throw new Error("Could not find an available file name after several attempts.");
}

// ── Fetch all templates (Admin) ───────────────────────────────────────────────
export async function fetchAllTemplates() {
  const { data, error } = await supabase
    .from("templates")
    .select(TEMPLATE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Fetch templates visible to the current user (non-admin) ───────────────────
// Relies entirely on the Row Level Security (RLS) policy in the database!
export async function fetchTemplatesForUser() {
  const { data, error } = await supabase
    .from("templates")
    .select(TEMPLATE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Upload a new template ─────────────────────────────────────────────────────
// `sectionName` is used only to pick the storage folder — pass it along from
// whatever section list the caller already has in memory.
export async function uploadTemplate({ name, sectionId, sectionName, file, userId }) {
  const folder = safeSegment(sectionName);

  // 1. Upload file to storage under {section}/{original-file-name}
  const storagePath = await uploadWithReadableName(folder, file.name, file);

  // 2. Insert record into the templates table
  const payload = {
    name: name.trim(),
    file_name: file.name,
    storage_path: storagePath,
    section_id: sectionId || null,
    division_id: null, // derived from section — kept null to avoid drift
    created_by: userId,
  };

  const { data, error: insertError } = await supabase
    .from("templates")
    .insert(payload)
    .select(TEMPLATE_SELECT)
    .single();

  if (insertError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }

  return data;
}

// ── Update template metadata (name / section assignment) ──────────────────────
// If the section changed, the file is moved to the matching folder so the
// bucket layout stays consistent with the DB. `currentStoragePath` and
// `newSectionName` let us do that move; if either is omitted the file is
// simply left where it is.
export async function updateTemplate(
  templateId,
  { name, sectionId, currentStoragePath, newSectionName }
) {
  let storagePath = currentStoragePath;

  if (currentStoragePath && newSectionName !== undefined) {
    const newFolder = safeSegment(newSectionName);
    const fileNamePart = currentStoragePath.split("/").pop();
    const currentFolder = currentStoragePath.split("/").slice(0, -1).join("/");

    if (newFolder !== currentFolder) {
      const targetPath = `${newFolder}/${fileNamePart}`;
      const { error: moveError } = await supabase.storage
        .from(BUCKET)
        .move(currentStoragePath, targetPath);

      if (!moveError) {
        storagePath = targetPath;
      }
      // If the move fails (e.g. name collision in the target folder), we
      // silently keep the old path rather than failing the whole edit —
      // the metadata update below still goes through.
    }
  }

  const { data, error } = await supabase
    .from("templates")
    .update({
      name: name.trim(),
      section_id: sectionId || null,
      division_id: null,
      ...(storagePath !== currentStoragePath ? { storage_path: storagePath } : {}),
    })
    .eq("id", templateId)
    .select(TEMPLATE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Replace the uploaded file for an existing template ────────────────────────
// `sectionName` places the new file in the correct folder (in case the
// template's section changed since it was first uploaded).
export async function replaceTemplateFile(templateId, { file, oldStoragePath, sectionName }) {
  const folder = safeSegment(sectionName) || (oldStoragePath ? oldStoragePath.split("/").slice(0, -1).join("/") : "unassigned");

  const newStoragePath = await uploadWithReadableName(folder, file.name, file);

  // Update DB record
  const { data, error: updateError } = await supabase
    .from("templates")
    .update({ file_name: file.name, storage_path: newStoragePath })
    .eq("id", templateId)
    .select(TEMPLATE_SELECT)
    .single();

  if (updateError) {
    await supabase.storage.from(BUCKET).remove([newStoragePath]);
    throw new Error(updateError.message);
  }

  // Delete old file (best-effort, don't throw if it fails)
  if (oldStoragePath && oldStoragePath !== newStoragePath) {
    await supabase.storage.from(BUCKET).remove([oldStoragePath]).catch(() => {});
  }

  return data;
}

// ── Delete a template ─────────────────────────────────────────────────────────
export async function deleteTemplate(templateId, storagePath) {
  // Remove from DB first
  const { error: dbError } = await supabase
    .from("templates")
    .delete()
    .eq("id", templateId);

  if (dbError) throw new Error(dbError.message);

  // Remove from storage (best-effort)
  if (storagePath) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
  }
}

// ── Generate a signed download URL (60 min expiry) ───────────────────────────
export async function getTemplateDownloadUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60); // 1 hour

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// ── Fetch all sections (for admin assignment dropdown) ────────────────────────
export async function fetchAllSections() {
  const { data, error } = await supabase
    .from("sections")
    .select("id, name, division_id, divisions(id, name)")
    .order("id", { ascending: true }); // ordering by id as seen in user screenshot

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Fetch all divisions (for admin assignment dropdown) ───────────────────────
export async function fetchAllDivisions() {
  const { data, error } = await supabase
    .from("divisions")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Fetch templates assigned to one specific section ──────────────────────────
// TemplatesModal is always opened from inside a section folder, so it should
// always scope to that section's id — regardless of the viewer's role.
// Admins get the unscoped, all-divisions view only on the standalone
// Templates management page (via fetchAllTemplates).
export async function fetchTemplatesForSection(sectionId) {
  if (!sectionId) return [];
  const { data, error } = await supabase
    .from("templates")
    .select(TEMPLATE_SELECT)
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}