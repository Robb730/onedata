import { supabase } from "../lib/supabaseClient";
import { hasApprovedDivisionAccess } from "./divisionAccessRequestsApi";

export async function resolveUserDivisionId(userProfile) {
  if (!userProfile) return null;
  if (userProfile.division_id != null) return userProfile.division_id;

  if (userProfile.division?.id != null) return userProfile.division.id;

  if (userProfile.section_id != null) {
    const { data, error } = await supabase
      .from("sections")
      .select("division_id")
      .eq("id", userProfile.section_id)
      .single();

    if (!error && data) return data.division_id;
  }

  return null;
}

export const ROLES = {
  ADMIN: "administrator",
  DIVISION_FOCAL: "division_focal",
  SECTION_FOCAL: "section_focal",
  PERSONNEL: "section_personnel",
};

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

/**
 * Can this user open the division folder-listing page for `divisionId`?
 * Admins: always. Own division: always. Otherwise: only with a live
 * approved division_access_request grant.
 */
export async function canAccessDivision(userProfile, divisionId, resolvedDivisionId) {
  if (!userProfile) return false;
  const { role } = userProfile;
  const effectiveDivisionId =
    resolvedDivisionId !== undefined ? resolvedDivisionId : userProfile.division_id;

  if (role === ROLES.ADMIN) return true;

  if (
    role === ROLES.DIVISION_FOCAL ||
    role === ROLES.SECTION_FOCAL ||
    role === ROLES.PERSONNEL
  ) {
    if (sameId(effectiveDivisionId, divisionId)) return true;
    return hasApprovedDivisionAccess(userProfile.id, divisionId);
  }

  return false;
}

/**
 * Access level for a specific section's file list.
 *   "full"    → view / download / edit / delete all enabled
 *   "locked"  → files are visible, view/download require a per-file
 *               request (or ride on an approved division-access grant
 *               that only gets you in the door, not automatic access)
 *   "blocked" → user shouldn't be here at all → redirect to Access Restricted
 *
 * `section` must include at least { id, division_id }.
 */
export async function getSectionAccessLevel(userProfile, section) {
  if (!userProfile || !section) return "blocked";
  const { role, division_id, section_id } = userProfile;

  if (role === ROLES.ADMIN) return "full";

  if (role === ROLES.DIVISION_FOCAL) {
    if (sameId(division_id, section.division_id)) return "full";
    const granted = await hasApprovedDivisionAccess(userProfile.id, section.division_id);
    return granted ? "locked" : "blocked";
  }

  if (role === ROLES.SECTION_FOCAL || role === ROLES.PERSONNEL) {
    if (section_id != null) {
      if (sameId(section_id, section.id)) return "full";
      return "locked"; // unchanged: these roles already get "locked" elsewhere
    }
    if (!sameId(division_id, section.division_id)) {
      const granted = await hasApprovedDivisionAccess(userProfile.id, section.division_id);
      return granted ? "locked" : "blocked";
    }
    return "locked";
  }

  return "blocked";
}

/**
 * Can this user see/open the Templates button + modal for this specific
 * section? Deliberately stricter than getSectionAccessLevel: a granted
 * ("locked") division-access request gets you into a section's files, but
 * it should NOT surface that section's (or division's) Templates button.
 *
 *   admin              → any section
 *   division_focal     → only sections within their own division
 *   section_focal /
 *   section_personnel  → only their own assigned section
 */
export function canViewSectionTemplates(userProfile, section) {
  if (!userProfile || !section) return false;
  const { role, division_id, section_id } = userProfile;

  if (role === ROLES.ADMIN) return true;
  if (role === ROLES.DIVISION_FOCAL) return sameId(division_id, section.division_id);
  if (role === ROLES.SECTION_FOCAL || role === ROLES.PERSONNEL) {
    return sameId(section_id, section.id);
  }
  return false;
}