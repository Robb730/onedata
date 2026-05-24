import { FolderOpen } from "lucide-react";

function createFolderFiles(folderName, owner, baseDate) {
  const normalizedName = folderName.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "FOLDER";

  return [
    {
      id: `${normalizedName}-1`,
      name: `${folderName} Overview 2026.pdf`,
      type: "PDF",
      size: "2.4 MB",
      date: baseDate,
      uploader: owner,
      status: "Approved",
    },
    {
      id: `${normalizedName}-2`,
      name: `${folderName} Tracker.xlsx`,
      type: "Excel",
      size: "1.3 MB",
      date: "Feb 18, 2026",
      uploader: owner,
      status: "Approved",
    },
    {
      id: `${normalizedName}-3`,
      name: `${folderName} Notes.docx`,
      type: "Word",
      size: "862 KB",
      date: "Feb 15, 2026",
      uploader: owner,
      status: "For Review",
    },
  ];
}

function createInventoryFileSet(fileDefs) {
  return fileDefs.map((file, index) => ({
    id: `${file.name}-${index + 1}`,
    name: file.name,
    type: file.type,
    size: file.size,
    date: file.date,
    uploader: file.uploader,
    status: file.status,
  }));
}

function createSectionFallbackFiles(folderName, owner, baseDate) {
  return createFolderFiles(folderName, owner, baseDate);
}

const SGOD_PLANNING_AND_RESEARCH_FILES = createInventoryFileSet([
  { name: "Annual Implementation Plan", type: "PDF", size: "4.8 MB", date: "Feb 16, 2026", uploader: "Hensley Santos", status: "Verified" },
  { name: "Research Proposal Template", type: "Document", size: "1.2 MB", date: "Feb 17, 2026", uploader: "John Hekusan Santos", status: "Verified" },
  { name: "Data Analysis Report Q4", type: "Spreadsheet", size: "3.6 MB", date: "Feb 18, 2026", uploader: "Hensley Santos", status: "Verified" },
  { name: "Strategic Plan 2026-2025", type: "PDF", size: "5.1 MB", date: "Feb 19, 2026", uploader: "Hensley Santos", status: "Verified" },
  { name: "Budget Forecast 2026.xls", type: "Spreadsheet", size: "2.8 MB", date: "Feb 20, 2026", uploader: "Hensley Santos", status: "Verified" },
  { name: "Survey Results January 2", type: "PDF", size: "1.9 MB", date: "Feb 21, 2026", uploader: "John Hekusan Santos", status: "Verified" },
  { name: "Performance Indicators F", type: "Spreadsheet", size: "1.5 MB", date: "Feb 22, 2026", uploader: "Hensley Santos", status: "Verified" },
  { name: "Policy Brief - Education R", type: "Document", size: "980 KB", date: "Feb 23, 2026", uploader: "John Hekusan Santos", status: "Unverified" },
  { name: "E1-2025-2026-Enrollment Report Q1", type: "PDF", size: "4.3 MB", date: "Feb 24, 2026", uploader: "Hensley Santos", status: "Verified" },
  { name: "E1-2024-2025-Student Masterlist", type: "Spreadsheet", size: "2.1 MB", date: "Feb 25, 2026", uploader: "Hensley Santos", status: "Verified" },
]);

const SGOD_SHARED_SECTION_FILES = {
  DRRM: createInventoryFileSet([
    { name: "DRRM Contingency Plan 2026", type: "PDF", size: "3.8 MB", date: "Feb 19, 2026", uploader: "Robbi Olazo", status: "Approved" },
    { name: "Safety Drill Schedule Q1", type: "Spreadsheet", size: "1.7 MB", date: "Feb 18, 2026", uploader: "Robbi Olazo", status: "Approved" },
    { name: "Emergency Response Contacts", type: "Document", size: "760 KB", date: "Feb 17, 2026", uploader: "Maria Santos", status: "Approved" },
  ]),
  "Education Facilities": createInventoryFileSet([
    { name: "Education Facilities Inventory 2026", type: "Spreadsheet", size: "4.3 MB", date: "Feb 15, 2026", uploader: "Jose Martinez", status: "For Review" },
    { name: "School Building Assessment", type: "PDF", size: "2.9 MB", date: "Feb 14, 2026", uploader: "Carlos Mendoza", status: "Approved" },
    { name: "Facilities Repair Tracker", type: "Spreadsheet", size: "1.1 MB", date: "Feb 13, 2026", uploader: "Carlos Mendoza", status: "Approved" },
  ]),
  HRD: createInventoryFileSet([
    { name: "HRD Training Plan SY 2025-2026", type: "PDF", size: "1.7 MB", date: "Feb 12, 2026", uploader: "Robbi Olazo", status: "Approved" },
    { name: "Teacher Development Tracker", type: "Spreadsheet", size: "2.4 MB", date: "Feb 11, 2026", uploader: "Anna Reyes", status: "Approved" },
    { name: "Onboarding Checklist", type: "Document", size: "860 KB", date: "Feb 10, 2026", uploader: "Anna Reyes", status: "Approved" },
  ]),
  "Learner Formation": createInventoryFileSet([
    { name: "Learner Formation Activity Docs", type: "PDF", size: "14.2 MB", date: "Feb 05, 2026", uploader: "Dr. Carmen Lopez", status: "Approved" },
    { name: "Learner Engagement Summary", type: "Spreadsheet", size: "2.2 MB", date: "Feb 04, 2026", uploader: "Dr. Carmen Lopez", status: "Approved" },
    { name: "Youth Formation Notes", type: "Document", size: "740 KB", date: "Feb 03, 2026", uploader: "Jose Martinez", status: "Approved" },
  ]),
  "Planning and Research": SGOD_PLANNING_AND_RESEARCH_FILES,
  "School Health": createInventoryFileSet([
    { name: "School Health Assessment Report Q1", type: "Spreadsheet", size: "2.1 MB", date: "Feb 17, 2026", uploader: "Dr. Carmen Lopez", status: "Approved" },
    { name: "Nutrition Monitoring Summary", type: "PDF", size: "1.4 MB", date: "Feb 16, 2026", uploader: "Dr. Carmen Lopez", status: "Approved" },
    { name: "Clinic Supply Inventory", type: "Spreadsheet", size: "980 KB", date: "Feb 15, 2026", uploader: "Robbi Olazo", status: "Approved" },
  ]),
  SIME: createInventoryFileSet([
    { name: "SIME Monitoring Report Feb 2026", type: "Document", size: "928 KB", date: "Feb 10, 2026", uploader: "Anna Reyes", status: "Approved" },
    { name: "Division Metrics Dashboard", type: "Spreadsheet", size: "2.7 MB", date: "Feb 09, 2026", uploader: "John Hekusan Santos", status: "Approved" },
    { name: "System Notes and Indicators", type: "PDF", size: "1.1 MB", date: "Feb 08, 2026", uploader: "John Hekusan Santos", status: "Approved" },
  ]),
  SMN: createInventoryFileSet([
    { name: "SMN Implementation Summary", type: "PDF", size: "1.4 MB", date: "Feb 03, 2026", uploader: "Robbi Olazo", status: "Approved" },
    { name: "SMN Activity Tracker", type: "Spreadsheet", size: "1.3 MB", date: "Feb 02, 2026", uploader: "Elena Cruz", status: "Approved" },
    { name: "Messaging Notes", type: "Document", size: "620 KB", date: "Feb 01, 2026", uploader: "Elena Cruz", status: "Approved" },
  ]),
  Sports: createInventoryFileSet([
    { name: "Sports Program Accomplishment Q1", type: "PDF", size: "2.6 MB", date: "Feb 07, 2026", uploader: "Jose Martinez", status: "Approved" },
    { name: "Intramurals Schedule", type: "Spreadsheet", size: "1.8 MB", date: "Feb 06, 2026", uploader: "Miguel Reyes", status: "Approved" },
    { name: "Athlete Roster", type: "Document", size: "870 KB", date: "Feb 05, 2026", uploader: "Miguel Reyes", status: "Approved" },
  ]),
};

const OSDS_SHARED_SECTION_FILES = {
  "Administrative Services": createInventoryFileSet([
    { name: "Administrative Services Report Q4", type: "Spreadsheet", size: "1.8 MB", date: "Jan 28, 2026", uploader: "Carlos Mendoza", status: "Approved" },
    { name: "Records Management Checklist", type: "Document", size: "860 KB", date: "Jan 27, 2026", uploader: "Hensley Santos", status: "Approved" },
    { name: "Office Services Summary", type: "PDF", size: "2.2 MB", date: "Jan 26, 2026", uploader: "Hensley Santos", status: "Approved" },
  ]),
  "Budget and Finance": createInventoryFileSet([
    { name: "Budget Forecast SY 2025-2026", type: "Excel", size: "2.9 MB", date: "Feb 14, 2026", uploader: "Carlos Mendoza", status: "Approved" },
    { name: "Finance Disbursement Vouchers Q1", type: "PDF", size: "3.4 MB", date: "Jan 15, 2026", uploader: "Carlos Mendoza", status: "Approved" },
    { name: "Procurement Plan 2026", type: "Excel", size: "1.2 MB", date: "Jan 10, 2026", uploader: "Hensley Santos", status: "Approved" },
  ]),
  ICT: createInventoryFileSet([
    { name: "ICT Infrastructure Report Q1", type: "Document", size: "743 KB", date: "Feb 10, 2026", uploader: "Pedro Reyes", status: "For Review" },
    { name: "System Uptime Metrics", type: "Spreadsheet", size: "1.6 MB", date: "Feb 09, 2026", uploader: "Pedro Reyes", status: "Approved" },
    { name: "Device Inventory", type: "Spreadsheet", size: "1.1 MB", date: "Feb 08, 2026", uploader: "Pedro Reyes", status: "Approved" },
  ]),
  Legal: createInventoryFileSet([
    { name: "Legal Services Case Summary 2025", type: "PDF", size: "2.2 MB", date: "Feb 07, 2026", uploader: "Hensley Santos", status: "Approved" },
    { name: "Compliance Review Notes", type: "Document", size: "910 KB", date: "Feb 06, 2026", uploader: "Hensley Santos", status: "Approved" },
    { name: "Policy Reference Index", type: "Spreadsheet", size: "1.5 MB", date: "Feb 05, 2026", uploader: "Hensley Santos", status: "Approved" },
  ]),
};

const CID_SHARED_SECTION_FILES = {
  "District Instructional Supervision": createInventoryFileSet([
    { name: "District Instructional Supervision Plan 2025", type: "PDF", size: "2.4 MB", date: "Feb 20, 2026", uploader: "Juan Paolo", status: "Approved" },
    { name: "School Visit Tracker", type: "Spreadsheet", size: "1.1 MB", date: "Feb 19, 2026", uploader: "Maria Santos", status: "Approved" },
    { name: "Supervision Checklist", type: "Document", size: "856 KB", date: "Feb 18, 2026", uploader: "Juan Paolo", status: "Approved" },
  ]),
  "Inclusive Education": createInventoryFileSet([
    { name: "Inclusive Education Guidelines 2026", type: "Document", size: "856 KB", date: "Feb 15, 2026", uploader: "Juan Paolo", status: "Approved" },
    { name: "Learner Support Summary", type: "Spreadsheet", size: "3.2 MB", date: "Feb 14, 2026", uploader: "Anna Reyes", status: "For Review" },
    { name: "Inclusion Policy Brief", type: "PDF", size: "1.3 MB", date: "Feb 13, 2026", uploader: "Juan Paolo", status: "Approved" },
  ]),
  "Learning Areas": createInventoryFileSet([
    { name: "Learning Areas Curriculum Map Q1", type: "Excel", size: "1.1 MB", date: "Feb 18, 2026", uploader: "Maria Santos", status: "Approved" },
    { name: "Quarterly Learning Tracker", type: "Spreadsheet", size: "3.2 MB", date: "Feb 12, 2026", uploader: "Anna Reyes", status: "For Review" },
    { name: "Curriculum Coverage Notes", type: "Document", size: "900 KB", date: "Feb 11, 2026", uploader: "Juan Paolo", status: "Approved" },
  ]),
  LRMDS: createInventoryFileSet([
    { name: "LRMDS Resource Inventory", type: "Excel", size: "3.2 MB", date: "Feb 12, 2026", uploader: "Anna Reyes", status: "For Review" },
    { name: "Learning Resource Request Log", type: "Spreadsheet", size: "1.3 MB", date: "Feb 11, 2026", uploader: "Jose Martinez", status: "Approved" },
    { name: "Resource Distribution Summary", type: "PDF", size: "1.7 MB", date: "Feb 10, 2026", uploader: "Juan Paolo", status: "Approved" },
  ]),
};

export const REPOSITORY_STATIC_FILES_BY_FOLDER_NAME = {
  ...SGOD_SHARED_SECTION_FILES,
  ...OSDS_SHARED_SECTION_FILES,
  ...CID_SHARED_SECTION_FILES,
};

export const REPOSITORY_TOP_LEVEL_FILES_BY_NAME = {
  ["Curriculum Implementation Division"]: createInventoryFileSet([
    { name: "District Instructional Supervision Plan 2025", type: "PDF", size: "2.4 MB", date: "Feb 20, 2026", uploader: "Juan Paolo", status: "Approved" },
    { name: "Learning Areas Curriculum Map Q1", type: "Excel", size: "1.1 MB", date: "Feb 18, 2026", uploader: "Maria Santos", status: "Approved" },
    { name: "Inclusive Education Guidelines 2026", type: "Document", size: "856 KB", date: "Feb 15, 2026", uploader: "Juan Paolo", status: "Approved" },
    { name: "LRMDS Resource Inventory", type: "Excel", size: "3.2 MB", date: "Feb 12, 2026", uploader: "Anna Reyes", status: "For Review" },
    { name: "Q1 Learner Assessment Report", type: "PDF", size: "4.7 MB", date: "Feb 10, 2026", uploader: "Juan Paolo", status: "Approved" },
    { name: "Teacher Instructional Materials Checklist", type: "PDF", size: "1.3 MB", date: "Feb 08, 2026", uploader: "Jose Martinez", status: "Approved" },
  ]),
  ["Office of the Schools Division Superintendent"]: createInventoryFileSet([
    { name: "Annual Implementation Plan 2026", type: "PDF", size: "5.1 MB", date: "Feb 18, 2026", uploader: "Hensley Santos", status: "Approved" },
    { name: "SDO Baliwag Strategic Plan 2024-2028", type: "PDF", size: "8.3 MB", date: "Feb 16, 2026", uploader: "Hensley Santos", status: "Approved" },
    { name: "Budget Forecast SY 2025-2026", type: "Excel", size: "2.9 MB", date: "Feb 14, 2026", uploader: "Carlos Mendoza", status: "Approved" },
    { name: "Superintendent Memoranda Feb 2026", type: "PDF", size: "1.6 MB", date: "Feb 13, 2026", uploader: "Hensley Santos", status: "Approved" },
    { name: "ICT Infrastructure Report Q1", type: "Document", size: "743 KB", date: "Feb 10, 2026", uploader: "Pedro Reyes", status: "For Review" },
    { name: "Legal Services Case Summary 2025", type: "PDF", size: "2.2 MB", date: "Feb 07, 2026", uploader: "Hensley Santos", status: "Approved" },
  ]),
  ["School Governance and Operations Division"]: SGOD_PLANNING_AND_RESEARCH_FILES,
};

export const REPOSITORY_DIVISIONS = [
  {
    slug: "cid",
    name: "Curriculum Implementation Division",
    fileCount: 48,
    date: "Feb 20, 2026",
    owner: "Juan Paolo",
    route: "/repository/divisions/cid",
    folders: [
      { name: "District Instructional Supervision", fileCount: 52, date: "Feb 16, 2026", owner: "Juan Paolo" },
      { name: "Inclusive Education", fileCount: 39, date: "Feb 16, 2026", owner: "Juan Paolo" },
      { name: "Learning Areas", fileCount: 74, date: "Feb 16, 2026", owner: "Juan Paolo" },
      { name: "LRMDS", fileCount: 46, date: "Feb 16, 2026", owner: "Juan Paolo" },
    ],
  },
  {
    slug: "osds",
    name: "Office of the Schools Division Superintendent",
    fileCount: 152,
    date: "Feb 18, 2026",
    owner: "Hensley Santos",
    route: "/repository/divisions/osds",
    folders: [
      { name: "Administrative Services", fileCount: 44, date: "Feb 15, 2026", owner: "Hensley Santos" },
      { name: "Budget and Finance", fileCount: 61, date: "Feb 15, 2026", owner: "Hensley Santos" },
      { name: "ICT", fileCount: 33, date: "Feb 15, 2026", owner: "Hensley Santos" },
      { name: "Legal", fileCount: 27, date: "Feb 15, 2026", owner: "Hensley Santos" },
    ],
  },
  {
    slug: "sgod",
    name: "School Governance and Operations Division",
    fileCount: 67,
    date: "Feb 19, 2026",
    owner: "Robbi Olazo",
    route: "/repository/divisions/sgod",
    folders: [
      { name: "DRRM", fileCount: 48, date: "Feb 14, 2026", owner: "Maria Santos" },
      { name: "Education Facilities", fileCount: 32, date: "Feb 14, 2026", owner: "Carlos Mendoza" },
      { name: "HRD", fileCount: 55, date: "Feb 14, 2026", owner: "Anna Reyes" },
      { name: "Learner Formation", fileCount: 41, date: "Feb 14, 2026", owner: "Jose Dela Cruz" },
      { name: "Planning and Research", fileCount: 67, date: "Feb 14, 2026", owner: "Hensley Santos" },
      { name: "School Health", fileCount: 29, date: "Feb 14, 2026", owner: "Robbi Olazo" },
      { name: "SIME", fileCount: 38, date: "Feb 14, 2026", owner: "John Hekusan Santos" },
      { name: "SMN", fileCount: 22, date: "Feb 14, 2026", owner: "Elena Cruz" },
      { name: "Sports", fileCount: 18, date: "Feb 14, 2026", owner: "Miguel Reyes" },
    ],
  },
];

export const REPOSITORY_TOP_LEVEL_FOLDERS = REPOSITORY_DIVISIONS.map((division) => ({
  name: division.name,
  fileCount: division.fileCount,
  date: division.date,
  owner: division.owner,
  icon: FolderOpen,
  route: division.route,
  divisionSlug: division.slug,
  sectionCount: division.folders.length,
}));

export const REPOSITORY_DIVISION_BY_SLUG = Object.fromEntries(
  REPOSITORY_DIVISIONS.map((division) => [division.slug, division]),
);

export const REPOSITORY_DIVISION_FOLDERS_BY_SLUG = Object.fromEntries(
  REPOSITORY_DIVISIONS.map((division) => [division.slug, division.folders]),
);

export const REPOSITORY_FOLDER_LOOKUP_BY_NAME = Object.fromEntries(
  REPOSITORY_DIVISIONS.flatMap((division) => [
    [division.name, { ...division, kind: "division" }],
    ...division.folders.map((folder) => [
      folder.name,
      {
        ...folder,
        kind: "section",
        parentDivision: division.name,
        parentSlug: division.slug,
      },
    ]),
  ]),
);

export const REPOSITORY_SECTION_FILES_BY_NAME = Object.fromEntries(
  REPOSITORY_DIVISIONS.flatMap((division) =>
    division.folders.map((folder) => [
      folder.name,
      REPOSITORY_STATIC_FILES_BY_FOLDER_NAME[folder.name] || createSectionFallbackFiles(folder.name, folder.owner, folder.date),
    ]),
  ),
);
