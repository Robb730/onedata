// Central place for role-based access rules across the Repository.
//
// Assumed shape of `userProfile`:
//   {
//     role: "admin" | "division_focal" | "sectionFocal" | "personnel",
//     division_id: <uuid|number>,  // division the user belongs to
//     section_id: <uuid|number>,   // section the user belongs to (focal/personnel only)
//   }

export const ROLES = {
  ADMIN: "admin",
  DIVISION_FOCAL: "division_focal",
  SECTION_FOCAL: "section_focal",     // fixed: was "sectionFocal"
  PERSONNEL: "section_personnel",     // fixed: was "personnel"
};

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

/**
 * Can this user open the division folder-listing page for `divisionId`?
 * Admins: always. Everyone else: only their own division.
 */
export function canAccessDivision(userProfile, divisionId) {
  if (!userProfile) return false;
  const { role, division_id } = userProfile;

  if (role === ROLES.ADMIN) return true;
  if (
    role === ROLES.DIVISION_FOCAL ||
    role === ROLES.SECTION_FOCAL ||
    role === ROLES.PERSONNEL
  ) {
    return sameId(division_id, divisionId);
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
    if (!sameId(division_id, section.division_id)) return "blocked";
    return sameId(section_id, section.id) ? "full" : "locked";
  }

  return "blocked";
}