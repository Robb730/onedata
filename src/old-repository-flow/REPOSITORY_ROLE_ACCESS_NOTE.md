# Repository Page and Role-Based Access Note

This note explains how the repository page works, which files are connected to it, and how role-based access is enforced in the current frontend.

## Main Flow

1. `src/Pages/loginPage.jsx` authenticates the user and stores two values in `localStorage`:
   - `role`
   - `userSection`
2. `src/App.jsx` routes `/repository` to `src/Pages/adminPage.jsx`.
3. `src/Pages/adminPage.jsx` reads the stored role/section and decides which view to render.
4. `src/Pages/Repository.jsx` shows the top-level repository folders and decides whether each folder is open or restricted.
5. If a folder is open, `adminPage.jsx` sends the user to `FolderDetail.jsx` or to the section list view.
6. If a folder is restricted, `adminPage.jsx` sends the user to `AccessRestricted.jsx`.

## Files Connected To The Repository Page

### Core files

- `src/Pages/Repository.jsx`
  - Renders the folder cards.
  - Tracks search, tabs, and grid/list view state.
  - Applies folder-level role checks through `allowedRoles`.
  - Calls `onFolderClick` for allowed folders.
  - Calls `onLockedFolderClick` for restricted folders.

- `src/Pages/adminPage.jsx`
  - Owns the repository navigation state.
  - Passes the current role into `Repository.jsx`.
  - Decides whether a folder opens the section grid, folder detail, or restricted access page.
  - Provides the back-navigation and breadcrumb behavior.

- `src/Pages/FolderDetail.jsx`
  - Handles file-level permissions inside a section.
  - Controls download/view/verify/delete/request behavior.
  - Opens the file request and access-request modals.

- `src/Pages/AccessRestricted.jsx`
  - Displays the restricted-folder message.
  - Lets the user request access or go back to the repository.

- `src/Pages/loginPage.jsx`
  - Sets the current role and section that drive the repository permissions.

- `src/App.jsx`
  - Registers the `/repository` route used by the repository shell.

### Connected UI components

- `src/components/FileAccessModal.jsx`
  - Used when a user tries to view or download a file they do not have access to.
  - Sends the request to the target section focal officer.

- `src/components/RequestFilesModal.tsx`
  - Used by FolderDetail for requesting files from a section.

- `src/components/ViewFileRequestsModal.tsx`
  - Used by FolderDetail to review submitted file requests.

- `src/components/Sidebar.jsx`
  - Exists as a separate sidebar component, but it is not imported in the repository flow shown here.

### Related repository-linked pages

- `src/Pages/SchoolGovernance.jsx`
- `src/Pages/PlanningResearch.jsx`

These pages contain folder-style navigation and links into repository content, but the current route table in `src/App.jsx` only shows `/repository` mapped to `AdminPage`.

## How The Repository Access Check Works

`src/Pages/Repository.jsx` defines each top-level folder with an `allowedRoles` array:

- Curriculum Implementation Division: `admin` only
- Office of the Schools Division Superintendent: `admin` only
- School Governance and Operations Division: `admin`, `division`, `sectionFocal`, `personnel`

For each folder card:

- `isLocked = !folder.allowedRoles.includes(role)`
- Locked folders show a restricted badge and a lock icon.
- Clicking a locked folder calls `onLockedFolderClick(folder)`.
- Clicking an unlocked folder calls `onFolderClick(folder)`.

## What AdminPage Does With Those Clicks

`src/Pages/adminPage.jsx` handles both outcomes:

- `handleFolderClick(folder)`
  - If the folder has subfolders, it opens the subfolder grid.
  - Otherwise it opens `FolderDetail.jsx`.
- `handleLockedFolderClick(folder)`
  - Opens `AccessRestricted.jsx` for the selected folder.

So the repository page itself only decides whether a folder is allowed or locked. The parent page decides which screen comes next.

## Folder-Level Permissions In FolderDetail

Inside `src/Pages/FolderDetail.jsx`, the permissions are more granular:

- `canVerify(role)`
  - `admin` and `division` can verify files.
- `canAccessFiles(role, currentUserSection, folderName)`
  - `admin` and `division` can access all files.
  - `sectionFocal` and `personnel` can access files only when `currentUserSection === folderName`.
- `canDirectDelete(role)`
  - `admin` and `division` can delete directly.

This means the repository page controls folder entry, but `FolderDetail.jsx` controls file actions inside the folder.

## Role Behavior Summary

- `admin`
  - Full access to repository folders.
  - Full access to folder actions.
  - Can manage users and audit logs from the admin shell.

- `division`
  - Can open SGOD folders and subfolders.
  - Can verify files and manage folder-level requests.
  - Sees restricted top-level folders through `AccessRestricted.jsx`.

- `sectionFocal`
  - Can open SGOD and their own section.
  - Can access files only in their own section.
  - Can review access requests in their own section.

- `personnel`
  - Can see the repository.
  - Can only access files in their assigned section.
  - Restricted folder actions open the file access modal.

## Practical Reading Order

If you want to understand the full repository flow, read these files in this order:

1. `src/Pages/loginPage.jsx`
2. `src/App.jsx`
3. `src/Pages/adminPage.jsx`
4. `src/Pages/Repository.jsx`
5. `src/Pages/AccessRestricted.jsx`
6. `src/Pages/FolderDetail.jsx`
7. `src/components/FileAccessModal.jsx`
8. `src/components/RequestFilesModal.tsx`
9. `src/components/ViewFileRequestsModal.tsx`
