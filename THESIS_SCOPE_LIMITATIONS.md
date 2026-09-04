# ONE DATA — Thesis Scope & Limitations Additions

The following are suggested additions to the existing Scope and Limitations sections based on a thorough audit of the system's actual implementation.

---

## Scope — Suggested Additions

Your current scope covers file storage, dashboard visualizations, role-based access, and school year filtering. The following features are implemented but not yet mentioned:

### Structured Data Ingestion

> The system includes structured data ingestion which parses uploaded Excel files into normalized database tables, enabling the dashboard to display aggregated educational metrics derived from school-level submissions. Supported categories include enrollment, classroom inventory, seat inventory, teacher inventory, textbook inventory, CESPES operations, and performance indicators.

### Real-Time Notifications

> The system provides real-time in-app notifications for key events such as file uploads, verification status changes, access request decisions, and file deletions. Notifications are delivered through a persistent connection and do not require page refreshes.

### Verified PDF Generation

> The system generates verified PDF copies of uploaded Excel and PDF files. Each verified copy includes an embedded verification stamp containing the authorizing officer's name and the date of verification, rendered on every page of the document.

### School Year Lifecycle Management

> The system supports school year lifecycle management, including scheduling future school years, activating new school years, and archiving or reopening past school years. These operations are performed by administrators through dedicated management controls.

### Access Request and Approval Workflow

> The system implements an access request and approval workflow for cross-section and cross-division file access. Users may submit access requests with a message and optional deadline. Requests are reviewed by the appropriate authority and may be approved, denied, or revoked, with the requester notified at each stage.

### Section Deletion Request Workflow

> The system includes a governance mechanism for section deletion. Section focal persons may submit deletion requests for their assigned section. Administrators review these requests and may approve or decline them. Approved deletions remove the section and its associated files from the system after reauthentication.

---

## Limitations — Suggested Additions

Your current limitations cover offline access, scope restriction, no AI features, role-based restrictions, data immutability, and no external integration. The following are additional limitations observed in the implemented system:

### Dashboard Data Is Not User-Scoped

> Dashboard analytics currently display division-wide and system-wide aggregated data. Role-based filtering of dashboard content by the user's assigned division or section is not implemented. All authenticated users with dashboard access see the same set of metrics regardless of their organizational scope.

### File Upload Constraints

> File uploads are limited to 50 MB per file. Supported formats include Excel (.xlsx, .xls), PDF, Word (.docx), PowerPoint (.pptx), CSV, plain text, images (.png, .jpg, .jpeg, .gif), and compressed archives (.zip, .rar). Files exceeding the size limit or using unsupported formats are rejected by the system.

### No Native Mobile Application

> The system is web-based and does not provide a native mobile application. Mobile access is available through responsive browser views only, which may not offer the same level of functionality or usability as the desktop interface.

### No File Versioning

> The system does not provide file versioning. When a file is replaced or re-uploaded, the previous version is overwritten without maintaining a revision history. Users cannot retrieve earlier versions of a file through the system.

### No Public API or External Integration

> The system does not expose a public API, SDK, or webhook interface for third-party integration. All system interactions occur exclusively through the web-based user interface.

### Limited Report Export

> The system does not currently support exporting dashboard analytics or reports as downloadable PDF or Excel files. The only export capability available is the print-friendly browser export for audit log records.

### Single-Tenant Architecture

> The system is designed for a single school division (DepEd Baliwag Division) and does not support multi-tenant or multi-division deployment without significant architectural changes. Division-specific data structures, templates, and organizational hierarchies are hardcoded to the target division.

### No Advanced Search Across Files

> The system provides file search within the repository by file name and uploader name, but does not support full-text search across file contents. Users must know the file name or uploader to locate specific documents.

### No Automated Backup or Disaster Recovery

> The system relies on Supabase's managed hosting for database and storage availability. There is no application-level automated backup, data export, or disaster recovery mechanism implemented within the system itself.

---

## Summary Table

| Category | Feature | Mentioned in Original | Actually Implemented |
|----------|---------|----------------------|---------------------|
| Scope | File storage and repository | Yes | Yes |
| Scope | Dashboard visualizations | Yes | Yes |
| Scope | Role-based access (4 roles) | Yes | Yes |
| Scope | School year filtering | Yes | Yes |
| Scope | Structured data ingestion | No | Yes |
| Scope | Real-time notifications | No | Yes |
| Scope | Verified PDF generation | No | Yes |
| Scope | School year lifecycle management | No | Yes |
| Scope | Access request/approval workflow | Partially | Yes |
| Scope | Section deletion workflow | No | Yes |
| Limitation | Single division scope | Yes | Yes |
| Limitation | Requires internet | Yes | Yes |
| Limitation | No AI/predictive features | Yes | Yes |
| Limitation | Role-restricted functions | Yes | Yes |
| Limitation | Historical data immutability | Yes | Yes |
| Limitation | No external integration | Yes | Yes |
| Limitation | Dashboard not user-scoped | No | Should disclose |
| Limitation | 50 MB upload limit | No | Should disclose |
| Limitation | No native mobile app | No | Should disclose |
| Limitation | No file versioning | No | Should disclose |
| Limitation | No public API | No | Should disclose |
| Limitation | Limited report export | No | Should disclose |
| Limitation | Single-tenant architecture | Partially | Should disclose |
| Limitation | No full-text search | No | Should disclose |
| Limitation | No automated backup | No | Should disclose |
