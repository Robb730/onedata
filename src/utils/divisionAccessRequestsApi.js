// divisionAccessRequestsApi.js
// Scope: division-level "let me into this division folder" requests, reviewed
// by division_focal (own division only) or admin (any division). Distinct
// from accessRequestsApi.js, which handles per-file / per-section requests.

import { supabase } from "../lib/supabaseClient";

export function canApproveDivisionAccessRequests(userProfile) {
  return (
    userProfile?.role === "division_focal" || userProfile?.role === "admin"
  );
}

// Returns requests scoped to what this user is allowed to review.
// division_focal -> only their own division_id
// admin -> all divisions
export async function fetchScopedDivisionRequests(userProfile) {
  if (!canApproveDivisionAccessRequests(userProfile)) return [];

  let query = supabase
    .from("division_access_request")
    .select(
      `
      id, division_id, requester_id, requested_by_name, message, status,
      deny_reason, reviewed_by, reviewed_at, created_at, updated_at,
      requester:requester_id ( id, role, section_id,
        sections:section_id ( name )
      ),
      divisions:division_id ( id, name )
    `,
    )
    .order("created_at", { ascending: false });

  if (userProfile.role === "division_focal") {
    query = query.eq("division_id", userProfile.division_id);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createDivisionAccessRequest({
  divisionId,
  userProfile,
  message,
}) {
  if (!userProfile?.id)
    throw new Error("You must be signed in to request access.");

  const { data, error } = await supabase
    .from("division_access_request")
    .upsert(
      {
        division_id: divisionId,
        requester_id: userProfile.id,
        requested_by_name: userProfile.full_name,
        message: message?.trim() || null,
        status: "pending",
        deny_reason: null,
        reviewed_by: null,
        reviewed_at: null,
      },
      { onConflict: "division_id,requester_id" },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function approveDivisionRequest(request, userProfile) {
  const { error } = await supabase
    .from("division_access_request")
    .update({
      status: "approved",
      reviewed_by: userProfile.id,
      reviewed_at: new Date().toISOString(),
      deny_reason: null,
    })
    .eq("id", request.id);

  await pushNotification({
    recipientIds: [request.requester_id],
    type: "division_access_request_approved",
    title: "Division access approved",
    content: `Your request for ${request.divisions?.name} was approved`,
  });
  if (error) throw new Error(error.message);
}

export async function denyDivisionRequest(request, userProfile, reason) {
  const { error } = await supabase
    .from("division_access_request")
    .update({
      status: "denied",
      reviewed_by: userProfile.id,
      reviewed_at: new Date().toISOString(),
      deny_reason: reason?.trim() || null,
    })
    .eq("id", request.id);

  await pushNotification({
    recipientIds: [request.requester_id],
    type: "division_access_request_denied",
    title: "Division access denied",
    content: `Your request for ${request.divisions?.name} was denied`,
  });
  if (error) throw new Error(error.message);
}

export async function revokeDivisionAccess(request, userProfile) {
  const { error } = await supabase
    .from("division_access_request")
    .update({
      status: "revoked",
      reviewed_by: userProfile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", request.id);
  await pushNotification({
    recipientIds: [request.requester_id],
    type: "division_access_request_revoked",
    title: "Division access revoked",
    content: `Your request for ${request.divisions?.name} was revoked`,
  });
  if (error) throw new Error(error.message);
}

// Used by canAccessDivision (accessControl.js) to check for a live grant.
export async function hasApprovedDivisionAccess(userId, divisionId) {
  const { data, error } = await supabase
    .from("division_access_request")
    .select("id")
    .eq("requester_id", userId)
    .eq("division_id", divisionId)
    .eq("status", "approved")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

// Returns the current user's own request for this division, if any
// (whatever its status — pending/approved/denied/revoked), or null.
export async function fetchOwnDivisionRequest(userId, divisionId) {
  if (!userId || divisionId == null) return null;

  const { data, error } = await supabase
    .from("division_access_request")
    .select("id, status, deny_reason, created_at")
    .eq("requester_id", userId)
    .eq("division_id", divisionId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data;
}
