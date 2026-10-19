# Thesis Audit — Chapters 1-5 vs Developed System

Source: `C:\Users\Robb\Downloads\Capstone Files\4th Year 2026\ONEDATA-Capstone-Chapter-1-5-FINAL-DRAFT-1.docx` (132k chars, 1991 lines extracted 2026-09-24)
Code truth: `src/` + `supabase/` + `server/` (see `PANEL_DEFENSE_GUIDE.md`, `SYSTEM_CAPABILITIES.md`)

Date saved: 2026-09-24
Purpose: Reference for next chats — what paper claims vs what system actually does.

## P0 Critical (panel will fail if not fixed)

### 1. Public / Division / Admin Dashboards do not exist
- Paper Ch1 Objectives, Ch4.2, Ch5: Public Dashboard + Division Personnel Dashboard + Administrative Dashboard, separate views per user group.
- Code: No public dashboard. `/` landing preview uses hard-coded demo values (`useLandingStats.js`). `/dashboard` (`src/pages/Dashboard/Dashboard.jsx`) is one identical view for all 4 roles, filters only by `school_year`, no `division_id/section_id` scoping.
- Fix: Rewrite to 1 global division-wide dashboard. Move public dashboard to Limitations / Future work.

### 2. Roles — school heads / public users / IT admin
- Paper IPO Input + Ch3 Requirements `User Login`: IT administrators, SDO personnel, school heads, focal persons + public users with limited access.
- Code: exactly 4 roles in `src/utils/accessControl.js:5` — `administrator, division_focal, section_focal, section_personnel`. No principal, no public role. Routes in `src/App.jsx:194-223`.
- Fix: Standardize to 4 roles everywhere. Delete school heads / public users.

### 3. Dashboard filtering by division / section / category
- Paper Ch4.2: filter by school year, division, section, data category.
- Code: year selector + compare only via `src/utils/schoolYearsApi.js`.
- Fix: Change to school-year only + disclose as Limitation.

### 4. Historical records immutable — FALSE
- Paper Limitations: will not permit users to change historical records.
- Code: Excel in-place edit `FileEditModal`, replace-upload `upsert:true + deleteParsedDataForFile` (`UploadFilesPage.jsx:1015`), bulk delete, 14d recycle bin. Fully mutable.
- Fix: Reword to archived school years separated by filter; files in active year editable per role. No version history kept.

### 5. Audit export as PDF — FALSE
- Paper Fig 3.4/3.5: export filtered log as printable PDF.
- Code: `src/pages/AuditLogs/AuditLogs.jsx:40-278` is `window.open().document.write().print()` HTML only. `.limit(200)`, no IP column.
- Fix: Say print-friendly browser export, disclose 200-row UI limit.

### 6. Backend description misleading
- Paper Ch4.2: Node.js + Express handles auth, file ops, permissions.
- Code: Supabase Auth/DB/Storage/Edge does 95%. `server/index.js:23,97` only `create-user / delete-user + Brevo`.
- Fix: Supabase = primary backend, Express = user-provisioning helper.

## P1 Thesis internal errors

- Fig 3.4 = Fig 3.5 identical Audit Logs Flowchart paragraph. Delete one.
- Tables 3.1-3.10 inside Chapter IV (should be 4.x). Fig 4.1-4.6 used twice (Ch3 dev list + Ch4.2 presentation). Renumber.
- Settings flowchart says update name + ID directly. Code `SettingsPage.jsx`: display-name read-only, only password via `send-password-reset` + email via `send-change-email` with re-auth.
- Upload flowchart says preview extracted data -> confirm -> save. Code `UploadFilesPage.jsx:444-1083`: validate then upload + sync, no preview-confirm step.
- Advanced search claim. Code: `file_name / uploader ilike` only (`RepositoryFolderDetailPage.jsx:1249`), tabs All/PDF/Excel/Word. No content search, no date/size/verified filter.

## What matches (keep as-is)

RBAC 4 roles, Division > Section > Files repository, structured ingestion enrollment / classrooms / seats / teachers / textbooks / CESPES / KPI, verification stamp `generate-verified-pdf`, templates, school-year lifecycle RPCs, feedback threads, access-request workflow, audit logging, manual black-box highlights testing.
