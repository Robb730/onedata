# Missing Audit Log Actions

## User management
- `src/pages/ManageUsers/ManageUsers.jsx`
  - `handleDeactivateUser` — user deactivation has no audit log.
  - `handleActivateUser` — user activation has no audit log.
- `server/index.js`
  - `POST /api/create-user` — user creation via server endpoint has no audit log.
  - `POST /api/delete-user` — user deletion via server endpoint has no audit log.

## Access requests
- `src/pages/Repository/AccessRestrictedPage.jsx` / `src/utils/divisionAccessRequestsApi.js`
  - `handleSubmitRequest` / `createDivisionAccessRequest` — division access request creation has no audit log.
- `src/components/RepositoryComponents/DivisionAccessRequestsSidebar.jsx` / `src/utils/divisionAccessRequestsApi.js`
  - `approveDivisionRequest` — approving a division access request has no audit log.
  - `denyDivisionRequest` — denying a division access request has no audit log.
  - `revokeDivisionAccess` — revoking a division access request has no audit log.

## School year management
- `src/pages/SchoolYear/SchoolYearPage.jsx` / `src/utils/schoolYearsApi.js`
  - `handleCreate` / `scheduleSchoolYear` — scheduling a new school year has no audit log.
  - `handleEditSubmit` / `updateScheduledSchoolYear` — editing a scheduled school year has no audit log.
  - `handleCancelTransition` / `cancelScheduledTransition` — cancelling a scheduled school year transition has no audit log.
  - `handleForceTransition` / `forceSchoolYearTransition` — forcing a school year transition has no audit log.
  - `handleReopen` / `reopenSchoolYear` — reopening an archived school year has no audit log.
  - `handleClose` / `closeReopenedSchoolYear` — closing a reopened school year has no audit log.
