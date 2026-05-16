/**
 * schoolsParser.js
 * ──────────────────────────────────────────────────────────────
 * Parses "Number of Schools" Excel files.
 *
 * Expected columns (case-insensitive):
 *   - School Name
 *   - School ID
 *   - District
 *   - Municipality
 *   - School Level   (Elementary / Junior High / Senior High)
 *   - School Year
 *
 * Usage:
 *   import { parseSchools } from './parsers/schoolsParser';
 *   const { data, errors } = parseSchools(rows, headers);
 */

export const SCHOOLS_REQUIRED_HEADERS = [
  "School Name",
  "School ID",
  "District",
  "Municipality",
  "School Level",
  "School Year",
];

/**
 * Validates that all required headers are present.
 * @param {string[]} headers
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateSchoolsHeaders(headers) {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const missing = SCHOOLS_REQUIRED_HEADERS.filter(
    (req) => !normalized.includes(req.toLowerCase())
  );
  return { valid: missing.length === 0, missing };
}

/**
 * Parses and transforms schools rows into structured records.
 * @param {Object[]} rows
 * @param {string[]} headers
 * @returns {{ data: Object[], errors: Object[] }}
 */
export function parseSchools(rows, headers) {
  const { valid, missing } = validateSchoolsHeaders(headers);

  if (!valid) {
    throw new Error(
      `Invalid Schools Template. Missing columns: ${missing.join(", ")}`
    );
  }

  const data = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    const record = {
      schoolName:  row["School Name"]?.toString().trim()  || "",
      schoolId:    row["School ID"]?.toString().trim()    || "",
      district:    row["District"]?.toString().trim()     || "",
      municipality: row["Municipality"]?.toString().trim() || "",
      schoolLevel: row["School Level"]?.toString().trim() || "",
      schoolYear:  row["School Year"]?.toString().trim()  || "",
    };

    const isEmpty = Object.values(record).every((v) => v === "");
    if (isEmpty) return;

    if (!record.schoolName) {
      errors.push({ row: rowNum, field: "School Name", message: "Missing school name" });
    }
    if (!record.schoolId) {
      errors.push({ row: rowNum, field: "School ID", message: "Missing school ID" });
    }

    data.push(record);
  });

  return { data, errors };
}
