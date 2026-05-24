# Repository Folder Inventory

This inventory is based on the current frontend mock data in the repository-related pages. It lists the division folders, their subfolders, and any files explicitly enumerated in the code, along with file types.

## 1) School Governance and Operations Division

Top-level folder: `School Governance and Operations Division`

Subfolders shown in `src/Pages/adminPage.jsx` and `src/Pages/SchoolGovernance.jsx`:

- `DRRM` - folder, 48 files shown in the repository card
- `EDUCATION FACILITIES` - folder, 32 files shown in the repository card
- `HRD` - folder, 55 files shown in the repository card
- `LEARNER FORMATION` - folder, 41 files shown in the repository card
- `PLANNING AND RESEARCH` - folder, 67 files shown in the repository card
- `SCHOOL HEALTH` - folder, 29 files shown in the repository card
- `SIME` - folder, 38 files shown in the repository card
- `SMN` - folder, 22 files shown in the repository card
- `SPORTS` - folder, 18 files shown in the repository card

### PLANNING AND RESEARCH files shown in `src/Pages/PlanningResearch.jsx`

These are the files explicitly listed in the planning and research page mock data:

- `Annual Implementation Plan` - PDF
- `Research Proposal Template` - Document
- `Data Analysis Report Q4` - Spreadsheet
- `Strategic Plan 2026-2025` - PDF
- `Budget Forecast 2026.xls` - Spreadsheet
- `Survey Results January 2` - PDF
- `Performance Indicators F` - Spreadsheet
- `Policy Brief - Education R` - Document

### PLANNING AND RESEARCH files shown in `src/Pages/FolderDetail.jsx`

The folder detail mock data expands the Planning and Research section with code-prefixed files:

- `Annual Implementation Plan` - PDF
- `Research Proposal Template` - Document
- `Policy Brief - Education Reform` - Document
- `E1-2025-2026-Enrollment Report Q1` - PDF
- `E1-2024-2025-Student Masterlist` - Spreadsheet
- `E1-2025-2026-Enrollment Summary` - Spreadsheet
- `BD-2025-2026-Budget Forecast 2026` - Spreadsheet
- `BD-2024-2025-Annual Budget Report` - PDF
- `PR-2024-2025-Performance Indicators` - Spreadsheet
- `PR-2025-2026-KPI Dashboard Q1` - PDF

### Notes for SGOD

- The repository shell shows all nine SGOD subfolders.
- Only the Planning and Research section has explicit file lists in the current source files.
- The other SGOD sections currently show folder cards with counts, dates, and owners, but not a file-by-file inventory in the code.

## 2) Office of the Schools Division Superintendent

Top-level folder: `Office of the Schools Division Superintendent`

Subfolders shown in `src/Pages/adminPage.jsx`:

- `ADMINISTRATIVE SERVICES` - folder, 44 files shown in the repository card
- `BUDGET AND FINANCE` - folder, 61 files shown in the repository card
- `ICT` - folder, 33 files shown in the repository card
- `LEGAL` - folder, 27 files shown in the repository card

### Notes for OSDS

- The current frontend source lists the subfolder names and file counts only.
- No per-file inventory is defined in the existing repository pages for this division.

## 3) Curriculum Implementation Division

Top-level folder: `Curriculum Implementation Division`

Subfolders shown in `src/Pages/adminPage.jsx`:

- `DISTRICT INSTRUCTIONAL SUPERVISION` - folder, 52 files shown in the repository card
- `INCLUSIVE EDUCATION` - folder, 39 files shown in the repository card
- `LEARNING AREAS` - folder, 74 files shown in the repository card
- `LRMDS` - folder, 46 files shown in the repository card

### Notes for CID

- The current frontend source lists the subfolder names and file counts only.
- No per-file inventory is defined in the existing repository pages for this division.

## 4) How the inventory is used in the app

- `src/Pages/Repository.jsx` defines the top-level division cards and their role restrictions.
- `src/Pages/adminPage.jsx` defines the subfolder lists for each division and decides where clicks navigate.
- `src/Pages/SchoolGovernance.jsx` shows the SGOD subfolder view.
- `src/Pages/PlanningResearch.jsx` shows a file list for the Planning and Research section.
- `src/Pages/FolderDetail.jsx` shows the more detailed section folder file mock data, including coded filenames and file types.

## 5) Quick summary

- SGOD is the only division with a visible section-by-section breakdown in the repository UI.
- Planning and Research is the only section with explicit file names listed in separate page mock data.
- FolderDetail adds a richer file inventory for the same section, including code-prefixed files and file types.
- OSDS and CID currently expose their folders and counts, but not a full file list in the code.
