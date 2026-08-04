// Central place for role-based access rules across the Repository.
//
// Assumed shape of `userProfile`:
//   {
//     role: "admin" | "division_focal" | "sectionFocal" | "personnel",
//     division_id: <uuid|number>,  // division the user belongs to
//     section_id: <uuid|number>,   // section the user belongs to (focal/personnel only)
//   }
import { supabase } from "../lib/supabaseClient";

/**
 * Resolves the division a user effectively belongs to.
 * - Trusts userProfile.division_id if present.
 * - Otherwise, for section-scoped roles, looks up division_id
 *   from the sections table using userProfile.section_id.
 */
export async function resolveUserDivisionId(userProfile) {
  if (!userProfile) return null;
  if (userProfile.division_id != null) return userProfile.division_id;

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
  SECTION_FOCAL: "section_focal",     // fixed: was "sectionFocal"
  PERSONNEL: "section_personnel",     // fixed: was "personnel"
};

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

/**
 * Can this user open the division folder-listing page for `divisionId`?
 * Admins: always. Everyone else: only their own division.
 */
export function canAccessDivision(userProfile, divisionId, resolvedDivisionId) {
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
    return sameId(effectiveDivisionId, divisionId);
  }
  return false;
}

/**
 * Access level for a specific section's file list.
 *   "full"    → view / download / edit / delete all enabled
 *   "locked"  → files are visible, actions are disabled
 *   "blocked" → user shouldn't be here at all → redirect to Access Restricted
 *
 * `section` must include at least { id, division_id }.
 */
export function getSectionAccessLevel(userProfile, section) {
  if (!userProfile || !section) return "blocked";
  const { role, division_id, section_id } = userProfile;

  if (role === ROLES.ADMIN) return "full";

  if (role === ROLES.DIVISION_FOCAL) {
    return sameId(division_id, section.division_id) ? "full" : "blocked";
  }

  if (role === ROLES.SECTION_FOCAL || role === ROLES.PERSONNEL) {
    // Section-scoped roles: section_id is the real source of truth.
    // Only fall back to comparing division_id if section_id is missing.
    if (section_id != null) {
      return sameId(section_id, section.id) ? "full" : "locked";
    }
    if (!sameId(division_id, section.division_id)) return "blocked";
    return "locked";
  }

  return "blocked";
}