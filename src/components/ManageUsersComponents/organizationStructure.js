/**
 * Structural organization categories for the Manage Users directory.
 * These are UI labels only — not user records, counts, or assignments.
 */
export const ORGANIZATION_DIVISIONS = [
  {
    id: "cid",
    name: "Curriculum Implementation Division",
    shortName: "CID",
    sections: [
      "District Instructional Supervision",
      "Inclusive Education",
      "Learning Areas",
      "LRMDS",
    ],
  },
  {
    id: "osds",
    name: "Office of the Schools Division Superintendent",
    shortName: "OSDS",
    sections: [
      "Administrative Services",
      "Budget and Finance",
      "ICT",
      "Legal",
    ],
  },
  {
    id: "sgod",
    name: "School Governance and Operations Division",
    shortName: "SGOD",
    sections: [
      "DRRM",
      "Education Facilities",
      "HRD",
      "Learner Formation",
      "Planning and Research",
      "School Health",
      "SIME",
      "SMN",
      "Sports",
    ],
  },
];

export function namesMatch(a, b) {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

export function isAdministrator(user) {
  return user?.role === "administrator" || namesMatch(user?.division, "Administrator");
}

export function isDivisionFocal(user) {
  return user?.role === "division_focal";
}

export function isSectionScoped(user) {
  return user?.role === "section_focal" || user?.role === "section_personnel";
}

export function belongsToDivision(user, divisionName) {
  if (isAdministrator(user)) return false;
  return namesMatch(user?.division, divisionName);
}

export function belongsToSection(user, sectionName) {
  if (isAdministrator(user) || isDivisionFocal(user)) return false;
  return namesMatch(user?.section, sectionName);
}

export function getDivisionShortName(divisionName) {
  return (
    ORGANIZATION_DIVISIONS.find((d) => namesMatch(d.name, divisionName))
      ?.shortName ?? null
  );
}

/** Client-side search over the already-loaded user list. */
export function userMatchesQuery(user, query, getRoleDisplay) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;

  const roleLabel = getRoleDisplay ? getRoleDisplay(user.role) : user.role;
  const shortName = getDivisionShortName(user.division);

  return [
    user.name,
    user.idNumber,
    user.email,
    user.division,
    user.section,
    user.role,
    roleLabel,
    shortName,
  ].some((value) => String(value || "").toLowerCase().includes(q));
}
