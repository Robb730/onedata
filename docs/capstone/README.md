# Capstone Reference Notes

Saved discussions for OneData capstone. Docs only — no code changes made to create these.
Date: 2026-09-24

## Files

- `01-chapter3-testing-plan.md` — Copied from root `CHAPTER3_SYSTEM_TESTING.md`. 8 highlight modules, TC-01 to TC-15, paper table header: Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status/Remarks. Manual black-box highlights-only approach per adviser.
- `02-thesis-audit-ch1-5-vs-system.md` — Full Chapters 1-5 draft vs code audit. P0: no public/division/admin split dashboards, no school-head/public roles, no division/section dashboard filter, mutable history vs immutable claim, print-only audit export vs PDF claim, Supabase primary vs Express-primary claim. P1: Fig 3.4=3.5 duplicate, table/figure numbering, settings/upload flowchart overclaims, advanced-search overclaim.
- `03-scope-limitations-revision.md` — What to Keep/Edit/Add in Chapter 1 Scope/Limitations to match 7-category ingestion, verification stamp, access-request + notifications, templates, school-year lifecycle, feedback/audit/section-deletion; plus 8 limitations to disclose (global dashboard, 50MB, no versioning, filename search only, print-only export, no mobile/API/backup single-tenant, AIP/QBEDP stored-only, large-PDF note).
- `04-verified-pdf-large-file-fix.md` — Large Excel/PDF shows Verified but no stamped PDF. Root cause + Always-works plan (pending Verifying state, 90s timeout + 3x retry, Regenerate button, Edge fast/slow path hardening, Express LibreOffice fallback, lazy on-download generate).

## Source paths

- Thesis: `C:\Users\Robb\Downloads\Capstone Files\4th Year 2026\ONEDATA-Capstone-Chapter-1-5-FINAL-DRAFT-1.docx`
- Code: `src/pages/Repository/RepositoryFolderDetailPage.jsx`, `src/pages/Dashboard/Dashboard.jsx`, `src/utils/accessControl.js`, `src/utils/schoolYearsApi.js`, `supabase/functions/generate-verified-pdf/`, `server/index.js`
- Docs: `PANEL_DEFENSE_GUIDE.md`, `SYSTEM_CAPABILITIES.md`, `THESIS_SCOPE_LIMITATIONS.md`

## How to use next chat

Tell assistant: read `docs/capstone/README.md` + relevant `0x-*.md` for context. Then ask follow-up (e.g. draft replacement paragraphs, implement verified-PDF fix, expand test tables).
