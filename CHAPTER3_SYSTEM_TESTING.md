# Chapter 3 - System Testing (Manual Functional Testing)

> OneData - Centralized Education Data Management & Analytics Platform for DepEd Schools Division of City of Baliwag
> Testing Approach: Manual Black-Box Functional Testing - Highlights Only

Use the paragraph below directly in Chapter 3 Methodology:

> System testing was conducted through manual black-box functional testing focusing on highlight functionalities directly related to the study objectives, as advised. Each test case defines the objective, preconditions, step-by-step procedure, and expected result. Actual results and remarks were recorded during test execution to determine Passed or Failed status.

---

## 1. Features Included (Highlights Related to the Study)

| # | Module | Functionalities Covered | Related To Study |
|---|--------|-------------------------|------------------|
| 1 | Authentication & Role-Based Access Control | Login per role, protected routes, restricted repository access | 4 roles: administrator, division_focal, section_focal, section_personnel |
| 2 | Upload Files + Validation | General upload, structured Excel upload, file type/size/template validation | Core data intake |
| 3 | Structured Ingestion to Dashboard | Enrollment, inventory, CESPES, performance indicators reflected in Dashboard by School Year | Main research contribution |
| 4 | Repository Workflow | Browse Division > Section > Files, search, filter, preview, download | Centralized repository objective |
| 5 | File Verification & Verified PDF | Verify/unverify, verified PDF stamp with verifier name and date | Data governance / approval |
| 6 | Access Request & Notifications | File and division access request, approve/deny/revoke, realtime notification | Cross-office sharing workflow |
| 7 | User Management | Create user with email, deactivate/activate, role/division/section assignment | Admin control |
| 8 | Audit Logs & School Year | Audit trail recording, school year schedule/activate/archive | Accountability and school-year filtering |

Out of scope for Chapter 3 (declare as Limitations, do not test):
Landing page content, Settings password/email change, idle timeout, grid/list view preference, bulk move/restore, AIP/QBEDP ingestion, full-text content search, mobile PWA, dashboard PDF/Excel export, automated backup/versioning.

---

## 2. Table Structure for the Paper

Copy this header for all Chapter 3 test tables:

| Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status / Remarks |
|---------|--------|-----------|---------------|------------|-----------------|---------------|------------------|
| | | | | | | *To be filled during testing* | *Passed / Failed* |

Legend:
* Test ID format: TC-01, TC-02, ...
* Status: Passed = Actual matches Expected. Failed = with remark / bug note.
* Tester: _______________ Date: _______________ Role accounts used: Admin / Division Focal / Section Focal / Personnel

Summary table for Chapter 3 overview (fill after execution):

| Test ID | Module / Functionality | Expected Result (Summary) | Status |
|---------|------------------------|---------------------------|--------|
| TC-01 - TC-15 | See details below | | |

---

## 3. Detailed Test Cases for Execution

### Module 1: Authentication & Role-Based Access Control

| Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status / Remarks |
|---------|--------|-----------|---------------|------------|-----------------|---------------|------------------|
| TC-01 | Authentication | Verify valid login per role | Accounts exist for each of 4 roles, active status | 1. Go to /login 2. Enter email + password 3. Click Login 4. Repeat for administrator, division_focal, section_focal, section_personnel | Each role logs in successfully and lands on correct panel (Admin/Division/Section/Personnel Panel) | | |
| TC-02 | Access Control | Verify restricted pages are blocked for non-admin | Logged in as section_personnel | 1. Manually navigate to /manage-user 2. Navigate to /audit-logs 3. Navigate to /school-year | User is blocked/redirected to restricted-access page, admin-only content not displayed | | |
| TC-03 | Repository Access | Verify cross-division access requires approval | Personnel assigned to Section A, no grant to Division B | 1. Open Repository 2. Click Division B / Section in Division B | Access shows locked or blocked view with option to Request Access, files not fully accessible | | |

### Module 2: Upload Files + Validation

| Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status / Remarks |
|---------|--------|-----------|---------------|------------|-----------------|---------------|------------------|
| TC-04 | Upload - General | Verify general file upload | Logged in with upload rights, test PDF/DOCX/PNG <50MB ready | 1. Go to Upload Files 2. Select General type 3. Select assigned section/folder 4. Upload file 5. Check Repository section folder | File uploads with progress and success status, appears in correct section folder with metadata | | |
| TC-05 | Upload - Structured | Verify structured Excel ingestion | Valid enrollment template ready, assigned section, known school year | 1. Go to Upload Files 2. Select Enrollment type + School Year 3. Upload valid enrollment Excel 4. Check Upload history | File is parsed and stored, no Invalid template error, record inserted in files table with is_dashboard_source, dashboard data updated | | |
| TC-06 | Upload - Validation | Verify invalid files are rejected | Invalid Excel (wrong headers), oversized >50MB file, unsupported .exe file ready | 1. Attempt upload of invalid template 2. Attempt oversized file 3. Attempt unsupported format | Each is rejected with clear error message e.g. Invalid Enrollment template, size limit, unsupported format. No dashboard corruption. | | |

### Module 3: Structured Ingestion to Dashboard Analytics

| Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status / Remarks |
|---------|--------|-----------|---------------|------------|-----------------|---------------|------------------|
| TC-07 | Dashboard - Enrollment | Verify enrollment upload reflects in dashboard | TC-05 completed, dashboard accessible | 1. Go to /dashboard 2. Select same School Year as upload 3. Check Total Enrollment, Gender, By-Level charts | Totals and charts reflect uploaded enrollment data, year filter changes values correctly | | |
| TC-08 | Dashboard - Inventory / CESPES / KPI | Verify other structured data displays | Uploaded teachers_inventory or classrooms or CESPES or performance_indicators file | 1. Upload structured file for category 2. Go to Dashboard corresponding section 3. Select correct School Year | Corresponding section (Resources / CESPES tabs / Performance rates) shows uploaded data, not empty. Note Template view badge only when no data. | | |

### Module 4: Repository Workflow

| Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status / Remarks |
|---------|--------|-----------|---------------|------------|-----------------|---------------|------------------|
| TC-09 | Repository | Verify browse, search, filter, preview, download | Files exist in assigned division/section | 1. Open Repository 2. Open division then section 3. Search by filename/uploader 4. Switch file-type tabs All/PDF/Excel/Word 5. Preview file 6. Download file | Correct files listed, search filters correctly, preview loads, download succeeds for permitted files | | |

### Module 5: File Verification & Verified PDF

| Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status / Remarks |
|---------|--------|-----------|---------------|------------|-----------------|---------------|------------------|
| TC-10 | Verification | Verify focal/admin can verify and generate stamped PDF | Unverified Excel/PDF file in own scope, logged in as division_focal or section_focal or admin | 1. Open file in Repository 2. Click Verify / Confirm 3. Download Verified PDF | Status changes Unverified to Verified with verifier name/time, verified PDF downloads with stamp on every page | | |
| TC-11 | Verification - Negative | Verify personnel cannot verify | Same file, logged in as section_personnel | 1. Open file 2. Look for Verify action | Verify action is hidden or disabled for personnel | | |

### Module 6: Access Request & Notifications

| Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status / Remarks |
|---------|--------|-----------|---------------|------------|-----------------|---------------|------------------|
| TC-12 | Access Request | Verify request-approve-notify workflow | Requester without access, approver with rights (focal/admin) | 1. As requester, submit division/file access request with message 2. As approver, approve request 3. As requester, check notifications panel 4. Repeat deny/revoke once | Request appears to approver, approval/denial updates status, requester receives realtime in-app notification without refresh | | |

### Module 7: User Management (Administrator)

| Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status / Remarks |
|---------|--------|-----------|---------------|------------|-----------------|---------------|------------------|
| TC-13 | Manage Users | Verify create and deactivate user | Logged in as administrator | 1. Go to Manage Users 2. Add New User with email/name/ID/role/division/section 3. Check new user must-change-password on first login 4. Deactivate user 5. Try login as deactivated user | User created and appears in list, onboarding email sent, first login forces password change, deactivated user cannot log in | | |

### Module 8: Audit Logs & School Year (Administrator)

| Test ID | Module | Objective | Preconditions | Test Steps | Expected Result | Actual Result | Status / Remarks |
|---------|--------|-----------|---------------|------------|-----------------|---------------|------------------|
| TC-14 | Audit Logs | Verify critical actions are logged | Upload/verify/delete performed recently | 1. Go to Audit Logs as admin 2. Search by filename 3. Filter by action Upload/Verify/Delete | Matching audit record found with action, file name, performer, role, timestamp, success status | | |
| TC-15 | School Year | Verify school year lifecycle affects upload/dashboard | Logged in as administrator | 1. Go to School Year 2. View Active year 3. Schedule new year / Reopen archived (or show scheduled list) 4. Check Upload Files year dropdown and Dashboard year selector | Active/scheduled/archived years displayed correctly, new year appears in upload and dashboard filters | | |

---

## 4. How to Fill During Testing

1. Execute TC-01 to TC-15 in order using real accounts for each role.
2. Screenshot each Expected vs Actual for appendix (login, upload success, dashboard before/after, verified stamp, notification, audit log).
3. Mark Passed only if Actual exactly matches Expected. Otherwise mark Failed with bug remark.
4. For Chapter 3 narrative, summarize: Total test cases: 15, Passed: __, Failed: __, covering 8 highlight modules.
5. Do not include failing template-fallback or unimplemented AIP/QBEDP cases - those are Limitations, not test failures.

## 5. Suggested Chapter 3 Test Environment Section

> Test Environment: Web application accessed via desktop browser (Chrome/Edge), connected to Supabase cloud backend. Test accounts: 1 administrator, 1 division focal, 1 section focal, 1 section personnel. Test data: sample general files (PDF, Word, image) and structured enrollment Excel template for S.Y. ____.
