# 📊 OneData System Flowchart Guide

A practical reference for creating flowcharts for each user role in the OneData system.
Use this guide to understand what shapes to use, what each action means, and how to map each role's workflow visually.

---

## 📐 Flowchart Shape Legend

Use these standard shapes consistently across all flowcharts.

| Shape | Name | When to Use |
|-------|------|-------------|
| `(  )` Oval / Rounded Rectangle | **Start / End (Terminal)** | The beginning or end of a process |
| `[ ]` Rectangle | **Process / Action** | A step, task, or operation being performed |
| `< >` Diamond | **Decision** | A Yes/No or conditional branch (e.g., "Is login valid?") |
| `[ / ]` Parallelogram | **Input / Output** | Data being entered by a user or displayed/output by the system |
| `[[ ]]` Subroutine Rectangle | **Sub-process / Module** | A step that calls another defined process |
| `[= =]` Document Shape | **Document / File** | A file, report, or data record being created or read |
| `{ }` Database Cylinder | **Database** | Data stored in or retrieved from a database (Supabase) |
| `→` Arrow | **Flow Line** | Connects one step to the next, shows direction |
| `//` Dashed Line | **Optional / Conditional Flow** | An optional or background action |

---

## 🔁 General Flow Rules

1. **Every flowchart starts with a Terminal (Oval) labeled `Start`.**
2. **Every flowchart ends with a Terminal (Oval) labeled `End`.**
3. **Decisions (Diamonds) always have exactly two exits: `Yes` and `No` (or `Valid` / `Invalid`).**
4. **Loops return to an earlier step via an arrow labeled with the reason.**
5. **Error paths should loop back or terminate with an error state.**

---

## 👥 System Roles Overview

| Role | Internal Value | Description |
|------|----------------|-------------|
| **Administrator** | `administrator` | Full system access. Manages users, school years, audit logs |
| **Division Focal Person** | `division_focal` | Manages files/uploads at the division level |
| **Section Officer** | `section_focal` | Manages files/uploads at the section level |
| **Section Personnel** | `section_personnel` | Basic access; uploads and views files within their section |

---

---

## 🔐 Role 1: All Users — Login Flow

> Applies to: **All Roles**

```
(Start)
   ↓
[/ User visits OneData Landing Page /]
   ↓
[User clicks "Login"]
   ↓
[/ User enters Email + Password /]
   ↓
< Is the account valid? >
  |           |
 No          Yes
  |           ↓
  |    < Must change password? >
  |         |          |
  |        Yes         No
  |         ↓           ↓
  |  [Redirect to    [Redirect to Dashboard]
  |  Change Password]
  |         ↓
  |  [/ User enters new password /]
  |         ↓
  |  [Password saved in Supabase]
  |         ↓
  ↓  [Redirect to Dashboard]
[Show Error: "Invalid credentials"]
   ↓
[Return to Login Form]
   ↓
(End)
```

**Shape Notes:**
- `< Is the account valid? >` → **Decision Diamond** — checks Supabase Auth
- `[/ User enters Email + Password /]` → **Input Parallelogram**
- `[Redirect to Dashboard]` → **Process Rectangle**
- `{ Supabase Auth }` → **Database** (can be shown separately)

---

---

## 🛡️ Role 2: Administrator

> Access: Dashboard, Manage Users, Audit Logs, School Year, Repository (all), Upload Files, Settings

---

### 2A. Manage Users Flow

```
(Start)
   ↓
[Admin navigates to /manage-user]
   ↓
[System fetches all users from Supabase]
   ↓
[/ User list displayed in table or organization view /]
   ↓
< What action does Admin select? >
   |           |           |           |
[Add User] [Edit User] [Deactivate] [Delete User]
   |           |           |               |
   ↓           ↓           ↓               ↓
[Fill     [Edit name, [Confirm        [Confirm
 form:     ID, role,   deactivation]   deletion]
 name,     division/     |               |
 email,    section]      ↓               ↓
 role]         |      [User marked    [User removed
   |           |       is_active=     from Supabase]
   ↓           ↓       false]              |
[Invite     [Save                         |
 sent via   to Supabase]                  |
 Supabase]      |                         |
   |            |                         |
   └────────────┴─────────────────────────┘
                ↓
   [Audit log event recorded in Supabase]
                ↓
   [/ Success toast shown to Admin /]
                ↓
              (End)
```

**Shape Notes:**
- `< What action does Admin select? >` → **Decision Diamond** with 4 branches
- `[Audit log event recorded]` → **Process Rectangle** (triggers a Supabase insert)

---

### 2B. School Year Management Flow

```
(Start)
   ↓
[Admin navigates to /school-year]
   ↓
[System fetches existing school years]
   ↓
[/ School year list displayed /]
   ↓
< What does Admin want to do? >
   |                 |
[Add New]       [Edit / Archive]
   |                 |
   ↓                 ↓
[/ Fill school    [/ Edit label
  year label,       or mark as
  date range /]     archived /]
   |                 |
   ↓                 ↓
[Save to Supabase] [Save to Supabase]
   |                 |
   └────────┬────────┘
            ↓
[Audit log recorded]
            ↓
[/ Confirmation shown /]
            ↓
          (End)
```

---

### 2C. Audit Logs Flow

```
(Start)
   ↓
[Admin navigates to /audit-logs]
   ↓
[System fetches audit log records from Supabase]
   ↓
[/ Logs displayed: action, user, role, date, status /]
   ↓
< Admin wants to filter? >
   |           |
  Yes          No
   |           |
   ↓           ↓
[Apply      [View full
 filters:    list as-is]
 date, role,
 action]
   |           |
   └──────┬────┘
          ↓
< Export to PDF? >
   |           |
  Yes          No
   |           |
   ↓           ↓
[Generate    [Stay on page]
 printable
 PDF report]
          ↓
        (End)
```

---

---

## 📁 Role 3: Division Focal Person

> Access: Dashboard, Repository (own division = full access, other division = locked), Upload Files, Settings
> No access to: Manage Users, Audit Logs, School Year

---

### 3A. Upload File Flow

```
(Start)
   ↓
[Division Focal navigates to /upload-files]
   ↓
[/ System pre-selects their division scope /]
   ↓
[/ User selects: Import Type (e.g., Enrollment, Schools) /]
   ↓
[/ User selects file (.xlsx or .csv) /]
   ↓
< Is the file format valid? >
   |               |
  No              Yes
   |               ↓
   |      [Parse file using correct parser
   |       (enrollmentParser, schoolsParser...)]
   |               ↓
   |      < Are required columns present? >
   |          |               |
   |         No              Yes
   |          |               ↓
   |          |      [Preview extracted data in table]
   |          |               ↓
   |          |      < User confirms import? >
   |          |          |           |
   |          |         No          Yes
   |          |          |           ↓
   |          |     [Cancel]  [Save records to Supabase]
   |          |                      ↓
   ↓          ↓             [Audit log recorded]
[Show error: [Show error:           ↓
 "Invalid     "Invalid        [/ Success notification /]
  file type"]  template"]           ↓
   ↓           ↓                  (End)
[Return to upload form]
```

---

### 3B. Repository Access Flow

```
(Start)
   ↓
[Division Focal navigates to /repository]
   ↓
[System loads divisions list]
   ↓
< Is this their own division? >
   |               |
  Yes              No
   ↓               ↓
[Full access:   < Has approved access request? >
 view, download,     |               |
 upload, delete]    Yes              No
                     ↓               ↓
                  [Locked access: [Blocked —
                   view only,      redirect to
                   download        /repository/
                   requires        restricted]
                   request]
   |               |
   └───────┬───────┘
           ↓
[/ Files and folders displayed /]
           ↓
         (End)
```

---

---

## 🗂️ Role 4: Section Officer (Section Focal)

> Access: Dashboard, Repository (own section = full, same division = locked, other division = locked/blocked), Upload Files, Settings

---

### 4A. Upload File Flow

> Same flow as Division Focal (3A) but **scoped to their section** instead of division.

```
(Start)
   ↓
[Section Officer navigates to /upload-files]
   ↓
[/ System pre-selects their section scope /]
   ↓
[/ User selects Import Type /]
   ↓
[/ User selects .xlsx or .csv file /]
   ↓
< Is file format valid? >
   |               |
  No              Yes
   |               ↓
   |      [Parse with correct parser]
   |               ↓
   |      < Are required columns present? >
   |          |               |
   |         No              Yes
   ↓          |               ↓
[Error]       ↓      [Preview data in table]
           [Error]           ↓
                    < Confirm import? >
                        |          |
                       No         Yes
                        ↓          ↓
                    [Cancel]  [Save to Supabase]
                                   ↓
                          [Audit log recorded]
                                   ↓
                         [/ Success shown /]
                                   ↓
                                 (End)
```

---

### 4B. Repository Access Flow

```
(Start)
   ↓
[Section Officer navigates to /repository]
   ↓
< Accessing own section? >
   |           |
  Yes          No
   ↓           ↓
[Full      < Same division? >
 access]       |         |
              Yes        No
               ↓         ↓
           [Locked    < Approved access request? >
            access]       |              |
                         Yes             No
                          ↓              ↓
                      [Locked]       [Blocked —
                                      redirect to
                                      restricted]
   |           |           |
   └───────────┴───────────┘
               ↓
     [/ Files displayed /]
               ↓
             (End)
```

---

---

## 👤 Role 5: Section Personnel

> Access: Dashboard, Repository (own section = full, others = locked/blocked), Upload Files, Settings
> Most restricted non-admin role.

---

### 5A. Upload File Flow

> Same flow as Section Officer (4A) — scoped to their section.

---

### 5B. Repository Access Flow

```
(Start)
   ↓
[Personnel navigates to /repository]
   ↓
< Accessing own section? >
   |           |
  Yes          No
   ↓           ↓
[Full      < Has approved access request for that division? >
 access]       |                     |
              Yes                    No
               ↓                     ↓
           [Locked               [Blocked —
            access:               redirect to
            request per file]     restricted page]
   |           |
   └─────┬─────┘
         ↓
[/ Files displayed per access level /]
         ↓
       (End)
```

---

### 5C. File Access Request Flow (Locked files)

```
(Start)
   ↓
[Personnel views a locked file in repository]
   ↓
[/ "Request Access" button shown /]
   ↓
[User clicks "Request Access"]
   ↓
[Request sent to Supabase (division_access_requests)]
   ↓
< Request approved by Admin/Division Focal? >
   |                   |
  No                  Yes
   ↓                   ↓
[File remains       [File unlocked —
 locked]             user can view/
                      download]
   ↓                   ↓
(End)               (End)
```

---

---

## ⚙️ All Roles — Settings Flow

> Applies to: **All Roles**

```
(Start)
   ↓
[User navigates to /settings]
   ↓
[/ Profile info displayed: name, email, role, ID /]
   ↓
< What does user want to do? >
   |                   |
[Edit profile]   [Change password]
   |                   |
   ↓                   ↓
[/ Update name,   [/ Enter current
   ID number /]    password + new
   |               password /]
   ↓               ↓
[Save to       < Current password correct? >
 Supabase]        |              |
   |             No             Yes
   ↓              ↓              ↓
[/ Success    [Show error]  [Update password
  toast /]                   in Supabase Auth]
   |                              ↓
   |                     [/ Success shown /]
   └──────────────────────────────┘
                  ↓
                (End)
```

---

---

## ✅ Quick Decision Diamond Reference

When drawing a diamond, always label the two exits:

| Decision | Yes Exit | No Exit |
|----------|----------|---------|
| Is login valid? | Proceed to dashboard | Show error, return to form |
| Must change password? | Redirect to change-password | Go to dashboard |
| Is file format valid? | Parse file | Show format error |
| Are columns present? | Preview data | Show template error |
| Confirm import? | Save to DB | Cancel |
| Own division/section? | Full access | Check for access grant |
| Has access request approved? | Locked access | Blocked / Restricted |
| Request approved? | Unlock file | File stays locked |

---

## 📝 Flowchart Drawing Tips

1. **Top-to-bottom flow** is the standard direction — use left/right only for Yes/No splits.
2. **Label every arrow** coming out of a decision diamond (Yes / No, or the condition).
3. **Group related steps** — for example, validation steps should be close together.
4. **Use consistent shape sizes** across the same flowchart.
5. **Add swimlanes** if you want to show which actor (User, System, Supabase) handles each step.
6. **Color code roles** in a multi-role diagram:
   - 🔴 Administrator
   - 🔵 Division Focal Person
   - 🟢 Section Officer
   - 🟡 Section Personnel

---

*Generated for: OneData Capstone System | Role-Based Access Control*
