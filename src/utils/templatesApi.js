// templatesApi.js
// All database + storage operations for the Templates module.
//
// Storage bucket: "excel-templates"   (create this in Supabase Dashboard)
// Database table: "templates"         (see supabase SQL in walkthrough.md)

import { supabase } from "../lib/supabaseClient";

const BUCKET = "excel-templates";

// ── Shared select fragment ────────────────────────────────────────────────────
const TEMPLATE_SELECT = `
  id,
  name,
  file_name,
  storage_path,
  section_id,
  division_id,
  created_at,
  created_by,
  section:sections ( id, name ),
  division:divisions ( id, name )
`;

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
export async function uploadTemplate({ name, sectionId, divisionId, file, userId }) {
  // 1. Upload file to storage
  const ext = file.name.split(".").pop();
  const storagePath = `${Date.now()}_${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  // 2. Insert record into the templates table
  const payload = {
    name: name.trim(),
    file_name: file.name,
    storage_path: storagePath,
    section_id: sectionId || null,
    division_id: divisionId || null,
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

// ── Update template metadata (name / assignment) ──────────────────────────────
export async function updateTemplate(templateId, { name, sectionId, divisionId }) {
  const { data, error } = await supabase
    .from("templates")
    .update({
      name: name.trim(),
      section_id: sectionId || null,
      division_id: divisionId || null,
    })
    .eq("id", templateId)
    .select(TEMPLATE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Replace the uploaded file for an existing template ────────────────────────
export async function replaceTemplateFile(templateId, { file, oldStoragePath }) {
  const ext = file.name.split(".").pop();
  const newStoragePath = `${Date.now()}_${crypto.randomUUID()}.${ext}`;

  // Upload new file
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(newStoragePath, file, { upsert: false });

  if (uploadError) throw new Error(uploadError.message);

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
  if (oldStoragePath) {
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
