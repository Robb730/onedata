/**
 * validateHeaders.js
 * ──────────────────────────────────────────────────────────────
 * Shared header validation utility used across all parsers.
 *
 * Usage:
 *   import { checkRequiredHeaders } from '../validations/validateHeaders';
 *   const { valid, missing } = checkRequiredHeaders(headers, REQUIRED);
 */

/**
 * Checks that all required headers are present in the uploaded file.
 * Comparison is case-insensitive and trims whitespace.
 *
 * @param {string[]} actualHeaders   - Headers extracted from the Excel file.
 * @param {string[]} requiredHeaders - List of required column names.
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function checkRequiredHeaders(actualHeaders, requiredHeaders) {
  const normalized = actualHeaders.map((h) => h.trim().toLowerCase());
  const missing = requiredHeaders.filter(
    (req) => !normalized.includes(req.toLowerCase())
  );
  return { valid: missing.length === 0, missing };
}

/**
 * Builds a user-friendly error message for missing headers.
 * @param {string[]} missing
 * @param {string}   templateName
 * @returns {string}
 */
export function buildHeaderErrorMessage(missing, templateName) {
  return `Invalid ${templateName} Template. Missing columns: ${missing.join(", ")}`;
}
