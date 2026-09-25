# Paper Revision Guide — DRAFT-2 vs System (Checklist)

Source: `ONEDATA-Capstone-Chapter-1-5-FINAL-DRAFT-2.docx` vs code (`src/` + `supabase/`).
Date: 2026-09-25. Format per item: FINDING → paper quote → code truth → VERDICT.
Severity: P0 = panel-fatal if demoed, P1 = must-fix text, MINOR = polish.
Companion: `03-scope-limitations-revision.md` holds the Scope/Limitations rewrite.

## Ch1 — Objectives, Framework, Scope, Significance

- [ ] P0 — Specific Objective "multiple dashboard views tailored to different user groups."
  Paper implies Public / Personnel / Administrative views. Code has TWO surfaces:
  landing-page public statistics (`HeroStats`, unauthenticated, summary-level)
  + one identical authenticated dashboard for all roles, year-filter only.
  VERDICT: reword to the two-surface framing; delete the Administrative view.
- [ ] P0 — IPO inputs list "public users" alongside the 4 roles. No public role
  exists. VERDICT: replace with "unauthenticated visitors (landing statistics only)."
- [ ] P1 — Scope "student records, personnel information, and school resources."
  Too vague; hides the 7-category ingestion contribution. VERDICT: list enrollment,
  classrooms, seats, teachers_inventory, textbook_inventory, CESPES,
  performance_indicators; note AIP/QBEDP/accomplishment_report are stored-only.
- [ ] P1 — Scope "upload, view, request access, and handle files." Undersells the
  build. VERDICT: add verification stamp + edit-lock, templates, school-year
  lifecycle, feedback, access-request approvals, audit logging, section-deletion
  governance, account-security communications (see 03 ADD list).
- [ ] P0 — "Reports … through specified formats." No dashboard export exists.
  VERDICT: on-screen views only; audit logs via print-friendly browser export.
- [ ] P0 — Limitation "will not permit users to change historical records."
  False: in-place Excel edit, `upsert:true` replace, bulk delete all exist.
  VERDICT: archived years separated by filter; active-year files editable per
  role; no version history. See 03.
- [ ] P1 — Limitations miss 9 disclosable items (division-wide dashboard, 50 MB,
  no versioning, filename-only search, print-only export, web-only/single-tenant,
  stored-only categories, large-PDF lag, Supabase-primary backend). VERDICT:
  adopt the 03 limitations list verbatim.

## Ch2 — Literature Review

- [ ] No action expected (review of related literature/systems). VERDICT: skim only;
  flag here only if a cited claim about the BUILT system slipped into Ch2.

## Ch3 — Methods, Requirements, Flowcharts, Testing

- [ ] P1 — Tech stack: "Node.js backend… Express handles API routing." Supabase
  does ~everything; `server/index.js` is create/delete-user + Brevo mail only.
  VERDICT: Supabase = primary backend; Express = provisioning helper.
- [ ] P1 — Fig 3.2 Settings: name/ID update saved to Supabase. Code: display name
  read-only; only password (`send-password-reset`) and email change
  (`send-change-email`, re-auth required). VERDICT: redraw + reword.
- [ ] P0 — Fig 3.4 and Fig 3.5 are identical Audit Logs paragraphs. VERDICT:
  delete one; in the survivor replace "export the filtered log as a printable
  PDF report" with print-friendly browser export (200-row batches,
  `AuditLogs.jsx`).
- [ ] P1 — Fig 3.7 / 3.9 upload: preview → confirm → save. Code validates then
  uploads + syncs, no preview step (`UploadFilesPage.jsx`). VERDICT: redraw to
  select → validate → upload + parse/sync → notify.
- [ ] P1 — Fig 3.1 login is accurate (5-strike lockout + alert) — keep; optionally
  note the neutral toast and lockout email added after 09-24.
- [ ] P1 — TC-04 expects redirect to "page not found." Code redirects to the
  Access Restricted page. VERDICT: fix expected result.
- [ ] P0 — No verification test case in TC-01…TC-16 despite verification being a
  flagship governance feature (also claimed in Ch4/Ch5). VERDICT: add TC —
  focal/admin verify → Verified + stamped PDF; personnel → action hidden;
  verified file → edit blocked until unverify.
- [ ] P1 — No coverage for section-deletion governance or feedback threads.
  VERDICT: add one TC each, or explicitly mark out-of-scope per
  `01-chapter3-testing-plan.md:25-26`.

## Ch4 — Presentation and Interpretation

- [ ] P0 — §§Public / Division Personnel / Integration claim three views incl.
  an Administrative Dashboard, with division/section/category filters. Code: two
  surfaces (landing stats + one authenticated dashboard), year filter only.
  VERDICT: cut the Administrative view; cut division/section/category filters;
  keep the accurate "additional features" prose (repository, templates,
  school-year, feedback, audit, access requests) — verified correct.
- [ ] P1 — "sorted depending on school year" ( §4.2 organization prose). Sorting
  is by date/name/size; school year is a filter. VERDICT: one-word fix.
- [ ] P1 — "Administrators can search, filter, and export these logs." Vague but
  tolerable next to the Fig 3.4/3.5 fix; VERDICT: align wording with the Ch3 fix.
- [ ] P1 — Fig 4.6 / 4.7 captions ("Public Dashboard View", "Division Personnel
  Dashboard View"). VERDICT: retitle to "Landing-page public statistics" and
  "Authenticated division dashboard"; confirm screenshots match those surfaces.

## Ch5 — Findings, Conclusions, Recommendations

- [ ] P0 — "The researchers also developed two dashboard views … Public Dashboard
  and Division Personnel Dashboard" + "all objectives … were met." Only
  defensible under the corrected two-surface framing; the "Administrative"
  thread must not appear here. VERDICT: reword to landing statistics +
  authenticated dashboard; soften "all objectives met" to the corrected
  objective list.
- [ ] P1 — Recommendations should absorb the Limitations list (role-scoped
  dashboard, versioning, content search, export formats, mobile/API/DR) as
  future work. VERDICT: mirror 03 items 1–9 into recommendations.

## Fix order

1. Ch1 scope/limitations + Ch4 three-view cuts (demo-contradicting).
2. Ch3 flowcharts + TC fixes (evidence-contradicting).
3. Ch5 conclusions conditioned on 1–2.
4. Ch2 skim + MINOR wording.
