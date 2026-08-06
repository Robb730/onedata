# OneData System Capabilities

## Overview
This document describes the current capabilities implemented in the OneData app at `c:\Users\Robb\Documents\projects\onedata`.
It covers authentication, repository file upload and management, file verification, access control, user administration, audit logging, and core navigation flows.

---

## 1. Authentication & Session Management

### Login and session flow
- Login is implemented in `src/pages/Login/LoginPage.jsx`.
- Authentication is handled by Supabase Auth.
- `src/contexts/UserContext.jsx` loads the logged-in user's profile from the `users` database table after sign-in.
- The app refreshes the profile on auth state changes and on tab focus.
- Protected routes are enforced by `src/components/ProtectedRoute.jsx`.
- `src/App.jsx` wraps all protected pages under `ProtectedRoute`.

### User profile caching and realtime updates
- User profile state includes `id`, `email`, `full_name`, `role`, `division_id`, `section_id`, and `must_change_password`.
- The profile is refreshed locally and stored in `localStorage`.
- A Supabase realtime channel listens for updates to the current user's `users` row and updates the profile automatically.

---

## 2. Upload Files Workflow

### UI flow
- Uploads are initiated from `src/components/UploadFilesComponents/FileUploadModal.jsx`.
- The component collects:
  - file name
  - upload file
  - school year
  - upload type
- There is a two-step flow for selecting category/subfolder when applicable.

### Upload processing
- The core upload logic lives in `src/pages/UploadFiles/UploadFilesPage.jsx`.
- `addToUploads(...)` performs the upload and database insert.
- Upload steps:
  1. Upload file to Supabase Storage in either `repository-files` or `excel-files` bucket.
  2. Insert a record in the `files` table.
  3. If the upload type is structured data, parse and sync data into dedicated tables.

### Database metadata inserted for uploads
- `files` table insert fields include:
  - `file_name`
  - `file_path`
  - `file_size`
  - `file_type`
  - `data_category`
  - `school_year`
  - `section_id`
  - `division_id`
  - `uploaded_by`
  - `uploaded_by_name`
  - `status` (initially `Unverified`)
  - `is_dashboard_source` (true for structured upload types, false for `general` uploads)

### Structured data handling
- Structured upload types include:
  - `enrollment`
  - `classrooms`
  - `seats`
  - `teachers_inventory`
  - `textbook_inventory`
  - `cespes`
- `parseAndSyncStructuredData(...)` from `src/utils/structuredDataSync.js` parses the Excel file and inserts rows into the corresponding Supabase tables.
- This means the system can already ingest and persist structured education data beyond file storage.

### Audit logging for uploads
- Every upload attempt is logged to `audit_logs`.
- Success and failure cases are both recorded with `action`, `file_name`, `details`, `performed_by`, `role`, and `status`.

---

## 3. Repository & File Management

### Repository dashboard
- The repository overview page is implemented in `src/pages/Repository/Repository.jsx`.
- It lists divisions as folder cards.
- Each card shows division name, active managers, and navigates to `/repository/divisions/:divisionSlug`.

### Division page
- The section folder list inside a division is rendered by `src/pages/Repository/RepositoryDivisionPage.jsx`.
- It fetches:
  - `divisions` row by `id`
  - `sections` rows by `division_id`
  - active users in the division whose `section_id` is `0`, `