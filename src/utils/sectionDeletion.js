import { supabase } from "../lib/supabaseClient";

export async function requestSectionDeletion({ sectionId, sectionName, divisionId, requestedBy, requestedByName }) {
  const { data, error } = await supabase
    .from("section_deletion_requests")
    .insert({
      section_id: sectionId,
      section_name: sectionName,
      division_id: divisionId,
      requested_by: requestedBy,
      requested_by_name: requestedByName,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPendingDeletionRequests(sectionIds) {
  if (!sectionIds.length) return {};
  const { data, error } = await supabase
    .from("section_deletion_requests")
    .select("id, section_id, status, requested_by_name, requested_at")
    .eq("status", "pending")
    .in("section_id", sectionIds);
  if (error) throw error;

  const bySection = {};
  (data || []).forEach((r) => { bySection[r.section_id] = r; });
  return bySection;
}

// Re-authenticates the current user without disturbing their session —
// signInWithPassword just re-verifies credentials for an already-signed-in user.
export async function reauthenticate(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Incorrect password. Please try again.");
}

export async function approveSectionDeletion({ requestId, sectionId, bucket = "files" }) {
  const { data: fileRows, error: filesError } = await supabase
    .from("files")
    .select("file_path")
    .eq("section_id", sectionId);
  if (filesError) throw filesError;

  const paths = (fileRows || []).map((f) => f.file_path).filter(Boolean);

  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(bucket).remove(paths);
    if (storageError) throw storageError;
  }

  const { error: rpcError } = await supabase.rpc("approve_section_deletion", {
    p_request_id: requestId,
  });
  if (rpcError) throw rpcError;
}

export async function declineSectionDeletion(requestId) {
  const { error } = await supabase.rpc("decline_section_deletion", {
    p_request_id: requestId,
  });
  if (error) throw error;
}