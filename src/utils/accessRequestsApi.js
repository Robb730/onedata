// accessRequestsApi.js
// Data layer for the approver-side "Access Requests" sidebar.
//
// Assumes the `file_access_request` table has been extended with the
// columns listed in the migration at the bottom of this file (deny_reason,
// reviewed_by, reviewed_by_name, reviewed_at). `status` now has 4 possible
// values: "pending" | "approved" | "denied" | "revoked".
//
// Scope rules (per product decision):
//   - section_focal   -> sees requests for files in their own section only
//   - division_focal  -> sees requests for files in every section under
//                         their division
//   - admin           -> sees everything, system-wide

import { supabase } from "../lib/supabaseClient";

export const APPROVER_ROLES = ["section_focal", "division_focal", "admin"];

export function canApproveAccessRequests(userProfile) {
  return APPROVER_ROLES.includes(userProfile?.role);
}

const REQUEST_SELECT = `
  id,
  file_id,
  section_id,
  requested_by,
  requested_by_name,
  message,
  status,
  deny_reason,
  reviewed_by,
  reviewed_by_name,
  reviewed_at,
  created_at,
  files (
    id, file_name, file_type, file_size, file_path, data_category
  ),
  sections (
    id, name, division_id, divisions ( id, name )
  ),
  requester:requested_by (
    id, full_name, role, email, division_id, section_id,
    divisions ( name ), sections ( name )
  )
`;

/**
 * Returns every file_access_request row this user is allowed to see,
 * newest first. Caller filters/derives tabs (pending/all/granted) client
 * side from this single fetch to avoid re-querying per tab.
 */
export async function fetchScopedRequests(userProfile) {
  if (!canApproveAccessRequests(userProfile)) return [];

  let query = supabase
    .from("file_access_request")
    .select(REQUEST_SELECT)
    .order("created_at", { ascending: false });

  if (userProfile.role === "section_focal") {
    query = query.eq("section_id", userProfile.section_id);
  } else if (userProfile.role === "division_focal") {
    const { data: divSections, error: sectionsErr } = await supabase
      .from("sections")
      .select("id")
      .eq("division_id", userProfile.division_id);
    if (sectionsErr) throw new Error(sectionsErr.message);
    const ids = (divSections || []).map((s) => s.id);
    // No sections under this division yet — short-circuit to empty result.
    if (ids.length === 0) return [];
    query = query.in("section_id", ids);
  }
  // admin: no additional filter — sees all sections/divisions.

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function approveRequest(request, approver) {
  const { error } = await supabase
    .from("file_access_request")
    .update({
      status: "approved",
      deny_reason: null,
      reviewed_by: approver?.id,
      reviewed_by_name: approver?.full_name ?? "Unknown",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", request.id);
  if (error) throw new Error(error.message);

  await logAudit(
    "Approve Access Request",
    request.files?.file_name,
    `Approved access for ${request.requested_by_name}`,
    approver,
  );
}

export async function denyRequest(request, approver, reason) {
  const { error } = await supabase
    .from("file_access_request")
    .update({
      status: "denied",
      deny_reason: reason?.trim() || null,
      reviewed_by: approver?.id,
      reviewed_by_name: approver?.full_name ?? "Unknown",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", request.id);
  if (error) throw new Error(error.message);

  await logAudit(
    "Deny Access Request",
    request.files?.file_name,
    `Denied access for ${request.requested_by_name}${
      reason ? ` — reason: ${reason}` : ""
    }`,
    approver,
  );
}

/**
 * Revoking sets status back to "revoked" (distinct from "denied" so the
 * requester's history reads correctly: they *had* access and it was
 * pulled, vs. they were never granted it). A revoked or denied request is
 * simply not "approved", so it stops granting access immediately, and the
 * requester is free to submit a brand-new request at any time — there's no
 * cooldown. Repeated denials/revocations are just visible in the "All"
 * history so an approver can see the pattern before deciding again.
 */
export async function revokeAccess(request, approver) {
  const { error } = await supabase
    .from("file_access_request")
    .update({
      status: "revoked",
      reviewed_by: approver?.id,
      reviewed_by_name: approver?.full_name ?? "Unknown",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", request.id);
  if (error) throw new Error(error.message);

  await logAudit(
    "Revoke Access",
    request.files?.file_name,
    `Revoked access from ${request.requested_by_name}`,
    approver,
  );
}

async function logAudit(action, fileName, details, approver) {
  const { error } = await supabase.from("audit_logs").insert({
    action,
    file_name: fileName ?? "Unknown file",
    details,
    performed_by: approver?.full_name ?? "Unknown",
    role: approver?.role ?? "Unknown",
    status: "Success",
  });
  if (error) console.error("Audit log failed:", error);
}

/*
-- MIGRATION: run once against file_access_request
alter table file_access_request
  add column if not exists deny_reason text,
  add column if not exists reviewed_by uuid references users(id),
  add column if not exists reviewed_by_name text,
  add column if not exists reviewed_at timestamptz;

-- status is expected to be one of: 'pending' | 'approved' | 'denied' | 'revoked'
*/
