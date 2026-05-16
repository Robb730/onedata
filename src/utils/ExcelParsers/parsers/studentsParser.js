/**
 * studentsParser.js
 * ──────────────────────────────────────────────────────────────
 * Parses Students Data Excel files.
 *
 * Expected columns (case-insensitive):
 *   - Student Name
 *   - LRN            (Learner Reference Number)
 *   - Grade Level
 *   - Section
 *   - School
 *   - School Year
 *   - Gender
 *   - Date of Birth
 *
 * Usage:
 *   import { parseStudents } from './parsers/studentsParser';
 *   const { data, errors } = parseStudents(rows, headers);
 */

export const STUDENTS_REQUIRED_HEADERS = [
  "Student Name",
  "LRN",
  "Grade Level",
  "Section",
  "School",
  "School Year",
  "Gender",
  "Date of Birth",
];

/**
 * Validates that all required headers are present.
 * @param {string[]} headers
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateStudentsHeaders(headers) {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const missing = STUDENTS_REQUIRED_HEADERS.filter(
    (req) => !normalized.includes(req.toLowerCase())
  );
  return { valid: missing.length === 0, missing };
}

/**
 * Parses and transforms student rows into structured records.
 * @param {Object[]} rows
 * @param {string[]} headers
 * @returns {{ data: Object[], errors: Object[] }}
 */
export function parseStudents(rows, headers) {
  const { valid, missing } = validateStudentsHeaders(headers);

  if (!valid) {
    throw new Error(
      `Invalid Students Template. Missing columns: ${missing.join(", ")}`
    );
  }

  const data = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    const record = {
      studentName: row["Student Name"]?.toString().trim() || "",
      lrn:         row["LRN"]?.toString().trim()          || "",
      gradeLevel:  row["Grade Level"]?.toString().trim()  || "",
      section:     row["Section"]?.toString().trim()      || "",
      school:      row["School"]?.toString().trim()       || "",
      schoolYear:  row["School Year"]?.toString().trim()  || "",
      gender:      row["Gender"]?.toString().trim()       || "",
      dateOfBirth: row["Date of Birth"]?.toString().trim()|| "",
    };

    const isEmpty = Object.values(record).every((v) => v === "");
    if (isEmpty) return;

    if (!record.studentName) {
      errors.push({ row: rowNum, field: "Student Name", message: "Missing student name" });
    }
    if (!record.lrn) {
      errors.push({ row: rowNum, field: "LRN", message: "Missing learner reference number" });
    }
    // TODO: Validate LRN format (12-digit number)
    // TODO: Validate date of birth format

    data.push(record);
  });

  return { data, errors };
}
