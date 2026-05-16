/**
 * validateRows.js
 * ──────────────────────────────────────────────────────────────
 * Shared row-level validation utilities used across all parsers.
 *
 * Usage:
 *   import { isEmptyRow, validateRequiredField } from '../validations/validateRows';
 */

/**
 * Checks if a parsed row object is entirely empty.
 * @param {Object} record - Flat key-value object representing one row.
 * @returns {boolean}
 */
export function isEmptyRow(record) {
  return Object.values(record).every(
    (v) => v === null || v === undefined || v.toString().trim() === ""
  );
}

/**
 * Validates that a required field is not empty.
 * Returns an error object if the field is empty, otherwise null.
 *
 * @param {number} rowNum   - 1-indexed row number (including header = row 1).
 * @param {string} field    - Column/field name.
 * @param {string} value    - Field value to validate.
 * @returns {{ row: number, field: string, message: string } | null}
 */
export function validateRequiredField(rowNum, field, value) {
  if (!value || value.toString().trim() === "") {
    return { row: rowNum, field, message: `${field} is required` };
  }
  return null;
}

/**
 * Validates that a numeric field contains a valid number.
 * @param {number} rowNum
 * @param {string} field
 * @param {string|number} value
 * @returns {{ row: number, field: string, message: string } | null}
 */
export function validateNumericField(rowNum, field, value) {
  if (value === "" || value === null || value === undefined) return null; // handled by required check
  if (isNaN(Number(value))) {
    return { row: rowNum, field, message: `${field} must be a number (got: "${value}")` };
  }
  return null;
}

/**
 * Validates a school year string in the format YYYY-YYYY.
 * @param {number} rowNum
 * @param {string} value
 * @returns {{ row: number, field: string, message: string } | null}
 */
export function validateSchoolYear(rowNum, value) {
  const pattern = /^\d{4}-\d{4}$/;
  if (value && !pattern.test(value.toString().trim())) {
    return {
      row: rowNum,
      field: "School Year",
      message: `School Year must be in YYYY-YYYY format (got: "${value}")`,
    };
  }
  return null;
}

/**
 * Collects non-null error results from a list of validators.
 * @param {...(Object|null)} results
 * @returns {Object[]}
 */
export function collectErrors(...results) {
  return results.filter(Boolean);
}
