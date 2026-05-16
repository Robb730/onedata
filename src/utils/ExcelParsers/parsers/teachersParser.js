/**
 * teachersParser.js
 * ──────────────────────────────────────────────────────────────
 * Parses Teachers Data Excel files.
 *
 * Expected columns (case-insensitive):
 *   - Teacher Name
 *   - Employee ID
 *   - Position
 *   - School
 *   - District
 *   - School Year
 *   - Gender
 *
 * Usage:
 *   import { parseTeachers } from './parsers/teachersParser';
 *   const { data, errors } = parseTeachers(rows, headers);
 */

export const TEACHERS_REQUIRED_HEADERS = [
  "Teacher Name",
  "Employee ID",
  "Position",
  "School",
  "District",
  "School Year",
  "Gender",
];

/**
 * Validates that all required headers are present.
 * @param {string[]} headers
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateTeachersHeaders(headers) {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const missing = TEACHERS_REQUIRED_HEADERS.filter(
    (req) => !normalized.includes(req.toLowerCase())
  );
  return { valid: missing.length === 0, missing };
}

/**
 * Parses and transforms teacher rows into structured records.
 * @param {Object[]} rows
 * @param {string[]} headers
 * @returns {{ data: Object[], errors: Object[] }}
 */
export function parseTeachers(rows, headers) {
  const { valid, missing } = validateTeachersHeaders(headers);

  if (!valid) {
    throw new Error(
      `Invalid Teachers Template. Missing columns: ${missing.join(", ")}`
    );
  }

  const data = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    const record = {
      teacherName: row["Teacher Name"]?.toString().trim() || "",
      employeeId:  row["Employee ID"]?.toString().trim()  || "",
      position:    row["Position"]?.toString().trim()     || "",
      school:      row["School"]?.toString().trim()       || "",
      district:    row["District"]?.toString().trim()     || "",
      schoolYear:  row["School Year"]?.toString().trim()  || "",
      gender:      row["Gender"]?.toString().trim()       || "",
    };

    const isEmpty = Object.values(record).every((v) => v === "");
    if (isEmpty) return;

    if (!record.teacherName) {
      errors.push({ row: rowNum, field: "Teacher Name", message: "Missing teacher name" });
    }
    if (!record.employeeId) {
      errors.push({ row: rowNum, field: "Employee ID", message: "Missing employee ID" });
    }

    data.push(record);
  });

  return { data, errors };
}
