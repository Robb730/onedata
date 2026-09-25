# Scope & Limitations Revision — What System Can Actually Do

Reference: DRAFT-2 Chapter 1 Scope/Limitations (p.9) vs `SYSTEM_CAPABILITIES.md`, code (`src/` + `supabase/`).
Date revised: 2026-09-25 (supersedes 2026-09-24 version; audited against FINAL-DRAFT-2).

## Dashboard framing (team-confirmed, read first)

The paper claims "multiple dashboard views." The correct, defensible framing is
exactly TWO surfaces — do not claim a third "Administrative Dashboard" view:

- (a) **Public landing-page statistics** — `HeroStats` + `useLandingStats`
  (`src/components/LandingPageComponents/`, `src/hooks/useLandingStats.js`).
  Unauthenticated visitors see summary-level enrollment / schools / teachers /
  classrooms figures computed from live tables. No account, no login, no detail.
- (b) **Authenticated division dashboard** — `/dashboard` (`src/pages/Dashboard/Dashboard.jsx`).
  One identical view for all 4 roles, filtered by school year only.

Consequences used throughout this file:

- "Public users" as a role/actor does not exist. Write "unauthenticated
  visitors (landing-page statistics only)."
- There is no division / section / data-category filter on either surface.
  Both filter by school year only.

## Current Scope (DRAFT-2 draft) — verdict

KEEP:

- Web-based centralized repository + dashboard for DepEd Baliwag Division only.
- 4 roles: administrator, division_focal, section_focal, section_personnel.
- Upload / view / request access per permission, filter by school year.
- Controlled test environment, stable internet required.
- No advanced analytics / predictive / AI (matches code — none exist).

EDIT:

- `handles student records, personnel info, school resources` → too vague.
  Replace with the actual parser categories: enrollment, classrooms, seats,
  teachers_inventory, textbook_inventory, CESPES, performance_indicators
  (`src/utils/structuredDataSync.js`, `src/utils/ExcelParsers/`).
- `reports in specified formats` → false. No dashboard PDF/Excel export exists;
  audit logs export via print-friendly browser window only. Replace with:
  `on-screen dashboard views; audit logs through a print-friendly browser export`.
- `will not permit users to change historical records` → FALSE. System allows
  Excel in-place edit (`FileEditModal`), replace-upload with `upsert:true`,
  bulk delete. Replace with: `Archived school years are separated by the
  school-year filter; files in the active year remain editable / replaceable /
  deletable per role. No version history is kept.`

ADD to Scope (implemented but missing from the draft):

1. Structured Excel ingestion — parses Excel into normalized tables feeding the
   Dashboard (`src/utils/structuredDataSync.js`, `src/utils/ExcelParsers/`).
2. Verification governance — verify/unverify (focal/admin only), stamped
   Verified PDF on every page (`supabase/functions/generate-verified-pdf/`),
   verified files locked from editing until unverified (`FileEditModal.jsx`).
3. Access-request workflow — file-level + division-level approve/deny/revoke
   with realtime in-app notifications (`src/utils/notifications.js`,
   `useNotifications.js`, `accessRequestsApi.js`, `divisionAccessRequestsApi.js`).
4. Templates management — admin/division_focal upload standardized Excel
   templates assigned to sections (`src/pages/Templates/`, `src/utils/templatesApi.js`).
5. School-year lifecycle — schedule / activate / archive / reopen / close via
   admin + RPCs (`src/utils/schoolYearsApi.js`, `SchoolYearPage.jsx`).
6. Feedback threads + audit logs + section-deletion governance — per-file
   feedback with realtime updates; audit trail; section-deletion request +
   admin approval with password re-auth (`sectionDeletion.js`).
7. Account security communications (added after 2026-09-24) — 5-strike
   auto-lockout with Security Alert log (`LoginForm.jsx`); deactivation emails
   for auto-lockout, manual deactivation (optional reason), and audit-review
   deactivation (`supabase/functions/send-deactivation-email/`,
   `src/utils/deactivationEmail.js`); neutral login toast revealing nothing
   about account state; FK-safe user deletion preserving files/messages/review
   names (`supabase/functions/delete-user/`, `reviewed_by_name`).

Paste-in sentence:

> System covers structured ingestion for 7 categories, verification stamping
> with edit-lock, templates, per-file feedback, access-request approvals with
> notifications, audit logging, school-year management, and account-security
> communications (auto-lockout, deactivation emails, FK-safe user deletion).

## Current Limitations (DRAFT-2 draft) — verdict

EDIT (false vs code):

- `will not permit users to change historical records` → see EDIT above.

ADD (disclose to survive panel):

1. Dashboard is division-wide, not role-scoped — all roles see the same
   metrics, filtered by school year only (`Dashboard.jsx` global query).
   Landing statistics are summary-level only.
2. 50 MB max per file. Allowed: xlsx, xls, pdf, docx, pptx, csv, txt,
   png/jpg/jpeg/gif, zip/rar.
3. No file versioning — replace overwrites, old rows deleted via
   `deleteParsedDataForFile`. Verified files uneditable until unverified.
4. Search by filename/uploader only; type tabs All/PDF/Excel/Word; no
   full-text inside files, no date/size/status filters
   (`RepositoryFolderDetailPage.jsx`).
5. No dashboard PDF/Excel export — audit logs print-friendly browser export
   only, 200-row UI batches (`AuditLogs.jsx`).
6. No native mobile app (responsive web only), no public API, no app-level
   backup/DR (relies on Supabase managed hosting), single-tenant for Baliwag
   only. Landing-page stats section is the only public surface; `/test`
   extractor route is unguarded.
7. AIP (school/SDO) / QBEDP / accomplishment_report upload categories stored
   as files only, not parsed to dashboard (no parser in `structuredDataSync.js`).
8. Large-file verified-PDF note: Edge conversion may time out → status
   Verified but stamped PDF pending until retry (unverify → re-verify).
9. Backend honesty: Supabase (Auth/DB/Storage/Edge) is the primary backend;
   Express covers user provisioning + Brevo mail only. Local
   `supabase_schema.sql` is incomplete vs the live project; RLS there is
   permissive, with enforcement in app-level scope checks (`accessControl.js`).

Do NOT copy from:

- `SYSTEM_DOCUMENTATION.md` "Known Issues & Limitations" and "Future Roadmap"
  sections — stale (claim mock data, no storage, no audit table; all
  contradicted by the code).
