# Notification Push Guidance

This document maps the exact code locations where notification data should be pushed into the `notifications` table, and defines the recipient logic for section uploads and access requests.

## 1. Upload notifications

### File
- `src/pages/UploadFiles/UploadFilesPage.jsx`

### Where to push
- After successful insertion of the uploaded file metadata into the `files` table in `addToUploads()`.
- Preferably after the insert returns `fileRow` and before final success handling.

### Who should receive it
- If the upload target is a section folder (`sectionId` is present):
  - All users assigned to that section (`users.section_id = sectionId`), including:
    - `section_focal`
    - `section_personnel`
  - Plus the division focal persons for the section's division (`users.role = 'division_focal'` and `users.division_id = divisionId`).

### Suggested notification types
- `upload`
- `file_uploaded`

### Suggested payload fields
- `recipient_id`
- `type`
- `title`
- `content`
- `is_read: false`
- `created_at` (if not auto-populated)
- Optional: `related_file_id`, `section_id`, `division_id`, `uploaded_by`

## 2. File access request notifications

### File
- `src/pages/Repository/RepositoryFolderDetailPage.jsx`

### Where to push
- Immediately after a successful insert into `file_access_request`:
  - `await supabase.from("file_access_request").insert(rows);`

### Who should receive it
- For requests from a user for files in a section:
  - Section focal person(s) for that section (`role = 'section_focal'` and `section_id = section.id`).
  - Division focal persons for the section's division (`role = 'division_focal'` and `division_id = section.division_id`).

### Additional optional user notification
- Optionally send a confirmation notification to the requesting user (`recipient_id = userProfile.id`) that their file access request was submitted.

### Suggested notification types
- `file_access_request`
- `access_request`

## 3. Division folder access request notifications

### Files
- `src/pages/Repository/AccessRestrictedPage.jsx`
- `src/utils/divisionAccessRequestsApi.js`

### Where to push
- After `createDivisionAccessRequest()` successfully completes in `AccessRestrictedPage.jsx`.
- If using the API util, add notification insertion inside `createDivisionAccessRequest()` after the upsert succeeds.

### Who should receive it
- Division focal person(s) for the target division (`role = 'division_focal'` and `division_id = divisionId`).
- Optionally also notify `admin` users if the workflow should let them see all division requests.

### Additional optional user notification
- Optionally notify the requester that the division access request has been created.

### Suggested notification type
- `division_access_request`

## 4. Verify / Unverify notifications

### Files
- `src/pages/Repository/RepositoryFolderDetailPage.jsx`

### Where to push
- After the file status update in `confirmVerify()` once Supabase has updated the `files` row.
- After verified PDF generation is handled (for `Verify`) or after the status is cleared (for `Unverify`).

### Who should receive it
- All users in the same section (`users.section_id = section.id`) who have access to this file, including:
  - `section_focal`
  - `section_personnel`
- Division focal persons for the section's division (`users.role = 'division_focal'` and `users.division_id = section.division_id`).
- Optionally notify the original uploader if they are not already in that group.

### Suggested notification types
- `file_verified`
- `file_unverified`

## 5. Delete notifications

### Files
- `src/pages/Repository/RepositoryFolderDetailPage.jsx`

### Where to push
- After the file delete action completes successfully in the `confirmDelete()` flow.

### Who should receive it
- Section users with access to the deleted file:
  - `section_focal`
  - `section_personnel`
- Division focal persons for the relevant division.
- The user who uploaded the file (`uploaded_by`) should also receive a deletion notice when possible.

### Suggested notification types
- `file_deleted`
- `file_removed`

## 6. Request resolution notifications

### Files
- `src/utils/accessRequestsApi.js`
- `src/utils/divisionAccessRequestsApi.js`

### Where to push
- After the status update in:
  - `approveRequest()` / `denyRequest()` / `revokeAccess()` for file access requests.
  - `approveDivisionRequest()` / `denyDivisionRequest()` / `revokeDivisionAccess()` for division access requests.

### Who should receive it
- The requester who submitted the access request (`requested_by`).
- Optionally, if a file request is approved, notify users in the file's section and division focal persons.

### Suggested notification types
- `access_request_approved`
- `access_request_denied`
- `access_request_revoked`
- `division_access_request_approved`
- `division_access_request_denied`
- `division_access_request_revoked`

## 7. Role-based visibility rules

### Section upload notifications
- Only users assigned to the relevant section should receive section upload notifications.
- Additionally, include the division focal person(s) who manage that section.
- Do not broadcast to users outside the section or outside the division.

### File access request notifications
- Send approver notifications only to the users who can act on the request:
  - `section_focal` within the section
  - `division_focal` within the division
- The requester may optionally also get an acknowledgment notification.

### Division folder access requests
- Send to `division_focal` role users scoped to the requested division.
- Optionally `admin` if global oversight is desired.

## 5. Recommended implementation approach

- Create a small helper utility such as `pushNotification({ recipientIds, type, title, content, meta })`.
- Use that helper in the three places above.
- Keep the notification insert separate from audit logging.
- Preserve the existing `useNotifications` hook behavior, which currently fetches notifications for `recipient_id = userProfile.id`.

## 6. Notes

- The current notification UI is in:
  - `src/components/TopHeader.jsx`
  - `src/components/NotificationsPanel.jsx`
  - `src/hooks/useNotifications.js`
- The notification push logic should respect section/division scoping and only write rows for intended recipients.
- Do not change code until the notification schema and helper utility are in place.
