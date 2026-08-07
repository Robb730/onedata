# OneData System Capabilities

## Overview
This document describes the currently implemented capabilities in OneData at `c:\Users\Robb\Documents\projects\onedata`.
It covers active features for authentication, repository and file workflows, access control, user administration, audit logging, structured data ingestion, analytics, and core backend integration.

---

## 1. Architecture & Core Stack

### Frontend
- React 19 with Vite.
- React Router v7 for navigation.
- Tailwind CSS for styling.
- `lucide-react` iconography.
- `recharts` for dashboard charts.
- `xlsx` and `exceljs` for Excel file handling and import.
- Supabase JavaScript SDK (`@supabase/supabase-js`) for auth, database, realtime, and storage.

### Backend / API
- Express server in `server/index.js`.
- Uses Supabase service-role client.
- Provides admin-only endpoints:
  - `POST /api/create-user`
  - `POST /api/delete-user`
- Sends onboarding emails through Brevo.

### Data and storage
- Supabase is the backend for authentication, database, realtime, and storage.
- Key tables referenced in code:
  - `users`, `divisions`, `sections`, `files`, `audit_logs`
  - `file_access_request`, `division_access_request`
  - structured import tables such as `enrollment_data`, `classrooms_*`, `seats_*`, `teachers_*`, `textbooks_*`, `cespes_*`
- Storage buckets:
  - `repository-files`
  - `excel-files`

---

## 2. Authentication and Profile Management

### Login and route protection
- Login handled in `src/pages/Login/LoginPage.jsx`.
- `src/components/ProtectedRoute.jsx` protects authenticated screens.
- `src/App.jsx` wraps protected routes with `ProtectedRoute`.

### User context
- `src/contexts/UserContext.jsx` provides:
  - `userProfile`,
  - `setUserProfile`,
  - `loading`,
  - `refreshProfile()`.
- It loads the authenticated user and then queries the `users` table for profile details.
- Realtime updates on the current user row are subscribed and applied automatically.
- Tab focus triggers a profile refresh if needed.

### Profile fields
- Fetched profile fields include:
  - `id`, `email`, `full_name`, `role`,
  - `division_id`, `section_id`,
  - `must_change_password`,
  - `division.name` and `section.name` via embedded joins.

---

## 3. Routing and Navigation

### Active routes
- `/` — Landing page.
- `/login` — Login page.
- `/dashboard` — Dashboard.
- `/manage-user` — Manage Users.
- `/upload-files` — Upload Files.
- `/audit-logs` — Audit Logs.
- `/repository` — Repository overview.
- `/repository/divisions/:divisionSlug` — Division detail.
- `/repository/folder/:folderName` — Section folder detail.
- `/repository/restricted/:folderName` — Restricted access page.
- `/school-year` — School Year UI.

### View modes and local storage
- Repository view mode is persisted in local storage.
- Folder colors on the repository page are also stored in component state.

---

## 4. Role-Based Access Control

### Roles supported
- `administrator`
- `division_focal`
- `section_focal`
- `section_personnel`

### Permission model
- `administrator` has global access.
- `division_focal` can access their own division and all associated sections.
- `section_focal` and `section_personnel` are section-scoped.

### Access functions
- `canAccessDivision(userProfile, divisionId, resolvedDivisionId)` controls division access.
- `getSectionAccessLevel(userProfile, section)` returns:
  - `full` for full edit/download/delete rights,
  - `locked` for view-only rights,
  - `blocked` for redirect to restricted access.

### Access flow
- If a user’s section access resolves to `blocked`, they are redirected to the restricted access page.
- Locked users can view files but may need to request download access.

---

## 5. Repository and Folder Workflows

### Division repository overview
- `src/pages/Repository/Repository.jsx` fetches divisions and active division focal managers.
- Displays division folders with manager names, icon colors, search, and view modes.
- Supports tabs for `All`, `Active`, `Review`, and `Archived`.

### Division detail page
- `src/pages/Repository/RepositoryDivisionPage.jsx` lists all sections in a selected division.
- Fetches: division metadata, section rows, and managers for the division.
- Shows section cards and section manager names.

### Section folder detail page
- `src/pages/Repository/RepositoryFolderDetailPage.jsx` is the main file management screen.
- Loads section and division data, section manager names, files, and uploader details.
- Supports:
  - search by file name or uploader,
  - sorting by date/name/size,
  - file type tabs (`All`, `PDF`, `Excel`, `Word`, `Image`),
  - list and grid displays,
  - hover previews and tooltip cards,
  - bulk selection and actions.

### File list and UI
- Files are represented with:
  - type icons,
  - file name,
  - status badge,
  - size,
  - uploader,
  - upload date,
  - modified date,
  - actions.
- The UI supports preview cards and uploader detail popovers.

---

## 6. File Actions and Verification

### Download
- Files are downloaded via Supabase storage.
- Downloads use the bucket selected by file category:
  - `repository-files` for `general`
  - `excel-files` otherwise.
- Download events are audit-logged.

### Delete
- Delete removes the file from storage and deletes the `files` row.
- Delete actions are permitted only for users with `full` access.
- Deletions are audit-logged.

### Verify / Unverify
- File verification is controlled by `files.status`.
- Eligible roles:
  - `admin`,
  - `division_focal` within their own division,
  - `section_focal` for their own section.
- `section_personnel` cannot verify even with `full` access.
- Verification toggles are audit-logged as `Verify` or `Unverify`.

### Bulk verification actions
- Selected files can be batch verified or unverified when permitted.
- The bulk bar appears when one or more files are selected.

---

## 7. File Access Requests

### File-level requests
- Blocked users can request access to a file or multiple selected files.
- Requests are recorded in `file_access_request` with status `pending`.
- The request includes:
  - `file_id`,
  - `section_id`,
  - `requested_by`,
  - `requested_by_name`,
  - `message`,
  - `status`.
- Pending files are labeled `Requested`.

### Approver workflow
- `src/components/RepositoryComponents/AccessRequestsSidebar.jsx` renders requests for approvers.
- Approvers can:
  - approve,
  - deny with optional reason,
  - revoke previously approved access.
- Approver scope:
  - `section_focal` sees only their section requests,
  - `division_focal` sees requests across their division,
  - `admin` sees all requests.

### Division access request workflow
- Restricted folder access is handled in `src/pages/Repository/AccessRestrictedPage.jsx`.
- Users can request access to a restricted division or section.
- The page resolves folder/division details and displays assigned division officers.
- It also checks for existing requests using `fetchOwnDivisionRequest()`.

### Request utilities
- `src/utils/accessRequestsApi.js` implements file request operations.
- `src/utils/divisionAccessRequestsApi.js` implements division request operations and approvals.

---

## 8. Uploads and Structured Data Ingestion

### Upload page capabilities
- `src/pages/UploadFiles/UploadFilesPage.jsx` supports:
  - drag-and-drop file upload,
  - browsing files,
  - folder selection,
  - section auto-assignment for personnel,
  - upload state tracking,
  - recent upload history from audit logs.

### Structured upload categories
- Supported categories:
  - `general`,
  - `enrollment`,
  - `classrooms`,
  - `seats`,
  - `teachers_inventory`,
  - `textbook_inventory`,
  - `cespes`.
- Structured uploads are parsed and stored into domain-specific tables.

### Upload processing steps
- Uploads are stored in Supabase Storage.
- Metadata is inserted into `files`.
- Structured uploads trigger `parseAndSyncStructuredData()`.
- Audit logs record upload success or failure.

### Metadata fields
- Stored metadata includes:
  - `file_name`,
  - `file_path`,
  - `file_size`,
  - `file_type`,
  - `data_category`,
  - `school_year`,
  - `section_id`,
  - `division_id`,
  - `uploaded_by`,
  - `uploaded_by_name`,
  - `status`,
  - `is_dashboard_source`.

---

## 9. Structured Data Sync

### Tables by import category
- `enrollment` → `enrollment_data`
- `classrooms` → `classrooms_school_db`, `classrooms_kes`, `classrooms_jhs`, `classrooms_shs`, `classrooms_status`
- `seats` → `seats_kes`, `seats_jhs`, `seats_shs`, `seats_status`
- `teachers_inventory` → `teachers_kes`, `teachers_jhs`, `teachers_shs`, `teachers_status`
- `textbook_inventory` → `textbooks_kes`, `textbooks_jhs`, `textbooks_shs`, `textbooks_status`
- `cespes` → `cespes_operations`, `cespes_support_operations`, `cespes_general_admin`, `cespes_individual_performance`, `cespes_innovation`

### Import behavior
- `src/utils/structuredDataSync.js` parses and inserts rows for structured uploads.
- It supports multi-sheet parsing and sharded inserts in chunks.
- It can delete previously parsed rows for a file to support replacement.
- Enrollment uploads insert records into `enrollment_data`.
- CESPES uploads insert into five dedicated CESPES tables.

---

## 10. User Administration

### Manage Users page
- `src/pages/ManageUsers/ManageUsers.jsx` loads users and related division/section names.
- Supports:
  - user search,
  - division filter,
  - grouping by division,
  - user edit,
  - user activation/deactivation,
  - user deletion,
  - logs viewing via modals.

### User editing
- Admins can update:
  - role,
  - division assignment,
  - section assignment.
- Updates refresh the current signed-in profile if it affects the current user.
- User edits are audit-logged.

### User creation
- `POST /api/create-user` creates a Supabase auth user and a `users` row.
- Generates a temporary password.
- Sends onboarding email through Brevo.
- Supports role mapping from display labels to internal role keys.

### User deletion
- `POST /api/delete-user` deletes the `users` row and the Supabase auth account.
- Returns JSON success or error.
- Audit logs are generated for deletion operations.

---

## 11. Audit Logging

### Audit log page
- `src/pages/AuditLogs/AuditLogs.jsx` fetches audit log data from Supabase.
- Supports search, action filtering, and status filtering.
- Displays logs with action, file name, performer, role, timestamp, and status.

### Realtime updates
- Subscribes to `audit_logs` inserts via Supabase realtime channels.
- New logs appear live in the view.

### Export
- Provides export to a print-friendly HTML report in a new browser tab.
- Export includes all visible log rows and status-colored labels.

---

## 12. Dashboard and Analytics

### Dashboard data sources
- `src/pages/Dashboard/Dashboard.jsx` loads data for the selected school year from Supabase:
  - `enrollment_data`,
  - `cespes_operations`,
  - `cespes_support_operations`,
  - `cespes_general_admin`,
  - `cespes_individual_performance`,
  - `cespes_innovation`.

### Visualizations
- Dashboard components include:
  - enrollment summaries,
  - dropout charts,
  - promotion charts,
  - cohort survival charts,
  - resource inventory charts,
  - textbook inventory charts,
  - gender and level breakdown cards.
- Some overview data is still presented as sample values for key metrics.

---

## 13. School Year UI

### School Year page
- `src/pages/SchoolYear/SchoolYearPage.jsx` renders school year management UI.
- Components include:
  - `SchoolYearHeader`,
  - `ActiveSchoolYearCard`,
  - `ScheduledSchoolYearCard`,
  - `TransitionReadinessCard`,
  - `PreviousSchoolYearsTable`,
  - `ScheduleSchoolYearDialog`.
- The page currently expects props for active and scheduled year data rather than fetching state internally.

---

## 14. Backend Integration

### Server APIs
- Express server in `server/index.js`.
- Uses Supabase admin credentials from environment variables.
- Enables secure user create/delete operations.

### Email onboarding
- Sends new-user welcome emails via Brevo.
- Includes temporary password and login URL.
- Requires `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `SITE_URL`.

---

## 15. Storage and File Handling

### Buckets
- `repository-files` for general attachments.
- `excel-files` for structured or Excel uploads.

### Download flow
- Downloads use Supabase Storage and browser blob links.
- Bucket selection is based on `files.data_category`.
- Download operations are audit-logged.

---

## 16. Summary of Active Features

The current OneData app supports:
- authenticated access and role-based route protection,
- realtime user profile sync,
- repository browsing by division and section,
- section-level file lists with search, filter, sort, and preview,
- file download, delete, verify/unverify,
- file-level access requests and approval workflows,
- division-level restricted access requests,
- upload page with drag/drop, folder selection, and upload progress,
- structured Excel import into enrollment, classrooms, seats, teachers, textbooks, and CESPES tables,
- user administration with create/edit/activate/deactivate/delete,
- audit logging with realtime feed and export,
- dashboard analytics with Supabase-backed metrics,
- school year management UI scaffolding.


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
