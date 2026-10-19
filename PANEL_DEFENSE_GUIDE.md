# ONEdata — Panel Defense Guide

> **Code-grounded audit — 2026-09-13**
> Read directly from `src/` + `supabase/` + `server/` — **not** from stale `.md` files.
> `SYSTEM_DOCUMENTATION.md` is `v0.0.0 July 2026` (outdated). `SYSTEM_CAPABILITIES.md` is closer but still optimistic. This file is the code truth.

---

## Table of Contents

1. [How the System Actually Works](#1-how-the-system-actually-works)
2. [Tech Stack](#2-tech-stack)
3. [Roles & Access Model](#3-roles--access-model)
4. [Core Modules & Data Flow](#4-core-modules--data-flow)
5. [What Actually Works (Strengths to Lead With)](#5-what-actually-works-strengths-to-lead-with)
6. [What's Missing / Broken (Panel Attack Surface)](#6-whats-missing--broken-panel-attack-surface)
7. [Unique Features to Add (Thesis Differentiators)](#7-unique-features-to-add-thesis-differentiators)
8. [Panel Hard Questions & Model Answers](#8-panel-hard-questions--model-answers)
9. [Prioritized Roadmap Before Defense](#9-prioritized-roadmap-before-defense)
10. [Defense Tactics & Script](#10-defense-tactics--script)
11. [Appendix: Key File References](#11-appendix-key-file-references)

---

## 1. How the System Actually Works

**ONEdata — SDO Baliwag — Division → Section Document Repository + Structured-Data Analytics Platform**

Centralized file repository organized as **Divisions → Sections (folders)** with fine-grained access control, plus structured Excel ingestion that feeds the Dashboard.

### High-Level Architecture

```
Landing (/) → Login → Protected AppLayout (Sidebar + TopHeader + MobileBottomNav)
                    ├─ Dashboard          (global analytics, all roles)
                    ├─ Repository         (divisions → sections → files, RBAC scoped)
                    ├─ Upload Files       (structured + general, with validation & sync)
                    ├─ Templates          (admin + division_focal)
                    ├─ Manage Users       (administrator)
                    ├─ Audit Logs         (administrator)
                    ├─ School Year        (administrator)
                    └─ Settings           (all roles)
```

### Idle & Auth

- `src/App.jsx:130-131` — `25m` warning modal → `30m` auto-logout via `src/hooks/useIdleTimeout.js`
- `src/contexts/UserContext.jsx:15` — `PROFILE_SELECT` joins `divisions` + `sections` names in one query; Realtime subscription on `users` row (`users-row-{id}`) + `focus` refetch safety net `src/contexts/UserContext.jsx:133`

---

## 2. Tech Stack

Source: `package.json:12-45`

| Layer | Tech | Version |
|-------|------|---------|
| **Frontend** | React + React DOM | `19.2.5` |
| **Routing** | react-router-dom (lazy + Suspense) | `7.14.2` |
| **Build** | Vite + @vitejs/plugin-react | `8.0.10 / 6.0.1` |
| **Styling** | Tailwind CSS + @tailwindcss/vite | `4.2.4` |
| **State/Data** | Supabase JS + TanStack React Query | `2.105.4 / 5.101.4` |
| **Excel/PDF** | xlsx, exceljs, hyperformula (worker), jspdf + jspdf-autotable, @turbodocx/html-to-docx, mammoth | `0.18.5 / 4.4.0 / 3.4.0 / 4.2.1` |
| **Charts** | recharts | `3.8.1` |
| **Icons/Utils** | lucide-react, clsx, date-fns | `1.14.0 / 2.1.1 / 4.1.0` |
| **Backend** | Supabase Edge Functions (Deno) + Express `server/` | `5.2.1` |
| **Storage Buckets** | `repository-files`, `excel-files`, `excel-templates`, `verified-pdfs` | — |
| **Edge Functions** | `generate-verified-pdf`, `send-password-reset`, `send-change-email`, `purge-recycled-files` (+ unregistered `create-user`, `delete-user`) | `supabase/config.toml:3-46` |

No testing, no validation, no PWA, no rate-limit libs — see §6.

---

## 3. Roles & Access Model

Source: `src/utils/accessControl.js:5` + `src/components/Sidebar.jsx` + `src/App.jsx:194-223`

```js
// src/utils/accessControl.js:5
ROLES = {
  ADMIN: 'administrator',
  DIVISION_FOCAL: 'division_focal',
  SECTION_FOCAL: 'section_focal',
  PERSONNEL: 'section_personnel'
}
// No School Principal — docs hallucinate it. Only these 4 exist.
```

### Navigation Filtering

| Nav Item | Route | Who Sees It | File |
|----------|-------|-------------|------|
| Dashboard | `/dashboard` | All roles | `src/components/Sidebar.jsx` |
| Repository | `/repository` | All roles | `src/components/Sidebar.jsx` |
| Upload Files | `/upload-files` | All roles | `src/components/Sidebar.jsx` |
| Templates | `/templates` | `administrator` + `division_focal` | `src/App.jsx:218` `RoleProtectedRoute` |
| Manage Users | `/manage-user` | `administrator` only | `src/App.jsx:194` |
| Audit Logs | `/audit-logs` | `administrator` only | `src/App.jsx:201` |
| School Year | `/school-year` | `administrator` only | `src/App.jsx:209` |

### Access Logic

- **`resolveUserDivisionId`** `src/utils/accessControl.js` — priority: `userProfile.division_id` → `userProfile.division.id` → lookup `sections.division_id` via `section_id`.
- **`canAccessDivision(user, divisionId)`** — `administrator` always true; others check `effectiveDivisionId === divisionId` else live grant `division_access_request` where `status='approved'` via `src/utils/divisionAccessRequestsApi.js:hasApprovedDivisionAccess`.
- **`getSectionAccessLevel(user, section)`** → `full | view_download | locked | blocked`:
  - `administrator` → `full`
  - `division_focal` same division → `full`; else granted via division_access → `locked` else `blocked`
  - `section_focal|personnel` exact `section.id` → `full`; same `division_id` different section → `view_download` (but UI treats it as `locked` — bug); else `locked`/`blocked`
- **`canViewSectionTemplates`** — stricter: `division_focal` only own division, section roles only own section. Division grant never leaks Templates button.
- **Sidebar labels** map role → `Admin Panel / Division Panel / Section Panel / Personnel Panel`.

---

## 4. Core Modules & Data Flow

### 4.1 Upload → Parse → Store → Notify

```
[User] → UploadFilesPage.jsx:triggerUpload
  ├─ (admin/division_focal) FolderSelectionModal → selectedFolder {id, name, divisionId}
  └─ FileUploadModal → {schoolYear, uploadType, file(s)} (+ replaceTargets if overwriting)

addToUploads() — src/pages/UploadFiles/UploadFilesPage.jsx:444-1083
  ├─ sanitize fileName ([^a-zA-Z0-9._-] → _)
  ├─ validate ext ∈ ALLOWED_EXTENSIONS, size < 50MB (UI says 1GB — inconsistency)
  ├─ resolve storagePath = "sections/{sectionId|name}/{school_year}/{fileName}"
  ├─ bucket = STRUCTURED_UPLOAD_TYPES ∋ uploadType ? "excel-files" : "repository-files"
  ├─ [STRUCTURED] runImport(file, uploadType) — src/utils/ExcelParsers/services/importService.js
  │     ├─ strategy:file (multi-sheet complex) vs strategy:rows (SheetJS rows+headers)
  │     └─ on invalid template throw "Invalid {PrettyType} template!"
  ├─ supabase.storage.from(bucket).upload(path, file, {upsert, cacheControl:3600})
  ├─ supabase.from("files").insert({
  │      file_name, file_path=storagePath, file_size, file_type,
  │      data_category=uploadType, school_year, section_id, division_id,
  │      uploaded_by, uploaded_by_name, status:"Unverified",
  │      is_dashboard_source: uploadType !== "general"
  │   })
  ├─ [STRUCTURED] parseAndSyncStructuredData() — src/utils/structuredDataSync.js
  │     ├─ runImport again (parse-first pattern — prevents deletion before parse success)
  │     ├─ if replace → deleteParsedDataForFile(category, oldFileId)
  │     └─ batch insert 500/chunk into categorized tables with file_id + school_year
  ├─ on inner catch: cleanup storage.remove([path]) if !upsert + files.delete
  ├─ on success: audit_logs insert (Upload/Success), queryClient.invalidateQueries
  │     [enrollment, resources, cespes, schoolYears, kpiData]
  └─ notifyScope() — src/utils/notifications.js → resolveRecipients + notifications inserts

[Replace flow] handleFileUpload({replaceTargets}) — uploads new file first (upsert:true)
  → only then loops deleteParsedDataForFile(oldId) + files.delete(oldId) + storage.remove(oldPath)

[File Requests linkage] if linkedRequestId → file_requests.update status=completed
  → pushNotification to requester
```

**Excel Parsers** `src/utils/ExcelParsers/`:
- `parsers/enrollmentParser.js` — sheets `PUBLIC/PRIVATE`, 6 header rows, 100 cols, nested `elementary/juniorHigh/seniorHighS1/S2` + `grandTotal`
- `parsers/classroomsParser.js`, `seatsParser.js`, `teachersInventoryParser.js`, `textbooksInventoryParser.js` — multi-sheet `DB + KES + JHS + SHS + status`
- `parsers/cespesParser.js` — 5 sections `operations/support_operations/general_admin/individual_performance/innovation`
- `parsers/kpiParser.js` — `performance_indicators_data` sheets (`G1toG6 SLR_DR`, `JHS SLR`, etc.) → `headers_main/sub`, `total_row/male/female` for `getKpiRate`
- `parsers/schoolsParser.js | teachersParser | studentsParser` — row-level generic
- `validations/validateHeaders.js` + `validations/validateRows.js` — hand-rolled, no LRN/birthdate regex

**Structured Sync** `src/utils/structuredDataSync.js:4-12`:
```js
TABLES_BY_CATEGORY = {
  enrollment: 1 table (enrollment_data JSONB),
  classrooms: 5 (school_db + kes + jhs + shs + status),
  seats: 4 (kes + jhs + shs + status),
  teachers_inventory: 3 (kes + jhs + shs → teachers_*),
  textbook_inventory: 3 (kes + jhs + shs → textbooks_*),
  cespes: 5 (operations + support_operations + general_admin + individual_performance + innovation),
  performance_indicators: 1 (performance_indicators_data, upsert on file_id+sheet_name)
}
```

### 4.2 Repository

- **Root** `src/pages/Repository/Repository.jsx` — lists `divisions` as folders via `FolderGrid`, `COLOR_PRESETS`, search `viewMode` persisted.
- **Division** `src/pages/Repository/RepositoryDivisionPage.jsx` — guards via `canAccessDivision` → redirect `.../restricted/:divisionSlug` if blocked. Loads `divisions + sections + users` (division managers `section_id==null`, section_focal `in sectionIds`). Scroll-snap morphing header (threshold 60px/15px). Delete flow: `DeleteSectionWarningModal → PasswordConfirmModal → requestSectionDeletion → fetchPendingDeletionRequests → admin approve/decline` via `src/utils/sectionDeletion.js`.
- **Section Detail** `src/pages/Repository/RepositoryFolderDetailPage.jsx` (~3000+ lines) — file list for `section_id`. UI: `RepositorySearchBar`, `FileActionsMenu`, `FileEditModal`, `DownloadOptionsMenu`, `RecycleBinModal` (14d), verify pill `Unverified → Verified` via `VerifyConfirmModal`, `FileFeedbackModal` threaded counts, `TemplatesModal` section-scoped.

**Storage mapping:** `EXCEL_BUCKET_TYPES → excel-files` else `repository-files`. Verified PDFs via Edge `generate-verified-pdf` (`supabase/functions/generate-verified-pdf/index.ts`): validates `status==='Verified'`, ext `xlsx/xls/csv→convertExcelToPdf` else `pdf`, `stampPdf` with `verifiedByName/verifiedAt`, uploads `verified-pdfs/{file.id}.pdf` (upsert), updates `files.verified_pdf_path`.

### 4.3 Dashboard

`src/pages/Dashboard/Dashboard.jsx` (~3872 lines) — TanStack Query hub.

- Year selector + compare mode via `src/utils/schoolYearsApi.js`
- `computeEnrollmentTotals`, `fetchResourcesForYear` (12 parallel Supabase selects), `getKpiRate(sheetName, headerSubstring)` reads `performance_indicators_data.total_row[headerIdx]*100`
- Sections: `DashboardOverview` (totals), `DashboardFilters`, enrollment `Summary|By Level` (lazy `EnrollmentChart`/`EnrollmentByLevel`), rate tabs `Dropout|Promotion|Cohort` (`DropoutChart`/`PromotionChart`/`CohortChart`), resources `Summary|Charts` (4 `ResourcesInventoryChart` + `TextbooksChart`), `cespes` 5 tabs (`Operations/Support/General Admin/Individual/Innovation`), institutional AIP/QBEDP placeholders (commented out `2264-2287`)
- Print reports: `printPerformanceReport:3655` + `printCespesReport:3731` + `printReport:3645` all `window.open().document.write().print()` HTML — not native PDF/Excel
- **Template fallback** `src/data/cespesTemplateData.js` → `DEFAULT_CESPES_DATA` injected when no rows `CespesYearPanel:2729 fallbackToTemplate` — shows `Template view` badge but looks like real data

**Critical note:** All dashboard queries filter **only by `school_year`** — no `division_id/section_id` scoping. Division/section focal sees entire division data.

### 4.4 Other Pages

| Page | File | Purpose |
|------|------|---------|
| **Landing** | `src/pages/LandingPage/LandingPage.jsx` | Public entry, HeroStats, About, Contact, CTA |
| **Login** | `src/pages/Login/LoginPage.jsx` | Gradient blobs, `LoginForm` + `LoginBranding`, `justLoggedIn` redirect, 5-fail lockout → auto deactivate → security alert |
| **ManageUsers** | `src/pages/ManageUsers/ManageUsers.jsx` | Query `users` join `divisions/sections→divisions`, filter `Division/Role/Status`, `OrganizationView` grouping `organizationStructure.js`, modals `AddNewUserModal` (Edge `create-user`), `EditUserModal`, `Delete/Deactivate/Activate` (Edge `delete-user`) |
| **AuditLogs** | `src/pages/AuditLogs/AuditLogs.jsx` | Query `audit_logs` 200 latest `order(performed_on desc).limit(200)`, Realtime `audit_logs_changes` on INSERT, filters search + `filterAction` 12 values + `filterStatus` + date range, export `window.print()` HTML, `handleDeactivateFromAlert:375` |
| **SchoolYear** | `src/pages/SchoolYear/SchoolYearPage.jsx` | `getSchoolYearPageData` via `schoolYearsApi.js`: `activeYear`, `scheduledYear`, `previousYears` (archived), `ActiveSchoolYearCard` (force transition `rpc force_school_year_transition`), `ScheduledSchoolYearCard` (cancel/edit), `ScheduleSchoolYearDialog`, `PreviousSchoolYearsTable` (`reopen_school_year`/`close_reopened_school_year` RPCs) |
| **Settings** | `src/pages/Settings/SettingsPage.jsx` | Profile header, display name read-only, Password via `send-password-reset` + `/change-password`, Email with debounced `users ilike` duplicate guard + `reauthenticate` + `send-change-email` |
| **Templates** | `src/pages/Templates/TemplatesPage.jsx` | Admin + Division Focal only, `fetchAllTemplates/fetchAllSections/Divisions`, bucket `excel-templates/{sectionName}/{fileName}` with `-2` suffix retry, download `createSignedUrl(3600)` |
| **NotFound** | `src/pages/NotFound/NotFoundPage.jsx` | Catch-all `*` |

---

## 5. What Actually Works (Strengths to Lead With)

Lead defense with these — they are code-proven, not doc promises:

1.  **Parse-first-then-delete safety** `src/utils/structuredDataSync.js` + `src/pages/UploadFiles/UploadFilesPage.jsx:1015` — prevents blank dashboard on bad re-upload (delete only after parse succeeds).
2.  **Two-bucket separation** — `excel-files` (dashboard-analyzed Excels) isolated from `repository-files` (general docs). Readable layout `sections/{id}/{year}/{name}`.
3.  **500-row batch inserts** for multi-sheet inventory to avoid payload limits.
4.  **Verification stamping server-side** `supabase/functions/generate-verified-pdf/index.ts` (service_role) — prevents client tampering; extensions gated `xlsx/xls/csv/pdf`.
5.  **Realtime notifications + audit** `src/utils/notifications.js` + `src/hooks/useNotifications.js` + `src/pages/AuditLogs/AuditLogs.jsx` Realtime channel `audit_logs_changes`.
6.  **School-year lifecycle** `src/utils/schoolYearsApi.js` + `src/pages/SchoolYear/SchoolYearPage.jsx` with `active|scheduled|archived`, `uploadable_school_years` view, RPCs.
7.  **Dual-approval section deletion** `src/utils/sectionDeletion.js` (`reauthenticate` + `requestSectionDeletion` + `approveSectionDeletion` RPC).
8.  **Template collision handling** `src/utils/templatesApi.js:uploadWithReadableName` retry `-2` suffix.
9.  **Division gate via `hasApprovedDivisionAccess` async** — cross-division access requires live grant, not stale cache `src/utils/accessControl.js`.
10. **TanStack `staleTime 5m` + `invalidateQueries` + Realtime** — avoids polling spam.
11. **Scroll-snap morphing header** `src/pages/Repository/RepositoryDivisionPage.jsx` via `requestAnimationFrame` + hysteresis.

**Thesis additions already beyond original scope** (cite `THESIS_SCOPE_LIMITATIONS.md`):
- Structured ingestion (enrollment/classrooms/seats/teachers/textbooks/CESPES/KPI)
- Realtime notifications
- Verified PDF stamp every page
- School-year lifecycle
- Access request workflows (file + division)
- Section deletion governance

---

## 6. What's Missing / Broken (Panel Attack Surface)

### P0 — Must Fix Before Defense (Embarrassing If Shown)

#### 6.1 Schema Not Reproducible

- `supabase_schema.sql:1-83` only defines 2 tables (`enrollment_data` + `performance_indicators_data` with `USING(true)` anon RLS).
- Real app needs **30+ tables**: `users, divisions, sections, files, audit_logs, notifications, school_years, file_requests, file_access_request, division_access_request, templates, file_feedback, teachers_kes/jhs/shs, classrooms_kes/jhs/shs, seats_kes/jhs/shs, textbooks_kes/jhs/shs, *_status, *_school_db, cespes_* (5 tables)`, plus views `uploadable_school_years` and RPCs `force_school_year_transition`, `reopen_school_year`, `close_reopened_school_year`.
- `supabase/migrations/` **does not exist**.
- `supabase/config.toml:3-46` registers only 4 functions (`generate-verified-pdf`, `send-password-reset`, `send-change-email`, `purge-recycled-files`) — `create-user` + `delete-user` are **unregistered** (won't deploy via `supabase functions deploy`).
- **Result:** `supabase db reset` from git breaks the app. No ERD artifact — `ERD_DIAGRAM_GUIDE.md:1-27` is 27-line placeholder with only tool names.

**Panel:** *"Show us your complete ERD and migration history. Why does your schema file only have 2 tables when Dashboard queries 15+? Where are your RLS policies per role?"*

#### 6.2 Secrets Leaked + Insecure Endpoints

- `.env` + `server/.env` committed with real `VITE_SUPABASE_URL/ANON_KEY`, `service_role`, `Brevo xkeysib-...`. `.gitignore` not excluding `.env` effectively.
- `server/index.js:23,97` — `POST /api/create-user` + `/api/delete-user`:
  - No auth middleware, no `verifyJWT`, no role check, `cors()` open to `*`
  - `tempPassword = Math.random().toString(36).slice(-10)+"A1!"` cryptographically weak (predictable, low entropy)
  - Brevo send failure returns 500 **but user already created** — no rollback → orphaned `auth.users` + `public.users`
  - `delete-user` deletes `users` then `auth` without transaction
  - No `helmet`, no `rateLimit`, no `express.json({limit})`
- `supabase/config.toml:27` — `send-change-email` has `verify_jwt=false` — anyone can invoke email change without auth.
- `vite.config.js:1-20` — minimal: no `server.proxy` for Edge Functions, no `build.sourcemap` control, `define global→globalThis` hack without comment, no `envPrefix` restriction.

**Panel:** *"Your GitHub contains your Supabase service_role key and Brevo API key. Did you rotate them? Anyone can call your create-user endpoint — where is admin authentication? Is your random password PCI-compliant?"*

#### 6.3 Dashboard Dishonesty + Incomplete Features

- **Hardcoded fallback** `src/pages/Dashboard/Dashboard.jsx:2080,2113,2152,2191,2228,2729` + `src/data/cespesTemplateData.js:DEFAULT_CESPES_DATA` — when no rows, UI injects sample data with small `Template view` badge. Enrollment trends also fall back to hard-coded sample. Panel sees **fake data presented as real analytics**.
- **Institutional Plans (AIP/QBEDP) fakery** `src/pages/Dashboard/Dashboard.jsx:3177,3372` + `src/components/UploadFilesComponents/FileUploadModal.jsx:106-115` define `aip_school`, `aip_sdo`, `qbedp`, `accomplishment_report` as upload categories *"Store file for Dashboard"* — but `src/utils/structuredDataSync.js:4-12` + `src/utils/ExcelParsers/index.js` have **no parser, no table, no sync**. Files sit in `excel-files` bucket; Dashboard section for them is commented out `2264-2287`.
- **Not scoped by role** — `src/pages/Dashboard/Dashboard.jsx` fetches `enrollment_data` with only `school_year` filter, no `division_id`. Division/section focal sees entire division data. `FLOWCHART_USER_ROLES.md` claims scoped dashboards — false.
- **Static insight** `src/pages/Dashboard/Dashboard.jsx:1954` string *"decreased by 0.28% over past three years"* is hardcoded, not computed.

**Panel:** *"Your CESPES and Performance charts — are these real submitted data or template dummy values? Why can a section personnel see the whole division's enrollment? Your Institutional Plans upload does nothing — where is the feature?"*

#### 6.4 Repository Verification Weaknesses

- `src/utils/accessControl.js:72-88` — `view_download` return value never handled in `src/pages/Repository/RepositoryFolderDetailPage.jsx` UI (treats as `locked`), so personnel in same division gets wrong request flow.
- **Verify not atomic:** `handleVerify` does `supabase.from("files").update({status:"Verified"})` client-side without RPC/row lock; race if two focals verify simultaneously. No checksum, no immutability of `verified_at`.
- **Verified PDF generation** `supabase/functions/generate-verified-pdf/index.ts` — no retry, no failure UI if Edge times out (Excel→PDF via `xlsx` can be slow). Bulk `bulkVerify/bulkDownload/bulkDelete` silently skips locked files.

**Panel:** *"Who exactly can verify? Demonstrate that a personnel cannot verify. What prevents tampering with verification timestamp from browser devtools?"*

#### 6.5 Audit Logs — Incomplete & Not Forensic-Grade

- `src/pages/AuditLogs/AuditLogs.jsx:304` — `.limit(200)` client-side pagination only (in-memory 10/page); after 200 logs oldest vanish invisibly.
- No `ip_address` — `SYSTEM_DOCUMENTATION.md:454` spec lists it but insert `src/pages/UploadFiles/UploadFilesPage.jsx:422` only inserts `action, file_name, details, performed_by, role, status`.
- Export `src/pages/AuditLogs/AuditLogs.jsx:40-278` is `window.open().print()` HTML only — no CSV/PDF/Excel, counts derived from `auditLogs` not `filteredLogs`.
- `handleDeactivateFromAlert:375-434` does `users.update({is_active:false})` from client without re-auth; any admin viewing logs can deactivate any user via JS.

**Panel:** *"Your audit trail caps at 200 entries — what happens after 1000 uploads? How do you prove who downloaded a file from which IP? Your export is just browser print — where is the tamper-proof CSV required by audit?"*

#### 6.6 Notifications — In-App Only

- `src/utils/notifications.js` + `src/hooks/useNotifications.js` — only inserts to `notifications` table + Realtime `postgres_changes` on `recipient_id`. No email, no FCM/Web Push, no sound/badge. `NOTIFICATION_PUSH_GUIDANCE.md` is guidance doc, not implementation.
- `resolveRecipients` only notifies `section_focal/personnel` + `division_focal`; `administrator` never notified. No `type` for `file_deleted`, no handling for `access_request_revoked` beyond generic.
- Limit 50 `src/hooks/useNotifications.js:77`, no pagination, no retention policy (table grows forever). No offline queue — if Realtime disconnects, missed until refresh.

**Panel:** *"If the admin approves my access while I'm offline, how am I notified? Why no email? Your notification spec mentions push but you have no service worker."*

### P1 — Expected for Thesis, Absent

| Feature | Expected | Current State | Evidence |
|---------|----------|---------------|----------|
| **Full-text search** | Search inside PDFs/Excels | Only `file_name`/`uploader` `ilike` | `src/pages/Repository/RepositoryFolderDetailPage.jsx:1249`, `src/pages/Repository/Repository.jsx:88` — no `tsvector` |
| **Advanced filtering** | Date range, size, type, status, school_year | Repository: only 4 tabs `All/PDF/Excel/Word`, no date range/size/verified filter | `src/pages/Repository/RepositoryFolderDetailPage.jsx:1249` |
| **Bulk operations** | Bulk edit/move/restore | Bulk download/delete/verify exist but **no bulk move, bulk re-categorize, bulk restore** from recycle bin | `src/pages/Repository/RepositoryFolderDetailPage.jsx:1266` |
| **Versioning** | Keep previous Excel versions | Overwrite only: `upsert:true` + `deleteParsedDataForFile` deletes old rows. No `file_versions` | `src/pages/UploadFiles/UploadFilesPage.jsx:1015`, `src/utils/structuredDataSync.js:14`, `THESIS_SCOPE_LIMITATIONS.md:54` |
| **Backup / DR** | App-level export/backup | None. `THESIS_SCOPE_LIMITATIONS.md:74` *"No automated backup"*. No `pg_dump` cron, no bucket versioning | — |
| **Offline** | PWA / offline upload queue | No service worker, no `vite-plugin-pwa`, no IndexedDB. `vite.config.js` no PWA plugin | `vite.config.js` |
| **Analytics** | Who uploaded most, storage usage | Dashboard shows enrollment KPIs but **no system analytics**: no uploads per user, no storage per section | `src/hooks/useLandingStats.js` hard-coded demo |
| **Reporting export** | Dashboard PDF/Excel | Dashboard `printPerformanceReport`/`printCespesReport`/`printResourcesReport` are `window.print()` HTML only. `jspdf`+`exceljs` in `package.json:20,23` never used for dashboard. No chart image export | `src/pages/Dashboard/Dashboard.jsx:3453,3645,3731` |
| **Mobile** | Responsive, swipe | `AppLayout.jsx` + `MobileBottomNav.jsx` exist but filter pills overflow small screens, no skeleton grid, tables `lg:hidden` fragile | `src/components/MobileBottomNav.jsx` |
| **Validation** | LRN 12-digit, birthdate, MIME sniff | `ALLOWED_EXTENSIONS` includes `.zip/.rar` no extraction check; `src/utils/ExcelParsers/parsers/studentsParser.js:86` `TODO: Validate LRN` | `src/pages/UploadFiles/UploadFilesPage.jsx:444`, `src/utils/ExcelParsers/validations/*` |
| **Tests** | Unit/integration | None: no `vitest`, `@testing-library`, `cypress` | `package.json:34` devDeps only eslint |
| **Security deps** | Validation, rate-limit | No `zod/yup`, `react-hook-form`, `helmet`, `rate-limiter-flexible`, `sentry`, `prettier`, `husky` | `package.json` |

---

## 7. Unique Features to Add (Thesis Differentiators)

> Pick **2–3** to avoid scope creep. Ranked by panel impact / effort.

### Tier 1 — High Impact, Low Effort (Do Before Defense)

#### 1) Tamper-Proof Verification 2.0 — QR + Hash

- **What:** On upload compute `sha256(file)` → store `files.file_hash`. On verify, stamp QR on every PDF page (`generate-verified-pdf/index.ts` already stamps). Add public `/verify/:hash` page that validates without login.
- **Why panel loves it:** "Blockchain-like" without blockchain, solves *"what prevents timestamp tampering?"*
- **Effort:** Small — `crypto.subtle.digest` on upload + `qrcode` lib in Edge Function.
- **Demo:** Scan QR on printed verified PDF → shows verifier, timestamp, hash match.

#### 2) Executive One-Click Report

- **What:** Real `jspdf` + chart `toDataURL()` export for Dashboard (Performance/CESPES/Resources) as branded PDF with SDO header/footer, not `window.print()`. Use already-installed `jspdf:23` + `recharts` `getDataURL`.
- **Why:** DepEd superintendent requires printed reports — current `window.print` is not downloadable. Fixes export gap `§6.5`.
- **Effort:** Small/medium — wrap `printPerformanceReport:3655` HTML builder with `jspdf` + `autotable`.
- **Demo:** "Export Dashboard as PDF" button → branded PDF with charts.

#### 3) Anomaly / Integrity Guard

- **What:** On `runImport` flag `grand_total != sum(levels)` or `dropout >50%` or `teacher_needs <0` or `enrollment drop >30% YoY` → `audit_logs` `Security Alert` + notification to admin + block verify until resolved.
- **Why:** Turns parser validation into research contribution, answers *"can invalid Excel corrupt metrics?"*
- **Effort:** Small — pure JS in `src/utils/ExcelParsers/validations/validateRows.js`.
- **Demo:** Upload bad Excel → toast "Anomaly detected: ..." + audit alert.

### Tier 2 — High Impact, Medium Effort

#### 4) Full-Text + Inside-Excel Search

- **What:** Postgres `tsvector` + `GIN` index on `files.file_name` + structured tables (`enrollment_data` JSONB), Edge `pg_search`, highlight in `RepositorySearchBar`.
- **Why:** Fixes #1 complaint "filename only" `§6 P1`.
- **Effort:** Medium — migration + `supabase.from('files').textSearch`.
- **Demo:** Search "Mendoza" inside enrollment Excel → highlights row.

#### 5) Predictive Enrollment (Light AI)

- **What:** Linear regression on `enrollment_data` last 3 years via `regression` npm or HyperFormula trend, show "Projected SY 2027" dotted line in `EnrollmentChart.jsx`.
- **Why:** Panel asks *"where is AI?"* — this answers without ML server.
- **Effort:** Small — compute in `Dashboard.jsx` `computeEnrollmentTotals`.
- **Demo:** Enrollment trend with dotted projection + confidence band.

#### 6) Versioning + Time-Travel Dashboard

- **What:** `file_versions` table (keep last 3 `file_id` rows + storage path), Dashboard year-comparison already has `compareYear` query — extend to diff view "what changed SY 2024→2025".
- **Why:** Fixes no-versioning gap, justifies no-data fallback removal.
- **Effort:** Medium — new table + `upsert:false` + keep old rows.
- **Demo:** "View history" on file → restore v2; Dashboard "Compare SY" diff.

### Tier 3 — Nice to Have

#### 7) Offline PWA Queue

- `vite-plugin-pwa` + IndexedDB pending uploads; "Offline — will sync" banner. Addresses `THESIS_SCOPE_LIMITATIONS: requires internet`. Medium effort.

#### 8) Storage Analytics for Admin

- New `DashboardOverview` card: uploads per section, bucket usage via `storage.list`, failed verifications trend — reuses `audit_logs` without new tables. Small effort.

#### 9) OCR + Auto-Tag

- `tesseract.js` on image/PDF upload → auto-suggest `data_category` + extract school_year. High wow factor, medium effort.

#### 10) Chatbot Assistant

- Rule-based help for "How to upload CESPES?" using `src/data/cespesTemplateData.js`. Low effort, panel likes "AI".

**Recommendation:** Implement **(1) QR hash verify + (2) Executive PDF + (3) Anomaly guard** before defense = 3 unique, demoable in 5 min, all code-local.

---

## 8. Panel Hard Questions & Model Answers

### Q1: "Rebuild your DB from git — it fails. Where is your ERD/migration?"

> `supabase_schema.sql:1-83` is **intentionally minimal** for local dev; live schema is in Supabase cloud. We acknowledge the gap — `SYSTEM_CAPABILITIES.md:13` discloses it. Before final submission we will deliver `supabase/migrations/00001_initial.sql` dumped via `supabase db dump` + complete ERD via DBeaver live connection. `ERD_DIAGRAM_GUIDE.md` is a tooling stub, not the ERD. RLS policies are currently permissive `USING(true)` for MVP; per-role policies (`auth.uid() → users.section_id/division_id`) are on the roadmap.

**Action:** Run `supabase db dump -f supabase/migrations/XXXX.sql`, generate ERD via DBeaver/pgAdmin, replace `ERD_DIAGRAM_GUIDE.md` with Mermaid/DBML.

### Q2: "Prove a section personnel cannot see another section's files via direct Supabase query."

> Demo: Login as `section_personnel` (section A), open DevTools → `supabase.from('files').select().eq('section_id', otherId)` → RLS denies (today `enrollment_data` RLS is `USING(true)` — we must **admit permissive for MVP** and show planned fix: per-role RLS `auth.uid() → users.section_id/division_id` + client gate `getSectionAccessLevel` `src/utils/accessControl.js:72`. Don't claim secure — claim awareness + fix plan with code.

**Action:** Add RLS demo slide; prepare `SELECT * FROM files WHERE section_id != my_section` failing in Supabase SQL Editor.

### Q3: "Your charts show template values as real — misleading research?"

> Show `src/pages/Dashboard/Dashboard.jsx:2729` badge `Template view` vs `No data yet` + message `No Operations data for SY X. Displaying empty template structure.` Template (`src/data/cespesTemplateData.js:DEFAULT_CESPES_DATA`) is intentional to demonstrate layout when no upload yet — **not claimed as real**. We will add watermark + disable export when `fallbackToTemplate` true to make distinction unmistakable.

**Demo:** Open Dashboard with empty SY → point to `Template view` pill; toggle `fallbackToTemplate` prop.

### Q4: "AIP/QBEDP upload does nothing — why in scope diagram?"

> Admit `src/utils/structuredDataSync.js:4` has **no parser** for `aip_school`, `aip_sdo`, `qbedp`, `accomplishment_report`; they currently store as `excel-files` for manual download only (`src/components/UploadFilesComponents/FileUploadModal.jsx:106`). Thesis scope was `enrollment/classrooms/seats/teachers/textbooks/CESPES/KPI` per `THESIS_SCOPE_LIMITATIONS.md`; AIP/QBEDP is roadmap. We will **hide it from `STRUCTURED_UPLOAD_TYPES` dropdown** or implement parser before defense.

**Action:** Filter `FileUploadModal.jsx` `uploadType` options to implemented types only.

### Q5: "Your GitHub leaks service_role + Brevo key. Anyone can call create-user."

> Acknowledge, **rotated keys after audit**, added `.env.example`, `git rm --cached .env`, added `server/index.js:23` JWT middleware `verifyJWT + checkRole('administrator')`, switched `Math.random` to `crypto.randomBytes(32)`, wrapped `auth.createUser + users.insert` in transaction with rollback on Brevo fail, added `express-rate-limit + helmet`.

**Action (P0):**
```bash
git rm --cached .env server/.env
echo ".env" >> .gitignore
# rotate keys in Supabase Dashboard → Project Settings → API + Brevo
```
```js
// server/index.js — add
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import crypto from 'crypto';
app.use(helmet());
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));
// verify JWT + role before create-user
// tempPassword = crypto.randomBytes(12).toString('base64') + "A1!"
```

### Q6: "Audit caps at 200, no IP, export is print — audit-grade?"

> `src/pages/AuditLogs/AuditLogs.jsx:304` `.limit(200)` is MVP; fix is server pagination `range(count)` + `ip_address` via `x-forwarded-for` in Edge + CSV export via `exceljs` (`package.json:20` already installed). Show `window.print` is placeholder; real export pattern exists in `server/convertExcelToPdf.js`.

**Action:** Change `audit_logs` query to `.range(0, 49).order(... )` + count header + `exceljs` CSV download button; add `ip_address` column via `supabase.functions` or `audit_logs` insert with `request.headers`.

### Q7: "Dashboard shows whole division to everyone — privacy?"

> Correct, `src/pages/Dashboard/Dashboard.jsx` global query is **disclosed limitation** `THESIS_SCOPE_LIMITATIONS.md: Dashboard Not User-Scoped`. Repository is correctly scoped `full/locked/blocked` `src/utils/accessControl.js`; Dashboard scoping is future work via `division_id` filter. Justify single-tenant Baliwag deployment; add roadmap slide "Phase 2: division-scoped dashboard".

**Action:** Add disclaimer to Dashboard header: "Division-wide view (all sections)".

### Q8: "Where are tests, backup, versioning, offline?"

> Cite `THESIS_SCOPE_LIMITATIONS.md:48-74` **8 disclosed limitations**; propose `vitest + @testing-library/react` for `enrollmentParser` + `pg_dump` cron + bucket versioning + `file_versions` table + `vite-plugin-pwa`. Show we chose depth over breadth for thesis; depth is verifiable (show `runImport` + `structuredDataSync`).

**Action:** Add at least one `vitest` test for `validateRows.js` to prove testability; add `THESIS_SCOPE_LIMITATIONS.md` to slide deck.

### Q9: "Your validation is partial — can invalid LRN corrupt dashboard?"

> `src/utils/ExcelParsers/parsers/studentsParser.js:86` `TODO: Validate LRN` — admit hand-rolled validation `src/utils/ExcelParsers/validations/validateRows.js` only checks required/numeric/schoolYear. Fix is `zod` schema + LRN regex `^\d{12}$` + birthdate `isPast` + `school_id` existence check against `schools` table. Show error surfacing `validateRows:collectErrors` already aggregates per-row errors.

### Q10: "Export your dashboard as PDF for the superintendent — can you?"

> Current `printPerformanceReport:3655` + `printCespesReport:3731` + `printReport:3645` are `window.open().document.write().print()` HTML. Answer: "Today browser print, next is server PDF via `jspdf` + `jspdf-autotable` + chart `canvas.toDataURL` — deps already in `package.json:23`." Demo the `window.print` → pivot to planned `jspdf` branded export.

### Q11: "How do I find a file containing keyword 'enrollment' inside the Excel?"

> Today only `file_name ilike` `src/pages/Repository/RepositoryFolderDetailPage.jsx:1249`. Answer: `tsvector` + `GIN` index on `files` + structured tables JSONB. Show SQL: `ALTER TABLE files ADD COLUMN search_vector tsvector; CREATE INDEX ... USING gin(search_vector); SELECT * FROM files WHERE search_vector @@ plainto_tsquery('enrollment');`

### Q12: "A user deletes a verified file — where is version history?"

> `src/pages/UploadFiles/UploadFilesPage.jsx:1015` `upsert:true + deleteParsedDataForFile` destroys history; `RecycleBinModal` only 14d soft-delete via `purge-recycled-files`. No `file_versions`. Roadmap: `file_versions` table (keep last 3 + storage path) + Dashboard `compareYear` diff.

---

## 9. Prioritized Roadmap Before Defense

### Week 1 — P0 Fixes (Must)

| # | Task | File | Done |
|---|------|------|------|
| 1 | `git rm --cached .env` + `.env.example` + rotate keys | `.env`, `server/.env`, `.gitignore` | ☐ |
| 2 | Register `create-user` + `delete-user` in `supabase/config.toml` + add `verify_jwt` guard + `server/index.js` `helmet + rateLimit + crypto.randomBytes + transaction rollback` | `supabase/config.toml`, `server/index.js:23` | ☐ |
| 3 | Dump full schema `supabase db dump` → `supabase/migrations/` + fix `supabase_schema.sql` RLS per-role | `supabase/migrations/`, `supabase_schema.sql` | ☐ |
| 4 | Generate real ERD (DBeaver/pgAdmin → Mermaid/DBML) replace `ERD_DIAGRAM_GUIDE.md` | `ERD_DIAGRAM_GUIDE.md` | ☐ |
| 5 | Hide unimplemented upload types `aip_* / qbedp / accomplishment_report` from `FileUploadModal` OR implement parsers | `src/components/UploadFilesComponents/FileUploadModal.jsx:106`, `src/utils/structuredDataSync.js:4` | ☐ |
| 6 | Fix `validateRows.js` LRN + birthdate + `school_id` existence + MIME sniff for `.zip/.rar` | `src/utils/ExcelParsers/validations/validateRows.js`, `studentsParser.js:86` | ☐ |

### Week 2 — High-Impact Uniques (Pick 2–3)

| # | Task | File | Done |
|---|------|------|------|
| 7 | QR + hash verification (`sha256` + `qrcode` + `/verify/:hash`) | `src/pages/UploadFiles/UploadFilesPage.jsx`, `supabase/functions/generate-verified-pdf/index.ts` | ☐ |
| 8 | Executive PDF export (`jspdf` + `autotable` + `canvas.toDataURL`) | `src/pages/Dashboard/Dashboard.jsx:3645`, `src/pages/AuditLogs/AuditLogs.jsx:40` | ☐ |
| 9 | Anomaly guard (`grand_total` mismatch, dropout >50%, YoY drop >30%) | `src/utils/ExcelParsers/services/importService.js`, `src/utils/notifications.js` | ☐ |

### Week 3 — Polish (If Time)

| # | Task | File | Done |
|---|------|------|------|
| 10 | Audit logs pagination + CSV + `ip_address` | `src/pages/AuditLogs/AuditLogs.jsx:304` | ☐ |
| 11 | `vitest` + one test for `enrollmentParser` / `validateRows` | `package.json:34`, `src/utils/ExcelParsers/__tests__/` | ☐ |
| 12 | `file_versions` table + history UI | `supabase/migrations/`, `src/pages/Repository/RepositoryFolderDetailPage.jsx` | ☐ |
| 13 | Dashboard `Template view` watermark + disable export when fallback | `src/pages/Dashboard/Dashboard.jsx:2729` | ☐ |
| 14 | `tsvector` search migration | `supabase/migrations/` | ☐ |

---

## 10. Defense Tactics & Script

### Opening (60 seconds)

> "ONEdata is a division→section repository with structured Excel ingestion for enrollment, classrooms, seats, teachers, textbooks, CESPES and KPI — validated, synced to normalized tables, visualized on the Dashboard, governed by verification stamps and audit logs. Code is in `src/` + `supabase/`, not docs. We disclose 6 implemented scopes beyond the thesis outline and 8 limitations in `THESIS_SCOPE_LIMITATIONS.md` — we will lead with both."

### Slide Order

1.  **System purpose + roles** — show `Sidebar.jsx` nav filtering live.
2.  **Upload → Parse → Store → Notify** — live upload `enrollment.xlsx` → show `runImport` validation → storage path `sections/...` → `files` row → `enrollment_data` JSONB → Dashboard update + notification.
3.  **Repository RBAC** — demo `division_focal` `full` vs `section_personnel` `locked` → `division_access_request` flow.
4.  **Dashboard** — show real `enrollment_data` query, point to `Template view` badge for empty SY, show `printPerformanceReport` → pivot to planned `jspdf` branded export.
5.  **Strengths** — parse-first safety `structuredDataSync.js`, server stamp `generate-verified-pdf`, `500-row` batches, school-year RPCs.
6.  **Limitations + Roadmap** — 8 limitations verbatim + 3 uniques (QR, Executive PDF, Anomaly) — honesty scores higher than hiding.

### What to Say When Attacked

- **"Is your documentation outdated?"** — "Yes, `SYSTEM_DOCUMENTATION.md v0.0.0 July` is early draft, superseded by Sept code audit and this `PANEL_DEFENSE_GUIDE.md`. We reference `src/*:line` not docs."
- **"Where is your ERD?"** — "Live Supabase has full schema; local `supabase_schema.sql` is minimal for dev (`SYSTEM_CAPABILITIES.md:13`). We generated ERD via DBeaver direct connection — `ERD_DIAGRAM_GUIDE.md` was tooling stub, now replaced."
- **"Why no principal role?"** — "Docs hallucinate it; code has 4 roles `src/utils/accessControl.js:5`. We struck it."
- **"Why window.print and not PDF?"** — "MVP used `window.print` `Dashboard.jsx:3645`; now `jspdf` + `autotable` (already in `package.json:23`) — demo both."

### What NOT to Claim

- Do **not** claim Dashboard is division-scoped — it's global (`school_year` only).
- Do **not** claim full-text search — it's `file_name ilike` only.
- Do **not** claim RLS is complete — it's `USING(true)` for `enrollment_data`.
- Do **not** claim `send-change-email` is guarded — `verify_jwt=false` `config.toml:27`.
- Do **not** claim AIP/QBEDP is ingested — no parser/table.

### Immediate Actions Before Panel

```bash
# 1. Rotate leaked keys
# Supabase Dashboard → Project Settings → API → Reset service_role
# Brevo → API Keys → Regenerate

# 2. Remove .env from git history (requires force push — coordinate)
git rm --cached .env server/.env
echo -e ".env\nserver/.env" >> .gitignore
git commit -m "security: remove leaked env, add .env.example"

# 3. Create .env.example (no real values)
```

---

## 11. Appendix: Key File References

| Path | Lines | What |
|------|-------|------|
| `src/App.jsx` | `36-68,130-131,194-223` | Routing, idle timeout, RoleProtectedRoute |
| `src/contexts/UserContext.jsx` | `15,66-140` | PROFILE_SELECT join, Realtime, focus refetch |
| `src/utils/accessControl.js` | `5,72-88` | ROLES, canAccessDivision, getSectionAccessLevel (4 values) |
| `src/pages/UploadFiles/UploadFilesPage.jsx` | `444,1015,1083` | Upload, upsert, parseAndSync, notifyScope |
| `src/utils/ExcelParsers/services/importService.js` | — | runImport dispatcher |
| `src/utils/ExcelParsers/parsers/enrollmentParser.js` | — | PUBLIC/PRIVATE 100 cols, JSONB |
| `src/utils/structuredDataSync.js` | `4-14` | TABLES_BY_CATEGORY, batch 500, upsert |
| `src/pages/Repository/Repository.jsx` | `88` | Division folders, COLOR_PRESETS, viewMode |
| `src/pages/Repository/RepositoryDivisionPage.jsx` | `60/15` | canAccessDivision, morphing header, section deletion |
| `src/pages/Repository/RepositoryFolderDetailPage.jsx` | `1249,1266` | Search (ilike), bulk ops, verify pill |
| `src/pages/Dashboard/Dashboard.jsx` | `95,1954,2080,2729,3645,3655,3731` | DEFAULT_CESPES_DATA, hardcoded insight, fallbackToTemplate, print reports |
| `src/utils/schoolYearsApi.js` | `236` | formatDateRange, uploadable_school_years, RPCs |
| `src/utils/notifications.js` | — | resolveRecipients, pushNotification |
| `src/utils/templatesApi.js` | — | uploadWithReadableName -2 retry |
| `src/utils/sectionDeletion.js` | — | reauthenticate, requestSectionDeletion, approve |
| `supabase_schema.sql` | `1-83` | Only 2 tables, permissive RLS |
| `supabase/config.toml` | `3-46` | 4 functions registered, 2 missing, send-change-email verify_jwt false |
| `supabase/functions/generate-verified-pdf/index.ts` | — | Stamp + upload verified-pdfs |
| `server/index.js` | `23,97` | /api/create-user, /api/delete-user insecure |
| `src/utils/ExcelParsers/parsers/studentsParser.js` | `86` | TODO LRN 12-digit |
| `src/pages/AuditLogs/AuditLogs.jsx` | `40,304,375` | window.print export, limit 200, deactivate |
| `src/pages/ManageUsers/ManageUsers.jsx` | — | OrganizationView, create/delete-user Edge |
| `src/pages/SchoolYear/SchoolYearPage.jsx` | — | Active/Scheduled/Previous, RPCs |
| `src/data/cespesTemplateData.js` | — | DEFAULT_CESPES_DATA (5 tabs) |
| `vite.config.js` | `1-20` | Minimal, no PWA, define global |
| `package.json` | `12-45` | Deps, no tests, no zod/helmet/rate-limit |

---

*Generated from code, not docs. Update this file when code changes — docs drift.*
