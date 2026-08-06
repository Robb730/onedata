# OneData System Capabilities

## Overview
This document describes the current capabilities implemented in the OneData app at `c:\Users\Robb\Documents\projects\onedata`.
It covers authentication, repository file upload and management, file verification, access control, user administration, audit logging, backend APIs, and core navigation flows.

---

## 1. Architecture & Core Stack

### Frontend
- Built with React 19, Vite, and Tailwind CSS.
- Uses React Router v7 for page navigation.
- Uses Supabase JavaScript SDK (`@supabase/supabase-js`) for auth, database, storage, and realtime.
- Uses `lucide-react` for iconography.
- Uses `recharts`, `xlsx`, and `exceljs` for visualization and Excel handling.

### Backend / API
- A minimal Express server lives in `server/index.js`.
- It exposes two admin-facing API routes:
  - `POST /api/create-user` for creating a new Supabase auth user and inserting a row in the `users` table.
  - `POST /api/delete-user` for deleting a user row and the corresponding Supabase auth account.
- The server sends onboarding email content using Brevo (formerly Sendinblue).

### Data and database assumptions
- Supabase is the primary backend for auth, database, and storage.
- The app depends on tables such as:
  - `users`
  - `divisions`
  - `sections`
  - `files`
  - `audit_logs`
  - structured tables like `enrollment_data`, `classrooms_school_db`, `teachers`, `textbooks`, etc.

---

## 2. Authentication & User Profile

### Login and route protection
- `src/pages/Login/LoginPage.jsx` handles login and redirect flows.
- `src/components/ProtectedRoute.jsx` blocks unauthenticated access and redirects to `/login`.
- `src/App.jsx` defines routes and wraps protected pages with `ProtectedRoute`.

### UserContext and realtime profile updates
- `src/contexts/UserContext.jsx` provides `userProfile`, `setUserProfile`, `loading`, and `refreshProfile`.
- It loads the current Supabase auth user and then fetches the profile from `users`:
  - `id, email, full_name, role, division_id, section_id, must_change_password`
- It subscribes to realtime database changes on the current user row and updates the profile automatically.
- It also refetches on browser tab focus to recover from dropped realtime subscriptions.

### Sample profile loader snippet
```js
const { data, error } = await supabase
  .from("users")
  .select(PROFILE_SELECT)
  .eq("id", user.id)
  .single();
```

---

## 3. Routing and Navigation

### App routes in `src/App.jsx`
- `/` → `LandingPage`
- `/login` → `LoginPage`
- `/dashboard` → `Dashboard`
- `/manage-user` → `ManageUsers`
- `/upload-files` → `UploadFilesPage`
- `/audit-logs` → `AuditLogs`
- `/repository` → `Repository`
- `/repository/folder/:folderName` → `RepositoryFolderDetailPage`
- `/repository/divisions/:divisionSlug` → `RepositoryDivisionPage`
- `/repository/restricted/:folderName` → `AccessRestrictedPage`

### Route protection
- `ProtectedRoute` checks `session` and redirects to `/login` when missing.
- This is currently the only gatekeeper for page access in the React app.

---

## 4. Access Control

### Role-based access utility
- `src/utils/accessControl.js` defines access rules and normalized role constants.
- It resolves a user's effective division by using `division_id` first, then falling back to `section_id` if needed.

### Division access logic
- `canAccessDivision(userProfile, divisionId, resolvedDivisionId)` allows:
  - `administrator` to access every division
  - `division_focal`, `section_focal`, and `section_personnel` only to their own division

### Section file access levels
- `getSectionAccessLevel(userProfile, section)` returns:
  - `full` for full access
  - `locked` for read-only access
  - `blocked` for redirecting to restricted access
- Section-scoped roles compare `section_id` first and fall back to `division_id` only if `section_id` is missing.

### Example access snippet
```js
if (role === ROLES.SECTION_FOCAL || role === ROLES.PERSONNEL) {
  if (section_id != null) {
    return sameId(section_id, section.id) ? "full" : "locked";
  }
  if (!sameId(division_id, section.division_id)) return "blocked";
  return "locked";
}
```

---

## 5. Repository Module

### Division overview page
- `src/pages/Repository/Repository.jsx` fetches all divisions and division focal managers.
- It shows division cards with:
  - division name
  - active manager list
  - navigation to `/repository/divisions/:division.id`

### Division manager lookup
- The division overview page queries `users` with:
  - `role = division_focal`
  - `is_active = true`
  - non-null `division_id`
- It groups managers by `division_id` and passes the names to the folder card.

### Folder card component
- `src/components/RepositoryComponents/FolderCard.jsx` renders a division card.
- It displays:
  - folder icon
  - division name
  - section count badge
  - `Managed by` block with full manager names

### Division detail page
- `src/pages/Repository/RepositoryDivisionPage.jsx` renders the section list inside one division.
- It fetches:
  - `division` row by `divisionSlug`
  - `sections` rows filtered by `division_id`
  - `divisionManagers` from `users` where `division_id = divisionSlug` and user is division-level (based on `section_id` being 0, "0", or null)

### Division manager rendering
- A dedicated stats card renders manager names in the division page.
- Example render block:
```jsx
<p className="mt-1 text-sm font-semibold text-gray-900">
  {loading
    ? "—"
    : divisionManagers.length
      ? divisionManagers.join(", ")
      : "—"}
</p>
```

### Section folder grid
- Section entries map sections into UI cards.
- Each section card shows section name, section manager, and file counts.

---

## 6. File Detail & Verification

### Repository folder detail page
- `src/pages/Repository/RepositoryFolderDetailPage.jsx` renders the file list for a selected section.
- It queries:
  - `sections` by name
  - `files` by `section_id`
  - `users` for uploader details using `uploaded_by`

### Uploader lookup
- The page builds a lookup of uploader IDs from the `files` rows.
- Then it queries the `users` table for those IDs and maps `full_name` and role.
- Each row displays uploader name, role, and initials.

### File status and verify logic
- Status is derived from `files.is_dashboard_source`.
- The display mapping is:
```js
status: f.is_dashboard_source ? "Verified" : "For Review",
```
- Verify/unverify toggles are handled by updating `is_dashboard_source`.

### Verification update example
```js
await supabase
  .from("files")
  .update({ is_dashboard_source: newValue })
  .eq("id", file.id);
```

### File table features
- Search by file name or uploader.
- Sort by name, size, or date.
- Tabbed file type filtering.
- Bulk verify/unverify actions.
- Download and delete actions when permitted.

---

## 7. Upload Files Page & User Interactions

### Upload page layout
- `src/pages/UploadFiles/UploadFilesPage.jsx` contains upload UI and the upload processing workflow.
- It supports:
  - drag-and-drop file upload
  - file browsing
  - folder selection for eligible users
  - request upload workflows for non-admin users

### Folder selection logic
- The page uses a folder selection step when the uploading user may choose a target section.
- Personnel users are often assigned to their own section and skip manual folder assignment.

### Upload callbacks
- `triggerUpload(fileName)` opens the upload modal.
- `handleFolderSelect(folder)` moves the user to upload detail entry.
- `handleFinalUpload()` in `FileUploadModal.jsx` calls the parent `onUpload(...)` callback.
- The parent callback `addToUploads(...)` performs storage upload, metadata insert, and audit logging.

### Storage & metadata insertion
- Files upload to:
  - `repository-files` for general attachments
  - `excel-files` for structured data uploads
- Insert example:
```js
const { data: fileRow, error: dbError } = await supabase
  .from("files")
  .insert({
    file_name: fileName,
    file_path: storagePath,
    file_size: file.size,
    file_type: file.type || null,
    data_category: uploadType,
    school_year: schoolYear,
    section_id: sectionId,
    division_id: divisionId,
    uploaded_by: userProfile?.uuid ?? null,
    uploaded_by_name: userProfile?.full_name ?? null,
    status: "Unverified",
    is_dashboard_source: uploadType !== "general",
  })
  .select()
  .single();
```

### Structured upload processing
- Structured uploads invoke parsing and syncing to domain tables.
- This enables ingesting education data like school inventories and enrollment records.

### Recent uploads & logging
- Recent upload entries and audit log summaries are shown on the upload page.
- The page refreshes recent upload records after a successful upload.

---

## 8. User Administration

### Manage Users page
- `src/pages/ManageUsers/ManageUsers.jsx` handles user listing and management.
- It fetches `users` and their related `divisions` and `sections`.
- The page renders user rows with division, section, role, and status.

### User lifecycle actions
- Create new users.
- Edit user details and role assignments.
- Activate/deactivate accounts.
- Delete users.

### Backend user creation
- `server/index.js` implements `POST /api/create-user`.
- It uses Supabase admin API to create auth accounts and user metadata.
- It inserts the new user into the `users` table.
- It sends a welcome email with a temporary password.

### Backend user deletion
- `POST /api/delete-user` deletes the `users` row and the matching Supabase auth account.
- This is used by frontend admin actions for user removal.

---

## 9. Audit Logging

### Audit log page
- `src/pages/AuditLogs/AuditLogs.jsx` renders audit history.
- It supports filtering by action, status, and free-text search.

### Audit capture
- Uploads, verify actions, downloads, deletes, and admin actions log events.
- Log entries include `action`, `file_name`, `details`, `performed_by`, `role`, `performed_on`, and `status`.

### Export support
- The audit page has an export/print-friendly render path.
- Users can view a printable summary of the current audit query.

---

## 10. Notable UX / UI Features

### Search and filtering
- Repository list search filters by folder and division.
- File list search filters by file name and uploader.
- Audit logs support text search, action, and status filters.

### File status UI
- File rows show badges for `Verified` and `For Review`.
- Hover cards surface uploader details, division, and upload metadata.

### Responsive layout
- Folder cards and file tables are responsive.
- Section pages use card and table layouts for both desktop and mobile.

---

## 11. Code Patterns and Extensibility

### Supabase query style
- Most data access uses `.from(...).select(...).eq(...).order(...)`.
- The code mixes row fetches and grouped user lookups.
- It is currently more UI-driven than service-layer driven.

### Role normalization
- `src/utils/accessControl.js` defines canonical `ROLES`.
- It is the main place where role-based behavior and access checks are centralized.

### Realtime user refresh
- UserContext uses Supabase realtime subscriptions and tab-focus refresh.
- This keeps the logged-in user profile fresh after permission changes.

---

## 12. Current Limitations and Observations

### Existing gaps
- The division page manager query assumes division-level users are identified by `section_id` being 0, "0", or null.
- There is no separate route guard enforcing division/section access beyond `ProtectedRoute`.
- The system only surfaces `division_focal` managers in the division overview; other manager roles may be omitted.

### Recommended improvements
- Add reusable data services for division managers, section owners, and file queries.
- Add explicit pagination for large audit logs and file tables.
- Introduce server-side role enforcement for protected API calls and use Supabase policies.

---

## 13. How to Read the Codebase

### Entry points
- `src/App.jsx` — route definitions and page wiring
- `src/contexts/UserContext.jsx` — auth profile lifecycle
- `src/pages/Repository/Repository.jsx` — division listing
- `src/pages/Repository/RepositoryDivisionPage.jsx` — division detail
- `src/pages/Repository/RepositoryFolderDetailPage.jsx` — section file list
- `src/pages/UploadFiles/UploadFilesPage.jsx` — upload flow
- `src/pages/ManageUsers/ManageUsers.jsx` — user admin
- `src/pages/AuditLogs/AuditLogs.jsx` — audit history

### Backend file
- `server/index.js` — admin user creation and deletion APIs

### Utility files
- `src/utils/accessControl.js` — role and access helpers
- `src/utils/structuredDataSync.js` — Excel parse and data sync logic

---

## 14. File and Folder Conventions

### Components
- `src/components/RepositoryComponents` — repository folder cards and controls
- `src/components/UploadFilesComponents` — upload modals and file intake UI
- `src/components/ManageUsersComponents` — admin user panels
- `src/components/AuditLogsComponents` — audit page widgets

### Pages
- `src/pages/Repository` — repository navigation and section/file views
- `src/pages/UploadFiles` — upload experience and processing
- `src/pages/ManageUsers` — admin user management
- `src/pages/AuditLogs` — audit log exploration

### Shared libs
- `src/lib/supabaseClient.js` — Supabase client
- `src/contexts/UserContext.jsx` — global user state
- `src/utils` — shared data and helpers

---

## 15. Example Code Snippets

### Protected route wiring
```js
function ProtectedRoute({ session, children }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
```

### File upload metadata insertion
```js
await supabase
  .from("files")
  .insert({
    file_name,
    file_path,
    file_size,
    file_type,
    data_category: uploadType,
    school_year,
    section_id,
    division_id,
    uploaded_by: userProfile?.uuid ?? null,
    uploaded_by_name: userProfile?.full_name ?? null,
    status: "Unverified",
    is_dashboard_source: uploadType !== "general",
  })
  .select()
  .single();
```

### Division manager query
```js
const { data: divisionManagersData } = await supabase
  .from("users")
  .select("full_name, section_id")
  .eq("division_id", divisionSlug)
  .eq("is_active", true);

setDivisionManagers(
  (divisionManagersData || [])
    .filter((u) => u.section_id === 0 || u.section_id === "0" || u.section_id == null)
    .map((u) => u.full_name),
);
```

### File verification update
```js
const newValue = !file.isDashboardSource;
await supabase
  .from("files")
  .update({ is_dashboard_source: newValue })
  .eq("id", file.id);
```

---

## 16. Summary
OneData currently supports:
- authenticated Supabase sign-in and protected pages
- role-aware repository navigation across divisions, sections, and files
- upload-to-storage with file metadata persistence
- structured Excel ingestion and sync into domain-specific tables
- file verification, download, and delete workflows
- audit logging for upload and admin actions
- user management including create, edit, activate/deactivate, and delete
- backend admin API support for user lifecycle and email onboarding

This document is intended to help developers understand what the system already does and where to extend it next.
