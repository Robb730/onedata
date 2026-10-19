# Verified PDF Large-File Issue + Always-Works Fix Plan

Date saved: 2026-09-24
Status: NOT mentioned as limitation in thesis draft nor in `THESIS_SCOPE_LIMITATIONS.md`. Handled in code with alert only. User chose: Always works (Recommended), for unknown big Excel/PDF sizes.

## Observed bug

File shows Verified badge but no signed PDF in `verified-pdfs/` bucket when file is big.

## Root cause (code truth)

- `src/pages/Repository/RepositoryFolderDetailPage.jsx:2135-2140` sets `status='Verified'` FIRST, then `fetch .../functions/v1/generate-verified-pdf` with no timeout / no retry.
- Edge `supabase/functions/generate-verified-pdf/index.ts:94-96` does `XLSX.read (full RAM) → convertExcelToPdf → stampPdf every page → upload → update files.verified_pdf_path`.
- Caps exist (`convertExcelToPdf.ts:19-20` MAX 2000 rows x 60 cols + `trimToContent`) but multi-sheet still = 100s of pages via `pdf-lib`, heavy for Edge memory/time budget → timeout / 500 / 546.
- On failure: `pdfGenerationFailed=true`, keeps `Verified` + `verifiedPdfPath=null`, audit `Verified in X (verified PDF generation failed)`, `alert("File verified, but the stamped PDF couldn't be generated...")` (`RepositoryFolderDetailPage.jsx:2216-2220`).
- Retry today = manual unverify → re-verify. No Regenerate button. Bulk verify silently skips locked files.

PDF path is cheap (skip conversion, only stamp). Excel path is the slow one.

## Always-works plan (approved direction)

1. Atomic state — never show Verified without PDF job:
   - Keep `status='Verified'` write, but UI pill shows `Verifying...` until Edge returns `{success, path}`. Only then flip to `Verified`.
   - If fail, keep `Verifying (retrying)` + auto-retry, not false Verified.

2. Frontend robust retry (`confirmVerify`, lines 2153-2230):
   - `fetch` with `AbortController` 90s timeout, 3 attempts backoff 2s / 5s / 10s.
   - Idempotent safe (Edge `upsert:true`).
   - Add `Regenerate stamped PDF` button when `status==='Verified' && !verifiedPdfPath`. Poll every 5s until path appears.
   - Lazy safety net: `Download Verified PDF` menu triggers generation on-demand with spinner if path missing.

3. Edge hardening (`generate-verified-pdf/`):
   - Fast path PDF ext → skip `convertExcelToPdf`, only `stampPdf`.
   - Slow path Excel: per-stage try/catch returning `{error, stage, retryable:true/false}` so frontend knows retry vs fatal (unsupported ext).
   - `stampPdf.ts`: keep fonts embedded once, `pdfDoc.save({ useObjectStreams:true })` to cut memory.

4. Server fallback for huge files (true always):
   - Reuse `server/convertExcelToPdf.js` LibreOffice `soffice --headless` (disk-streaming, higher fidelity than Deno xlsx dump) + `server/stampPdf.js`.
   - New `POST /api/generate-verified-pdf {id}` in `server/index.js`: download → convert → stamp → upload to `verified-pdfs` → update `files.verified_pdf_path`.
   - Frontend chain: Edge 3x → on retryable/timeout → Express fallback → same path.

5. Files to touch (when approved for code change):
   - `src/pages/Repository/RepositoryFolderDetailPage.jsx:2116-2230`
   - `supabase/functions/generate-verified-pdf/index.ts:42-128`, `convertExcelToPdf.ts`, `stampPdf.ts`
   - `server/index.js`, `server/convertExcelToPdf.js`
   - `DownloadOptionsMenu.jsx` (on-demand generate)

## Verify fix

Test 50 MB Excel multi-sheet, 50 MB scanned PDF, bulk verify 10 files, kill Edge once to prove retry + fallback still yields `verified-pdfs/{id}.pdf` + badge flips only on success.

## Thesis impact

Once fixed, DELETE limitation sentence about large-file verify failure. Claim: verification atomically produces stamped PDF with retry + server fallback.
