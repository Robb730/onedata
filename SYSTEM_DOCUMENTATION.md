# OneData System Documentation

**Project**: OneData  
**Purpose**: Comprehensive Education Data Management & Analytics Platform for the Department of Education - City of Baliwag  
**Last Updated**: July 2026

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Core Features & Pages](#core-features--pages)
4. [Database Architecture](#database-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [Component Architecture](#component-architecture)
7. [Key Features Breakdown](#key-features-breakdown)
8. [Current Implementation Status](#current-implementation-status)
9. [Integration Services](#integration-services)
10. [Project Structure](#project-structure)

---

## System Overview

### What is OneData?

OneData is a comprehensive education management platform designed specifically for the **Department of Education - Schools Division of City of Baliwag**. It serves as a centralized system for:

- **Educational Data Management**: Track enrollment, dropout rates, promotion statistics, and academic performance
- **User Management**: Administer division and section focal officers, administrators, and personnel
- **File Repository**: Organized digital file management system with role-based access control
- **Analytics & Dashboards**: Real-time visualization of key education metrics and trends
- **Audit Logging**: Track all system activities for compliance and accountability
- **Multi-level Access Control**: Support for different organizational roles with appropriate permissions

### Target Users

- **Administrators**: Full system access, user management, all analytics
- **Division Focal Persons**: Division-level data access and management
- **Section Officers/Personnel**: Departmental file access and data uploads
- **School Principals**: Read-only access to school-specific analytics

### Mission Alignment

OneData aligns with the "BALIWAG LENYO" flagship program's five pillars:
1. **ACCESS**: Bringing learners to schools and learning centers
2. **EQUITY**: Listening to and amplifying marginalized learners' voices
3. **QUALITY**: Ensuring effective use of IT in instruction
4. **RESILIENCE & WELL-BEING**: Developing holistic 21st-century skills
5. **GOVERNANCE**: Networking with stakeholders for excellence

---

## Technology Stack

### Frontend
- **Framework**: React 19.2.5 with Vite 8.0.10
- **Routing**: React Router DOM 7.14.2
- **Styling**: Tailwind CSS 4.2.4
- **Charts & Visualization**: Recharts 3.8.1
- **Icons**: Lucide React 1.14.0
- **Utilities**: 
  - date-fns 4.1.0 (date manipulation)
  - clsx 2.1.1 (conditional CSS classes)
  - xlsx 0.18.5 (Excel parsing)

### Backend
- **Server Framework**: Express.js 5.2.1
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email Service**: Brevo API (formerly Sendinblue)
- **Environment**: Node.js with dotenv

### Development Tools
- **Build Tool**: Vite 8.0.10
- **Linting**: ESLint 10.2.1 with React plugins
- **Package Manager**: npm
- **Version Control**: Git

### Deployment
- Frontend: Built as static assets with Vite
- Backend: Express server (runs on configurable port, default 3001)
- Database: Cloud-hosted Supabase instance

---

## Core Features & Pages

### 1. **Landing Page** (`/`)
**Status**: ✅ Implemented

Public-facing homepage for the OneData platform featuring:
- **Navbar**: Navigation with branding and login link
- **Hero Section**: Main call-to-action with tagline about education data management
- **Hero Stats**: Key statistics highlighting system capabilities
- **Analytics Preview**: Showcase of dashboard capabilities
- **Footer**: Company information and links

**Components Used**: Navbar, HeroSection, HeroStats, AnalyticsPreview, Footer

---

### 2. **Authentication System** (`/login`)
**Status**: ✅ Implemented

Complete authentication flow with Supabase integration:

**Features**:
- Email/password login
- Session management
- Automatic user profile loading from database
- "Must Change Password" enforcement for new accounts
- Beautiful gradient UI with animated background elements
- Error handling and validation

**Authentication Flow**:
1. User enters email and password
2. Supabase Auth validates credentials
3. Session token is stored
4. User profile is fetched and cached in localStorage
5. User is redirected to protected routes

**Security**:
- Password change requirement on first login
- Session-based authentication with Supabase Auth
- Protected routes via ProtectedRoute component
- Automatic logout on session expiration

---

### 3. **Dashboard** (`/dashboard`)
**Status**: ✅ Implemented (Core functionality with sample data)

Comprehensive analytics dashboard displaying key education metrics and trends.

**Main Components**:

#### 3.1 Dashboard Header
- Title and description
- Quick navigation and filters
- Last updated timestamp

#### 3.2 Dashboard Overview Cards
Displays key metrics:
- **Total Enrollment**: 41,215 students
- **Overall Dropout Rate**: 1.22%
- **Elementary Promotion Rate**: 99.22%
- **JHS Dropout Rate**: 2.26%
- **Enrollment Trend**: +3.1%
- **Dropout Trend**: 0.15%
- **Promotion Trend**: 0.4%
- **JHS Dropout Trend**: 0.12%

#### 3.3 Trend Cards
Real-time trend tracking with:
- Current value display
- Percentage change indicators
- Visual icons for quick scanning
- Color-coded positive/negative indicators

#### 3.4 Data Summary Cards
- Statistical overview cards
- Metric progress bars
- Comparative analysis
- Year-over-year changes

#### 3.5 Charts & Visualizations

**Enrollment Chart** (Line Chart):
- Historical enrollment data over time
- Multi-level filtering capability
- Trend line analysis

**Dropout Chart** (Bar Chart):
- Dropout rates by grade level
- Comparison across school years
- Performance metrics

**Promotion Chart** (Stacked Bar Chart):
- Student promotion rates
- Grade-level breakdown
- Elementary vs. JHS comparison

**Cohort Chart** (Area Chart):
- Cohort survival rates over time
- Multi-year cohort tracking
- Trend visualization

**Performance Card**:
- Academic performance indicators
- Learning outcome metrics
- Progress tracking

**Resources Inventory Chart** (Horizontal Bar Chart):
- Physical resources by school/division
- Resource allocation visualization
- Utilization metrics

**Textbooks Chart** (Pie Chart):
- Textbook inventory distribution
- Subject-level breakdown
- Availability tracking

**Gender Distribution Card** (Pie Chart):
- Male/female enrollment split
- Demographic analysis
- By grade level breakdown

**Enrollment By Level** (Stacked Bar Chart):
- Elementary, JHS, SHS enrollment
- Progression analysis
- Year-over-year comparison

**Resources By Level** (Horizontal Bar Chart):
- Resource allocation by education level
- Distribution analysis
- Inventory by category

#### 3.6 Dashboard Filters
- **School Year Filter**: Select specific academic year
- **Grade Level Filter**: Filter by elementary, JHS, SHS
- **Category Filter**: Public/Private schools
- **School/Division Filter**: Specific institution filtering
- **Reset Filters**: Clear all selections

#### 3.7 Dashboard Accordion
- Collapsible sections for detailed metrics
- Expandable detail views
- Organized information hierarchy

---

### 4. **Manage Users** (`/manage-user`)
**Status**: ✅ Implemented

Complete user administration interface for managing system users.

**Features**:
- **User List Display**: Table showing all system users with details:
  - Full Name
  - ID Number
  - Email
  - Role (Division Focal Person, Section Officer, Section Personnel, Administrator)
  - Division Assignment
  - Section Assignment
  - Active/Inactive Status
  - User Avatar

- **Search Functionality**:
  - Search by name
  - Search by ID number
  - Search by division
  - Real-time filtering

- **Division Filtering**:
  - Filter by specific division
  - "All" option to view all users
  - Dynamic division list from database

- **User Actions**:

  | Action | Icon | Description |
  |--------|------|-------------|
  | **Edit User** | ✏️ Edit2 | Modify user details, role, and assignments |
  | **Delete User** | 🗑️ Trash2 | Permanently remove user from system |
  | **View Logs** | 📋 FileText | View user's activity audit trail |
  | **Deactivate User** | ⛔ UserX | Disable user account (can be reactivated) |
  | **Activate User** | ✓ UserCheck | Re-enable deactivated user account |

- **Add New User**:
  - Modal form for new user creation
  - Email, name, ID number, role, division, section fields
  - Automatic temporary password generation
  - Welcome email sent via Brevo
  - Force password change on first login

- **User Status Management**:
  - Active/Inactive toggle
  - Deactivation with confirmation modal
  - Activation with confirmation modal
  - Status reflected in user table

- **Modals**:
  - **EditUserModal**: Update user information
  - **AddNewUserModal**: Create new user with email invitation
  - **DeleteConfirmationModal**: Confirm before deletion
  - **DeactivateConfirmationModal**: Confirm deactivation
  - **ActivateConfirmationModal**: Confirm activation
  - **UserLogsModal**: View audit history for user
  - **SuccessModal**: Confirmation of successful operation

- **Database Integration**:
  - Fetch from `users` table with relations:
    - `divisions` (name, id)
    - `sections` (name, id)
  - CRUD operations: Create, Read, Update, Delete
  - Real-time list refresh after operations

---

### 5. **Upload Files** (`/upload-files`)
**Status**: ✅ Implemented (Core functionality)

File upload management system with section-based organization.

**Features**:

#### 5.1 File Upload Interface
- Drag-and-drop upload capability
- File selection modal
- Progress indicators
- File type validation
- Multiple file upload support

#### 5.2 Folder Organization
- **Main Folders**: 
  - DRRM (Disaster Risk Reduction Management)
  - HRD (Human Resource Development)
  - Planning and Research
  - Finance
  - Others

- **Subfolders with Coding System**:
  - DRRM/Contingency Plans (Code: CP)
  - DRRM/Incident Reports (Code: IR)
  - DRRM/Hazard Assessments (Code: HA)
  - HRD/Training (Code: TR)
  - HRD/Leave (Code: LV)

#### 5.3 Section-Based Access
- Users upload to their assigned section
- Section-specific folder filtering
- Automatic section assignment

#### 5.4 File Request Management
- **File Request List** showing:
  - Requested file name
  - Requester name and role
  - Due date
  - Priority level (HIGH, NORMAL)
  - Status (Pending, Overdue, Completed)

- **Request Actions**:
  - Mark as completed
  - View request details
  - Respond to requests
  - Request history tracking

- **Sample Requests**:
  - Budget Report 2025 (Due: Mar 15, 2026, HIGH priority)
  - Annual Performance Review (Due: Mar 20, 2026)
  - Q1 Enrollment Summary (Overdue, HIGH priority)

#### 5.5 Upload Status Tracking
- **Status Colors**:
  - Completed: Teal
  - Pending: Orange
  - Uploading: Blue
  - Failed: Red

#### 5.6 Excel Parsing
- Integrated Excel parser for batch data import
- Support for multiple file formats
- Data validation on import

---

### 6. **Repository** (`/repository`)
**Status**: ✅ Implemented

Centralized file management system with role-based access control.

#### 6.1 Repository Views

**Grid View**:
- Visual folder cards with color coding
- Folder name and metadata display
- Click to open folder contents
- Responsive grid layout

**List View**:
- Detailed folder listing
- File count per folder
- Last modified date
- Quick action buttons

#### 6.2 Division-Based Folders
- Folders organized by divisions
- Color-coded by division for visual identification
- **Color Palette**: 8+ distinct colors for differentiation
  - Blue, Purple, Pink, Red, Orange, Yellow, Green, Teal

#### 6.3 Search & Filter
- **Search Bar**: Real-time search across folder names
- **Tab Navigation**:
  - "All" - View all accessible folders
  - Division-specific tabs
  - Special folders (SGOD, etc.)

#### 6.4 Repository Navigation
- **Folder Detail View** (`/repository/folder/:folderName`)
  - Files within selected folder
  - Breadcrumb navigation
  - Back button for navigation

- **Division View** (`/repository/divisions/:divisionSlug`)
  - All files for specific division
  - Division-specific filtering
  - Aggregated file listing

- **Section View** (`/repository/sections/sgod`)
  - Section-specific file access
  - SGOD (Schools Division Office - Baliwag) folder

#### 6.5 Access Control
- **Access Restricted Page** (`/repository/restricted/:folderName`)
  - Displays when user lacks permissions
  - Explains access restriction
  - Option to request access

#### 6.6 Repository Operations
- **File Actions**:
  - View file metadata
  - Download files
  - Preview documents (where applicable)
  - Request access for restricted files

---

### 7. **Audit Logs** (`/audit-logs`)
**Status**: ✅ Implemented (Mock data structure)

Comprehensive activity tracking and compliance logging.

**Logged Actions**:
- Upload
- Download
- Verify
- Edit
- Delete
- User Management
- Permission Changes

**Audit Log Fields**:
| Field | Description |
|-------|-------------|
| **File Name** | Name of affected file |
| **Action** | Type of action performed (CRUD operations) |
| **Performed By** | Name of user who performed action |
| **Role** | User's role at time of action |
| **Performed On** | Timestamp of action |
| **IP Address** | Source IP of request |
| **Details** | Additional context (e.g., "Document verified and approved") |
| **Status** | Result of action (Success, Failed, Pending) |

**Filtering & Search**:
- Filter by action type
- Filter by date range
- Filter by user
- Search by file name
- Search by IP address

**Export Capability**:
- Download audit logs as CSV
- Date range selection
- Custom column selection

**Sample Log Entry**:
```
File: Student Enrollment Data Q1.pdf
Action: Upload
Performed By: Juan Dela Cruz (Division Focal Person)
Time: Feb 24, 2026 10:30 AM
IP: 192.168.1.101
Details: Uploaded to Planning and Research folder
Status: Success
```

---

## Database Architecture

### Database Platform
**Supabase** (PostgreSQL-based backend)

### Core Tables

#### 1. **enrollment_data**
Stores student enrollment information by school and grade level.

```sql
Table: enrollment_data
├── id (UUID, Primary Key)
├── school_id (VARCHAR 50)
├── school_name (VARCHAR 255)
├── school_type (VARCHAR 50)
├── category (VARCHAR 50) -- 'PUBLIC' or 'PRIVATE'
├── school_year (VARCHAR 20)
├── elementary_data (JSONB) -- Grade 1-6, M/F breakdown
├── junior_high_data (JSONB) -- Grades 7-10, M/F breakdown
├── senior_high_s1_data (JSONB) -- SHS Semester 1, M/F breakdown
├── senior_high_s2_data (JSONB) -- SHS Semester 2, M/F breakdown
├── grand_total (INTEGER)
├── uploaded_by (VARCHAR 255)
└── created_at (TIMESTAMP)

Indexes:
- idx_enrollment_data_school_year
- idx_enrollment_data_school_id
- idx_enrollment_data_category
```

**JSONB Structure Example**:
```json
{
  "grade_1": { "male": 45, "female": 42 },
  "grade_2": { "male": 48, "female": 46 },
  "grade_3": { "male": 50, "female": 49 },
  ...
  "grade_6": { "male": 52, "female": 51 }
}
```

#### 2. **users**
User account and profile information.

```sql
Table: users
├── id (UUID, Primary Key)
├── email (VARCHAR 255, Unique)
├── full_name (VARCHAR 255)
├── id_number (VARCHAR 50)
├── role (VARCHAR 100) -- 'administrator', 'division_focal', 'section_focal', 'section_personnel'
├── is_active (BOOLEAN, default: true)
├── must_change_password (BOOLEAN, default: false)
├── division_id (FK → divisions)
├── section_id (FK → sections)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 3. **divisions**
Organizational divisions within the school system.

```sql
Table: divisions
├── id (UUID, Primary Key)
├── name (VARCHAR 255)
├── managed_by (VARCHAR 255) -- Contact person
├── description (TEXT)
└── created_at (TIMESTAMP)
```

**Sample Divisions**:
- Planning and Research
- Human Resource Development
- Finance
- Disaster Risk Reduction Management
- Administrative Services
- School Operations

#### 4. **sections**
Departments/sections within divisions.

```sql
Table: sections
├── id (UUID, Primary Key)
├── name (VARCHAR 255)
├── division_id (FK → divisions)
└── created_at (TIMESTAMP)
```

**Sample Sections**:
- SGOD (Schools Division Office - Baliwag)
- Records Management
- Research and Development
- etc.

#### 5. **files** (Implied)
File repository storage metadata.

```sql
Table: files (Inferred from usage)
├── id (UUID, Primary Key)
├── filename (VARCHAR 255)
├── folder_id (FK → folders)
├── uploaded_by (FK → users)
├── file_size (INTEGER)
├── file_type (VARCHAR 50)
├── s3_path (TEXT) -- Cloud storage reference
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 6. **folders** (Implied)
Repository folder structure.

```sql
Table: folders (Inferred from usage)
├── id (UUID, Primary Key)
├── name (VARCHAR 255)
├── division_id (FK → divisions)
├── color_preset_id (INTEGER) -- References COLOR_PRESETS
├── is_restricted (BOOLEAN)
└── created_at (TIMESTAMP)
```

#### 7. **audit_logs** (Implied)
Activity tracking for compliance.

```sql
Table: audit_logs (Inferred from usage)
├── id (UUID, Primary Key)
├── user_id (FK → users)
├── action (VARCHAR 50)
├── resource_type (VARCHAR 100)
├── resource_id (VARCHAR 255)
├── details (JSONB)
├── ip_address (VARCHAR 45)
├── status (VARCHAR 50)
└── created_at (TIMESTAMP)
```

### Row Level Security (RLS)
Row Level Security is enabled on critical tables:
- `enrollment_data`: Policies for read, insert, update, delete access
- Additional tables likely secured by role-based policies

### Relationships & Foreign Keys
```
users
├── division_id → divisions.id
└── section_id → sections.id

sections
├── division_id → divisions.id

folders
├── division_id → divisions.id

files
├── folder_id → folders.id
└── uploaded_by → users.id

audit_logs
└── user_id → users.id
```

---

## Authentication & Authorization

### Authentication Flow

1. **User Credentials**:
   - Email + Password via login form
   - Validated against Supabase Auth

2. **Session Management**:
   - Supabase Auth provides session token
   - Token stored in browser session
   - Auto-refresh on page load

3. **User Profile Loading**:
   - Fetched from `users` table via `user_id`
   - Cached in localStorage as `userProfile`
   - Available in UserContext throughout app

4. **Password Change**:
   - New users flagged with `must_change_password: true`
   - ChangePasswordModal shown on first app load
   - User forced to change password before accessing features

### Role-Based Access Control (RBAC)

#### Roles & Permissions

| Role | Level | Permissions | Features |
|------|-------|-------------|----------|
| **Administrator** | System-wide | - Full system access<br>- User management (CRUD)<br>- All analytics<br>- All repository access<br>- Audit logs access | All pages and features |
| **Division Focal Person** | Division | - Division-level analytics<br>- Division repository access<br>- User management for division<br>- File uploads to division | Dashboard, Repository, Upload Files (division-specific) |
| **Section Officer/Personnel** | Section | - Section-level uploads<br>- Section repository access<br>- Read-only dashboard | Upload Files, Repository (section-specific), Dashboard (read-only) |
| **School Principal** | School | - School-specific analytics (read-only)<br>- Basic repository access | Dashboard (read-only), limited Repository |

### Access Control Mechanisms

1. **Route Protection**:
   - `ProtectedRoute` component wraps authenticated pages
   - Requires active session to access
   - Redirects to login if not authenticated

2. **Component-Level Access**:
   - User role checked in component state
   - Features shown/hidden based on role
   - Admin-only actions conditionally rendered

3. **Data Filtering**:
   - Database queries filter by user's division/section
   - Supabase RLS policies enforce server-side filtering
   - Users cannot access data outside their scope

4. **Repository Access**:
   - Folders tagged with minimum required role
   - Access restricted pages for unauthorized access
   - Option to request access

### User Status Management

- **Active**: User can login and access system
- **Inactive**: User account disabled (can be reactivated)
- Deactivated users cannot authenticate

---

## Component Architecture

### Component Organization

```
src/components/
├── AppLayout.jsx              # Main layout wrapper (sidebar + header)
├── ProtectedRoute.jsx         # Route protection for authenticated pages
├── Sidebar.jsx                # Navigation sidebar
├── TopHeader.jsx              # Top navigation bar
├── DashboardComponents/       # Dashboard-specific components
│   ├── ChartContainer.jsx
│   ├── CohortChart.jsx
│   ├── DashboardAccordion.jsx
│   ├── DashboardFilters.jsx
│   ├── DashboardGrid.jsx
│   ├── DashboardHeader.jsx
│   ├── DashboardOverview.jsx
│   ├── DashboardSection.jsx
│   ├── DataSummaryCard.jsx
│   ├── DropoutChart.jsx
│   ├── EnrollmentByLevel.jsx
│   ├── EnrollmentChart.jsx
│   ├── GenderCard.jsx
│   ├── InsightCard.jsx
│   ├── MetricProgress.jsx
│   ├── PerformanceCard.jsx
│   ├── PromotionChart.jsx
│   ├── ResourcesByLevel.jsx
│   ├── ResourcesInventoryChart.jsx
│   ├── SectionDivider.jsx
│   ├── StatCard.jsx
│   ├── TextbooksChart.jsx
│   ├── TrendCard.jsx
│   └── index.js
├── LandingPageComponents/     # Landing page components
│   ├── AboutSection.jsx
│   ├── AnalyticsPreview.jsx
│   ├── CTASection.jsx
│   ├── Footer.jsx
│   ├── HeroSection.jsx
│   ├── HeroStats.jsx
│   ├── Navbar.jsx
│   ├── SectionHeader.jsx
│   └── index.js
├── LoginPageComponents/       # Login page components
│   ├── LoginBranding.jsx
│   ├── LoginButton.jsx
│   ├── LoginCheckbox.jsx
│   ├── LoginForm.jsx
│   ├── LoginFormInput.jsx
│   └── index.js
├── ManageUsersComponents/     # User management modals
│   ├── ActivateConfirmationModal.jsx
│   ├── AddNewUserModal.jsx
│   ├── DeactivateConfirmationModal.jsx
│   ├── DeleteConfirmationModal.jsx
│   ├── EditUserModal.jsx
│   ├── SuccessModal.jsx
│   └── UserLogsModal.jsx
├── Modals/                    # Generic modals
│   └── ChangePasswordModal.jsx
├── RepositoryComponents/      # Repository/file browser components
│   ├── FolderCard.jsx
│   ├── FolderColorPicker.jsx
│   ├── FolderGrid.jsx
│   ├── RepositoryBackButton.jsx
│   ├── RepositoryHeader.jsx
│   ├── RepositorySearchBar.jsx
│   ├── RepositoryTabs.jsx
│   └── index.js
└── UploadFilesComponents/     # File upload components
    ├── FileUploadModal.jsx
    ├── FolderSelectionModal.jsx
    └── ...
```

### Key Component Patterns

#### 1. Chart Components (Recharts-based)
- **CohortChart**: Area chart for survival rates
- **EnrollmentChart**: Line chart for enrollment trends
- **DropoutChart**: Bar chart for dropout rates
- **PromotionChart**: Stacked bar for promotions
- All wrapped in `ChartContainer` for consistent styling

#### 2. Data Cards
- **StatCard**: Display single metric with icon
- **TrendCard**: Show metric with trend indicator
- **DataSummaryCard**: Detailed metric information
- **PerformanceCard**: Academic performance display
- **InsightCard**: Key insights and recommendations

#### 3. Modal Components
- **EditUserModal**: Form for user editing
- **DeleteConfirmationModal**: Confirmation dialog
- **AddNewUserModal**: Form for new user creation
- **ChangePasswordModal**: Password reset form
- All use consistent modal styling and animations

#### 4. Layout Components
- **AppLayout**: Wraps authenticated pages with sidebar + header
- **DashboardGrid**: Responsive grid for dashboard layout
- **DashboardSection**: Organized section of metrics
- **SectionDivider**: Visual separator between sections

---

## Key Features Breakdown

### 1. Analytics Dashboard

#### Current Capabilities

**Metrics Tracked**:
- Total enrollment by school/division
- Dropout rates (overall, by level)
- Promotion rates (elementary, JHS)
- Cohort survival rates
- Gender distribution
- Resources/textbooks inventory
- Academic performance

**Time-Based Analysis**:
- Year-over-year comparisons
- Trend analysis over multiple years
- Historical data visualization
- Seasonal pattern identification

**Filtering Options**:
- By school year
- By grade level
- By school category (public/private)
- By specific school/division
- Multi-filter combinations

#### Visualization Types

| Chart Type | Purpose | Example |
|-----------|---------|---------|
| Line Chart | Trend over time | Enrollment growth |
| Bar Chart | Category comparison | Dropout by grade |
| Stacked Bar | Composition comparison | Elementary vs JHS vs SHS |
| Area Chart | Cumulative trend | Cohort survival rate |
| Pie Chart | Part-to-whole | Gender/subject distribution |
| Horizontal Bar | Long category names | Resources by level |

### 2. User Management System

#### Capabilities

- **Create Users**: 
  - Form validation
  - Automatic password generation
  - Email invitation sent
  - Password change required on first login

- **Read Users**:
  - List all users with pagination
  - Filter by division, role, status
  - Search by name or ID

- **Update Users**:
  - Edit name, ID number, role
  - Reassign division/section
  - Modify active status

- **Delete Users**:
  - Soft delete (deactivate) or hard delete
  - Confirmation before action
  - Cascading permission cleanup

- **View Logs**:
  - User activity history
  - Actions performed by user
  - Timestamps and details

#### Email Integration

- **Provider**: Brevo (SendinBlue)
- **Template**: HTML welcome email with:
  - Temporary password
  - Login link
  - Instructions to change password
  - Company branding

### 3. File Management & Repository

#### Organization Levels

```
Division (e.g., "Planning and Research")
├── Folder (e.g., "2025 Budget")
│   ├── File 1
│   ├── File 2
│   └── ...
└── ...
```

#### Access Control

- **Division-Level**: Users see only their division's folders
- **Section-Level**: Users can only upload to their section
- **Role-Based**: Different roles see different folders
- **Restricted Folders**: Special access restrictions with request mechanism

#### File Operations

| Operation | Status | Description |
|-----------|--------|-------------|
| Upload | ✅ | Multiple file upload, drag-and-drop |
| Download | ✅ | Direct file download |
| Preview | ✅ (Limited) | Preview for supported formats |
| Delete | ✅ | Remove files from repository |
| Share/Request | ✅ | Request access mechanism |
| Version Control | 🔄 | Planned feature |

### 4. Audit Logging

#### Tracked Events

- User login/logout
- File uploads/downloads
- File modifications
- User management actions
- Permission changes
- Access violations

#### Compliance Features

- Immutable audit trail
- IP address logging
- Timestamp tracking (UTC)
- User and role recording
- Detailed action description
- Success/failure status

#### Export & Reporting

- Download audit logs in CSV format
- Date range selection
- Custom column export
- Search and filter functionality

---

## Current Implementation Status

### ✅ Completed Features

| Feature | Component | Status | Notes |
|---------|-----------|--------|-------|
| Landing Page | Full page + components | ✅ Complete | Public homepage functional |
| Authentication | Login system | ✅ Complete | Supabase integration working |
| Dashboard Overview | Overview cards | ✅ Complete | Sample data, real data pending |
| Enrollment Chart | Chart component | ✅ Complete | Recharts integration |
| Dropout Chart | Chart component | ✅ Complete | Dynamic data visualization |
| Promotion Chart | Chart component | ✅ Complete | Multi-level filtering |
| Cohort Chart | Chart component | ✅ Complete | Area chart with trends |
| Gender Distribution | Pie chart | ✅ Complete | Demographic tracking |
| Resources/Textbooks | Inventory charts | ✅ Complete | Allocation visualization |
| Dashboard Filters | Filter component | ✅ Complete | Multi-select filtering |
| User Management | Full CRUD | ✅ Complete | All operations working |
| User Add Modal | Modal + email | ✅ Complete | Brevo integration |
| User Edit Modal | Form modal | ✅ Complete | Update functionality |
| User Delete Modal | Confirmation | ✅ Complete | With cascading cleanup |
| Deactivate Users | Status toggle | ✅ Complete | Reversible action |
| View User Logs | Modal display | ✅ Complete | Activity history |
| File Upload | Upload page | ✅ Complete | Basic functionality |
| File Repository | Grid/list view | ✅ Complete | Folder browsing |
| Repository Filters | Search/tabs | ✅ Complete | Filter by division |
| Folder Navigation | Routing | ✅ Complete | Detail and division views |
| Access Control | Restricted view | ✅ Complete | Permission handling |
| Audit Logs | Log display | ✅ Complete | Mock data structure |
| AppLayout | Sidebar + header | ✅ Complete | Navigation wrapper |
| Protected Routes | Route wrapper | ✅ Complete | Auth enforcement |
| Change Password | Modal form | ✅ Complete | First-login requirement |

### 🔄 In Progress / Partial

| Feature | Component | Status | Notes |
|---------|-----------|--------|-------|
| Dashboard Data | Real database queries | 🔄 | Currently using sample data |
| File Upload Storage | Cloud storage integration | 🔄 | Need S3/Supabase Storage setup |
| Audit Log Database | Actual logging | 🔄 | Structure ready, logging not implemented |
| File Request System | Request management | 🔄 | UI ready, backend pending |
| Advanced Analytics | ML-based insights | 🔄 | Planned enhancement |
| Export Reports | PDF/Excel export | 🔄 | Basic structure ready |
| Mobile Responsiveness | Mobile UI | 🔄 | Desktop-first, mobile enhancement needed |

### 📋 Planned Features

| Feature | Priority | Timeline | Notes |
|---------|----------|----------|-------|
| Real-time Notifications | Medium | Q3 2026 | User alerts for uploads, approvals |
| Advanced Search | High | Q2 2026 | Full-text search across files |
| Batch Import | High | Q2 2026 | Excel/CSV bulk data import |
| Report Generation | Medium | Q3 2026 | Automated report creation |
| Dashboard Customization | Low | Q4 2026 | User-configurable widgets |
| Mobile App | Low | Q1 2027 | Native mobile application |
| API Documentation | High | Q2 2026 | OpenAPI/Swagger docs |
| Single Sign-On (SSO) | Medium | Q3 2026 | LDAP/Active Directory integration |
| Data Backup/Recovery | High | Q2 2026 | Automated backup system |
| Performance Optimization | Medium | Q2 2026 | Caching, indexing improvements |

### Known Issues & Limitations

1. **Sample Data**: Dashboard currently uses hardcoded sample data
   - **Impact**: Metrics don't reflect actual school data
   - **Resolution**: Connect to enrollment_data table queries

2. **File Storage**: No cloud storage backend configured
   - **Impact**: File upload to repository not persisted
   - **Resolution**: Configure Supabase Storage or AWS S3

3. **Audit Logging**: Logs display mock data
   - **Impact**: No actual activity tracking
   - **Resolution**: Implement server-side logging middleware

4. **Mobile Responsiveness**: Not optimized for mobile
   - **Impact**: Poor UX on phones/tablets
   - **Resolution**: Add responsive design for mobile viewports

5. **Excel Parsing**: Basic implementation
   - **Impact**: Limited format support
   - **Resolution**: Enhance parser for more formats

---

## Integration Services

### 1. Supabase

**Purpose**: Backend database and authentication

**Configured**:
- ✅ Authentication (Email/password)
- ✅ User and metadata tables
- ✅ Row Level Security policies
- ✅ Session management

**Pending**:
- Database queries for real dashboard data
- File storage for repository
- Audit log table and triggers
- Advanced RLS policies by role

**Environment Variables**:
```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[public key]
SUPABASE_SERVICE_ROLE_KEY=[admin key for server]
```

### 2. Brevo (Email Service)

**Purpose**: User account creation emails

**Configured**:
- ✅ API credentials
- ✅ Sender email configured
- ✅ HTML templates

**Email Types**:
1. Welcome email (user creation)
   - Temporary password
   - Login instructions
   - Password change requirement

**Environment Variables**:
```
BREVO_API_KEY=[API key from Brevo]
BREVO_SENDER_EMAIL=[verified sender email]
SITE_URL=[application URL for email links]
```

### 3. Server (Express Backend)

**Endpoints Implemented**:

#### POST `/api/create-user`
Creates new user in system

**Request**:
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "division_id": "uuid",
  "section_id": "uuid",
  "role": "Division Focal Person",
  "idNumber": "12345"
}
```

**Response**:
```json
{
  "success": true,
  "email": "user@example.com"
}
```

**Flow**:
1. Generate temporary password
2. Create auth user via Supabase Admin API
3. Insert into users table
4. Send welcome email via Brevo
5. Return success response

**Error Handling**:
- Auth creation failure
- Database insertion failure
- Email sending failure
- Return appropriate error messages

---

## Project Structure

```
onedata/
├── public/                          # Static assets
├── src/
│   ├── App.jsx                      # Main app router
│   ├── index.css                    # Global styles
│   ├── App.css                      # App-level styles
│   ├── main.jsx                     # React entry point
│   ├── components/                  # React components
│   │   ├── AppLayout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TopHeader.jsx
│   │   ├── DashboardComponents/
│   │   ├── LandingPageComponents/
│   │   ├── LoginPageComponents/
│   │   ├── ManageUsersComponents/
│   │   ├── Modals/
│   │   ├── RepositoryComponents/
│   │   └── UploadFilesComponents/
│   ├── pages/                       # Page components
│   │   ├── Dashboard/
│   │   ├── LandingPage/
│   │   ├── Login/
│   │   ├── ManageUsers/
│   │   ├── Repository/
│   │   ├── UploadFiles/
│   │   └── AuditLogs/
│   ├── contexts/                    # React contexts
│   │   └── UserContext.jsx          # Global user state
│   ├── hooks/                       # Custom React hooks
│   ├── lib/                         # Libraries
│   │   └── supabaseClient.js        # Supabase initialization
│   ├── constants/                   # Constants
│   │   └── repositoryFolders.js     # Folder definitions
│   ├── utils/                       # Utility functions
│   │   ├── ExcelParsers/            # Excel parsing utilities
│   │   └── ...
│   ├── services/                    # API services
│   ├── styles/                      # CSS/styling
│   │   └── design-tokens.css        # Design system tokens
│   ├── assets/                      # Images, icons, etc.
│   └── MDs/                         # Documentation files
├── server/
│   ├── index.js                     # Express server entry
│   └── package.json                 # Server dependencies
├── supabase/
│   ├── config.toml                  # Supabase config
│   └── functions/                   # Supabase edge functions
├── package.json                     # Frontend dependencies
├── vite.config.js                   # Vite configuration
├── eslint.config.js                 # ESLint rules
├── index.html                       # HTML entry point
├── supabase_schema.sql              # Database schema
└── README.md                         # Project readme
```

### File Statistics

| Category | Count | Notes |
|----------|-------|-------|
| Page Components | 7 | Dashboard, Login, LandingPage, ManageUsers, Repository, UploadFiles, AuditLogs |
| Component Folders | 6 | Dashboard (24), LandingPage (8), LoginPage (5), ManageUsers (7), Repository (7+), UploadFiles |
| Dashboard Components | 24 | Charts, cards, filters, layouts |
| Contexts | 1 | UserContext for global state |
| Hooks | 1+ | Custom React hooks (directory ready) |
| Services | 1+ | API service layer (directory ready) |
| Utilities | 2 | ExcelParsers for data import |

---

## Key Metrics & Statistics

### System Scope

- **Pages**: 7 major pages + landing page
- **Components**: 100+ reusable components
- **Database Tables**: 4+ core tables (users, divisions, sections, enrollment_data)
- **User Roles**: 4 distinct role types
- **Features**: 30+ major features across 6 categories

### Data Dimensions

- **Enrollment Data**:
  - Multiple school years
  - 6 grade levels (elementary)
  - 4 grade levels (junior high)
  - 2 semesters (senior high)
  - Gender breakdown (M/F)
  - Public/Private categories

- **User Management**:
  - Multiple divisions
  - Multiple sections
  - 4 role types
  - Active/Inactive status tracking

### Performance Targets

- **Chart Rendering**: < 200ms for average dataset
- **Page Load**: < 2s for dashboard with data
- **Search Response**: < 100ms for repository search
- **File Upload**: Support up to 100MB files
- **Concurrent Users**: Support 50+ simultaneous users

---

## Future Roadmap

### Phase 1: Data Integration (Q2 2026)
- [ ] Connect dashboard to real enrollment_data
- [ ] Implement file storage backend (Supabase Storage)
- [ ] Setup audit log database and logging middleware
- [ ] Add batch import for Excel data
- [ ] Optimize database queries and add indexes

### Phase 2: Enhanced Features (Q3 2026)
- [ ] Advanced search and filtering
- [ ] Report generation and export (PDF/Excel)
- [ ] Real-time notifications
- [ ] Dashboard customization
- [ ] Mobile responsive design

### Phase 3: Enterprise (Q4 2026)
- [ ] Single Sign-On integration
- [ ] API documentation and SDKs
- [ ] Performance optimization and caching
- [ ] Advanced analytics with ML insights
- [ ] Multi-language support

### Phase 4: Expansion (2027)
- [ ] Native mobile app
- [ ] Offline capability
- [ ] Advanced data visualization
- [ ] Custom report builder
- [ ] Integration with other education systems

---

## Deployment & Configuration

### Environment Setup

**Required Environment Variables**:

```bash
# Supabase
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[public key]

# Server
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service role key]
BREVO_API_KEY=[API key]
BREVO_SENDER_EMAIL=[sender email]
SITE_URL=https://onedata.example.com

# Server Port
PORT=3001
```

### Build & Run

**Frontend**:
```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

**Server**:
```bash
cd server
npm install
node index.js
```

### Deployment Options

- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, Render, AWS
- **Database**: Supabase (managed)

---

## Contact & Support

**Project Owner**: Department of Education - City of Baliwag  
**Development Team**: OneData Development Team  
**Last Updated**: July 2026  
**Version**: 0.0.0 (Early Development)

---

## License & Attribution

This documentation covers the OneData system - a comprehensive education management platform created for the Department of Education, Schools Division of City of Baliwag.

**Built with**:
- React & Vite
- Tailwind CSS
- Recharts
- Supabase
- Express.js
