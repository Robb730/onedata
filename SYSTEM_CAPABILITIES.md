# OneData System Capabilities

This document describes the functionality currently implemented in the active OneData application. It is organized by role first, followed by shared workflows, public pages, backend services, and known limitations.

## 1. Roles and access model

OneData recognizes these roles:

- `administrator`
- `division_focal`
- `section_focal`
- `section_personnel`

Repository access is evaluated at two levels:

- `full`: the user can use the actions allowed for their role in that scope.
- `locked`: the user can enter a granted foreign division or section, but access is limited to the locked-file workflow.
- `blocked`: the user is redirected to the restricted-access page.

Administrators have global repository access. Division focals have full access in their assigned division. Section focals and section personnel have full access in their assigned section. Non-administrator users may request approved access to another division; that grant opens the foreign repository in locked mode and does not grant ownership-level management rights.

## 2. Administrator capabilities

### Account and user administration

Administrators can:

- View all users.
- Search users by name, email, role, division, section, and ID-related fields.
- Filter users by division, role, and active/inactive status.
- Switch between list and grid views.
- View organizational hierarchy and user profile cards.
- Create users with an email, full name, ID number, role, division, and section.
- Assign any supported role.
- Generate a temporary password and mark the new account as requiring a password change.
- Send onboarding credentials through the configured Brevo email integration.
- Edit a user's name, ID number, role, division, and section.
- Activate or deactivate accounts.
- Delete a user from the application `users` table and Supabase Auth.
- View a user's audit history.

### Repository and file administration

Administrators can:

- Browse every division and section.
- Open any division or section folder.
- View file metadata, uploader details, previews, and feedback.
- Search files by file name or uploader.
- Filter files by type: all, PDF, Excel, Word, and image.
- Sort files by date, name, or size.
- Use list or grid view and paginate results with configurable page sizes.
- Download individual files or selected files in bulk.
- Download raw files from the appropriate storage bucket.
- Download generated verified PDFs when available.
- Edit supported Excel files in the file editor.
- Delete individual files or selected files in bulk.
- Verify or unverify files individually or in bulk.
- View verifier name, verification time, and generated stamped-PDF metadata.
- View and respond to file feedback threads.
- Approve, deny, or revoke file-level access requests.
- Approve, deny, or revoke division-level access requests.
- Create sections.
- Approve or decline section-deletion requests.
- Permanently delete a section and its files after password reauthentication.

### Template administration

Administrators can:

- Open the standalone Templates page.
- View all templates grouped by division and section.
- Search templates.
- Upload Excel templates.
- Assign templates to sections.
- Rename templates.
- Reassign templates.
- Replace template files.
- Download templates through one-hour signed URLs.
- Delete templates.
- View templates from any section's repository view.

### Audit and security administration

Administrators can:

- View the latest loaded audit-log records, currently queried in batches of up to 200 rows.
- Search audit logs.
- Filter logs by action, status, and date range.
- Paginate audit results.
- View action counts for uploads, downloads, verification, deletion, and other recorded events.
- Export the current audit result through a print-friendly browser window.
- Review security-alert rows.
- Mark security alerts as reviewed.
- Deactivate the account associated with a security alert.

### School-year administration

Administrators can:

- View the active school year and its file count.
- View a scheduled upcoming school year, activation date, countdown, and reminders.
- Schedule a new school year.
- Edit a scheduled school-year label and activation date.
- Cancel a scheduled transition.
- Force a school-year transition through the configured Supabase RPC.
- Reopen an archived school year through RPC.
- Close a reopened school year through RPC.
- View archived and reopened school years with file counts.

## 3. Division focal capabilities

### Own division

Division focals can:

- Open their assigned division and all sections inside it.
- View, preview, search, sort, filter, and paginate files in their division.
- Download raw files, verified PDFs, and selected files in bulk.
- Edit supported Excel files.
- Delete files in their division, including bulk deletion where permitted.
- Verify or unverify files individually or in bulk.
- View uploader information, verification metadata, and feedback threads.
- View and respond to file feedback for their division.
- Upload general and structured files into a selected folder in their division.
- Create sections in their own division.
- Submit section-deletion requests in their own division.
- Review file-access requests for their division, narrowed to the relevant section where applicable.
- Approve, deny, or revoke file-level requests within their scope.
- Review, approve, deny, or revoke division-access requests for their own division.
- View assigned templates for sections in their division.
- Upload, assign, rename, reassign, replace, download, and delete templates for their division.

### Other divisions

Division focals can request access to another division. When approved, they can:

- Open that division and its sections.
- View files in locked mode.
- Use the applicable file-view and download/request workflow.

An approved foreign-division grant does not provide edit, delete, verification, section-management, feedback-management, or template-management rights. Foreign-division template controls are hidden by scope checks.

### Areas not available to division focals

Division focals cannot access Manage Users, Audit Logs, or School Year. They cannot create or delete sections outside their assigned division or approve requests belonging to another division.

## 4. Section focal capabilities

### Own section

Section focals can:

- Open their assigned section automatically during upload.
- View, preview, search, sort, filter, and paginate files in their section.
- Download raw files, verified PDFs, and selected files in bulk.
- Edit supported Excel files.
- Delete files in their section where the file action is permitted.
- Verify or unverify files individually or in bulk.
- View uploader information, verification metadata, and feedback threads.
- Upload general and structured files to their assigned section.
- Submit file-level access requests with a message and, where supported, a deadline.
- View and respond to file feedback in their section.
- Review, approve, deny, and revoke file-access requests for their own section.
- View templates assigned to their section through the repository template view.

### Other divisions or sections

Section focals can request access to another division. After approval, they can open the granted area in locked mode and view or download files according to the request workflow. They cannot use that grant to verify, edit, delete, manage templates, manage sections, or approve requests outside their owned scope.

### Areas not available to section focals

Section focals cannot access Manage Users, Audit Logs, School Year, or standalone Templates management. They cannot create or delete sections or approve division-level access requests.

## 5. Section personnel capabilities

### Own section

Section personnel can:

- Open their assigned section automatically during upload.
- Upload general and structured files to their assigned section.
- View and preview files in their section.
- Search, sort, filter, and paginate the file list.
- Download raw files, verified PDFs, and selected files in bulk when allowed.
- Edit supported Excel files.
- Delete files they personally uploaded.
- View uploader information, verification metadata, and feedback threads in their section.
- Submit file-level access requests with a message and, where supported, a deadline.
- View and respond to feedback for their own section.
- View templates assigned to their section through the repository template view.

### Other divisions or sections

Section personnel can request access to another division. After approval, they can open the granted area in locked mode and view or download permitted files. The grant does not provide edit, delete, verification, feedback management, template management, or section-management rights.

### Areas not available to section personnel

Section personnel cannot verify or unverify files, delete files uploaded by teammates, approve or deny file-access requests, create or delete sections, manage templates, or access Manage Users, Audit Logs, or School Year.

## 6. Capabilities shared by authenticated users

All four roles can:

- Sign in through Supabase Auth.
- Access Dashboard, Repository, Upload Files, and Settings.
- View their name, email, role, organization scope, ID number, and last-login information where available.
- Use the responsive desktop and mobile navigation.
- Receive realtime profile updates when their user record changes.
- Open the notifications panel.
- Receive notifications for uploads, verification, unverification, deletion, file-access requests, approved/denied/revoked file access, division-access requests, and approved/denied division access.
- Mark one notification or all notifications as read.
- Delete one notification or clear all notifications.
- Receive new notifications in realtime.
- Sign out.
- Request a password-reset email.
- Change their password from the password-change flow.
- Request an email-address change after current-password reauthentication.
- Receive an inactivity warning after 25 minutes.
- Be signed out after 30 minutes of inactivity.

## 7. Upload and structured-data functionality

Authenticated users can upload files subject to role scope and folder assignment rules.

### File intake

- Drag-and-drop upload.
- File-browser upload.
- Folder selection for administrators and division focals.
- Automatic assignment to the user's section for section focals and personnel.
- Upload progress and per-file status display.
- Maximum file size of 50 MB.
- Extension validation for Excel, PDF, Word, PowerPoint, image, CSV, text, ZIP, and RAR files.
- Storage upload followed by a `files` metadata record.
- Cleanup of storage or database records if later processing fails.
- Upload audit logs and scoped upload notifications.
- Recent-upload history on the Upload Files page.

### Structured upload categories

The upload flow references these categories:

- `general`
- `enrollment`
- `classrooms`
- `seats`
- `teachers_inventory`
- `textbook_inventory`
- `cespes`
- `performance_indicators`
- `aip_school`
- `aip_sdo`
- `qbedp`
- `accomplishment_report`

Structured files are parsed from one or more sheets and inserted in chunks into the corresponding domain tables. Implemented parsing/sync paths cover enrollment, classrooms, seats, teacher inventory, textbook inventory, CESPES, and performance-indicator data. A replacement upload can remove previously parsed rows associated with the file before inserting the new rows.

## 8. Dashboard and analytics

All authenticated roles currently receive the same dashboard presentation and queries. The dashboard can:

- Select a school year.
- Show current-year enrollment totals.
- Show public/private enrollment breakdowns.
- Show gender and education-level breakdowns.
- Show enrollment trends and compare years.
- Show dropout rates by level.
- Show promotion rates by level.
- Show cohort-related charts.
- Show teacher inventory versus needs.
- Show classroom inventory versus needs.
- Show seat inventory versus needs.
- Show textbook shortages.
- Show CESPES operations, support operations, general administration, individual performance, and innovation views.
- Calculate and display performance-indicator/KPI data.
- Show scheduled school-year transition status.

## 9. Repository workflow details

The active repository implementation supports:

- Division and section browsing.
- Search by file name or uploader.
- File-type tabs for all, PDF, Excel, Word, and image files.
- List and grid layouts.
- Pagination and page-size selection.
- File metadata, uploader detail popovers, hover previews, and modified-date details.
- Single and bulk downloads.
- Single and bulk deletion where role and ownership allow it.
- Raw downloads from `repository-files` for general files and `excel-files` for structured files.
- Verified PDF downloads from the `verified-pdfs` bucket when a stamped file exists.
- Excel editing through ExcelJS with a SheetJS fallback writer.
- Realtime feedback updates and unread-feedback indicators.
- Restricted-access pages for blocked users.

## 10. Public and unauthenticated pages

Unauthenticated visitors can:

- View the landing page at `/`.
- View the login page at `/login`.
- Use the password-change/recovery page at `/change-password` when following the recovery flow.
- Open the experimental Excel extractor at `/test`.
- Receive the Not Found page for unknown routes.

The landing-page analytics preview uses hard-coded demonstration values. The `/test` Excel extractor is publicly routed and is not protected by the application route guard.

## 11. Backend and Supabase integrations

### Express server

The separate Express server exposes:

- `POST /api/create-user`: creates a Supabase Auth user, inserts a `users` record, and sends onboarding email through Brevo.
- `POST /api/delete-user`: deletes a `users` record and the matching Supabase Auth account.

### Supabase Edge Functions

Function implementations exist for:

- `create-user`
- `delete-user`
- `send-password-reset`
- `send-change-email`
- `generate-verified-pdf`

The local Supabase configuration explicitly registers `generate-verified-pdf`, `send-password-reset`, and `send-change-email`.

### Storage buckets

- `repository-files`: general repository attachments.
- `excel-files`: structured or Excel uploads.
- `verified-pdfs`: generated verified/stamped PDF files.

## 12. Audit events and data records

The system records audit information for events including uploads, upload failures, downloads, verification, unverification, deletion, user administration, and access-request actions. Records can include the action, file name, details, performer, role, timestamp, and status.

File metadata can include:

- File name, path, size, and MIME type.
- Data category and school year.
- Section and division assignment.
- Uploader ID and display name.
- Verification status.
- Dashboard-source flag.
- Verifier name, verification time, and verified-PDF path.

## 13. Known limitations and deployment dependencies

- Dashboard queries are not filtered by role, division, or section in the frontend. Users currently receive global dashboard data if the source tables return it.
- Enrollment trends fall back to hard-coded sample data when live rows are unavailable.
- Several dashboard panels show empty, zero, or template states when source tables have no data.
- The local `supabase_schema.sql` is incomplete compared with the tables used by the application. It defines only part of the structured-data schema; other tables, buckets, RPCs, relationships, and RLS policies are expected in the linked Supabase project.
- The Express create-user and delete-user endpoints do not visibly authenticate the caller or enforce administrator authorization. The Edge Function create/delete handlers also use the service-role key without visible administrator validation. Deployment gateways, policies, or surrounding infrastructure must provide that protection.
- The School Year page is wired to management components and RPC calls, but its active/scheduled/archived state depends on the deployed Supabase schema and data.
- Some structured upload categories are referenced by the UI but have less complete local schema or parser coverage than enrollment, inventory, CESPES, and performance indicators.
- Section access for section-scoped users depends on a valid `section_id`. Missing or invalid assignment can result in locked or blocked access.
- Division manager discovery assumes division-level users may be identified by `section_id` equal to `0`, `"0"`, or `null`.
- Legacy files under `src/old-repository-flow` contain mock repository flows and are not active routes.

## 14. Primary implementation locations

- `src/App.jsx`: routes, authentication wiring, idle timeout, and role-protected pages.
- `src/contexts/UserContext.jsx`: authenticated profile loading and realtime profile refresh.
- `src/utils/accessControl.js`: roles, division access, section access levels, and template visibility.
- `src/pages/Repository/`: active repository, division, folder, and restricted-access pages.
- `src/components/RepositoryComponents/`: file actions, access requests, feedback, previews, and editing UI.
- `src/pages/UploadFiles/` and `src/utils/structuredDataSync.js`: uploads and structured-data ingestion.
- `src/pages/Dashboard/` and `src/components/DashboardComponents/`: analytics views and KPI calculations.
- `src/pages/ManageUsers/`: user administration.
- `src/pages/AuditLogs/`: audit history, filtering, security alerts, and export.
- `src/pages/SchoolYear/`: school-year management UI.
- `src/pages/Templates/` and `src/utils/templatesApi.js`: template management.
- `src/hooks/useNotifications.js` and `src/utils/notifications.js`: notification retrieval, delivery, and actions.
- `server/index.js`: Express user lifecycle endpoints and Brevo onboarding email.
- `supabase/functions/`: Edge Functions for user lifecycle, email flows, and verified PDF generation.
