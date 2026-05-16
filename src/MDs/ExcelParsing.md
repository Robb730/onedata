````md
# Flexible Excel Import System

## Project Overview

Create a scalable Excel Import System for a web application that supports multiple Excel file formats such as:

- Enrollment Data
- Number of Schools
- Teachers Data
- Students Data
- Other future formats

The system must allow users to:

1. Select the type of Excel file they are uploading
2. Upload the Excel file
3. Validate the structure/headers of the file
4. Parse the data using the correct helper/parser
5. Preview the extracted data
6. Save valid records into the database
7. Show detailed error messages for invalid files

---

# System Requirements

## Core Features

### 1. Upload Module

Create an upload interface where users can:

- Select Import Type
- Upload `.xlsx` or `.csv` files
- Submit for processing

### Example Import Types

- Enrollment
- Schools
- Teachers
- Students

---

## 2. Parser Architecture

Implement a modular parser system.

Each Excel format must have its own helper/parser file.

### Example Structure

```txt
helpers/
 ├── enrollmentParser.js
 ├── schoolsParser.js
 ├── teachersParser.js
 ├── studentsParser.js
````

Each parser should:

* Read Excel sheets
* Extract rows
* Validate required columns
* Transform data
* Return clean structured data

---

## 3. Dynamic Parser Selection

Create a main import controller/service that selects the correct parser based on the chosen import type.

### Example Flow

```txt
User selects "Enrollment"
        ↓
System uses enrollmentParser
        ↓
Validate columns
        ↓
Extract rows
        ↓
Preview data
        ↓
Save to database
```

---

# Validation Requirements

Each parser must validate:

* Required headers
* Empty rows
* Invalid data types
* Missing required fields
* Duplicate entries

### Example

#### Enrollment Expected Columns

```txt
Student Name
Course
Year Level
Semester
```

If headers are incorrect:

```txt
Invalid Enrollment Template
```

---

# Data Preview Module

Before saving:

* Display parsed rows in a table
* Highlight invalid rows
* Allow cancellation before import

---

# Error Handling

The system must provide:

* Missing column errors
* Invalid file type errors
* Empty file errors
* Duplicate data warnings
* Import success/failure notifications

---

# Recommended Technologies

## Frontend

* HTML
* CSS
* JavaScript
* React (optional)

## Backend

* Node.js / Express

OR

* PHP / Laravel

OR

* Java Spring Boot

## Excel Processing Libraries

* SheetJS (xlsx)
* ExcelJS
* Apache POI (Java)
* PhpSpreadsheet (PHP)

---

# Database Design

Create database tables depending on the imported data.

## Example Enrollment Table

```txt
id
student_name
course
year_level
semester
created_at
```

---

# Suggested Folder Structure

```txt
project/
│
├── controllers/
│    └── importController.js
│
├── helpers/
│    ├── enrollmentParser.js
│    ├── schoolsParser.js
│    ├── teachersParser.js
│
├── services/
│    └── importService.js
│
├── uploads/
│
├── validations/
│
├── routes/
│
└── database/
```

---

# Step-by-Step Development Tasks

## Phase 1 — Setup

* Install Excel library
* Configure file upload
* Create upload form
* Setup backend routes

---

## Phase 2 — Excel Reading

* Read uploaded Excel files
* Extract sheets and rows
* Convert Excel rows into JSON

---

## Phase 3 — Parser System

* Create separate parser helpers
* Add header validation
* Add row transformation logic

---

## Phase 4 — Validation System

* Validate required columns
* Detect invalid data
* Handle duplicates

---

## Phase 5 — Preview System

* Display extracted data
* Highlight invalid rows
* Add confirmation before saving

---

## Phase 6 — Database Integration

* Save clean data
* Skip invalid rows
* Generate import reports

---

## Phase 7 — Error Handling & UX

* Add notifications
* Add loading states
* Add detailed error messages

---

# Best Practices

* Never rely on filenames alone
* Validate actual Excel headers
* Keep parsers independent
* Make system extensible for future formats
* Use reusable validation utilities
* Separate business logic from controllers

---

# Expected Output

The final system should:

* Support multiple Excel templates
* Automatically use the correct parser
* Validate files safely
* Show preview before import
* Save structured data into the database
* Be scalable for future Excel formats

```
```
