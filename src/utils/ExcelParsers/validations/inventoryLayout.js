/**
 * inventoryLayout.js
 * ──────────────────────────────────────────────────────────────
 * Shared layout validation for the DepEd "FE 2027" inventory
 * workbooks (Classrooms / Seats / Teachers / Textbooks).
 *
 * All four workbooks ship with the same sheet structure — DB, KES,
 * JHS, SHS, Status — so the "does this sheet look like a
 * masterlist?" check used to be copy-pasted into every parser. It
 * lives here now so a fix applies to all four at once.
 *
 * Why the tolerance exists
 * ────────────────────────
 * The official "Textbooks Inventory FE 2027" template has a typo in
 * its SHS sheet: cell D7 is labelled "Dvision" instead of
 * "Division". The parsers read that header to confirm the sheet is
 * laid out as expected, and an exact string comparison rejected the
 * entire workbook over that single missing character — the file
 * uploaded and parsed perfectly otherwise.
 *
 * We therefore accept any header within a small edit distance of
 * "division". That covers the known typo (and near-variants such as
 * "Divison" / "Divisions") while still rejecting a genuinely
 * misaligned sheet.
 */

// The label we expect for the division column.
const DIVISION_LABEL = "division";

// Column the division header is expected to sit in (0-indexed).
const DIVISION_COLUMN = 3;

// How many single-character edits are tolerated between the header
// text and "division". "dvision" is exactly 1 edit away.
const MAX_EDIT_DISTANCE = 1;

// How many rows from the top of a sheet to scan for the header.
const HEADER_BAND_ROWS = 15;

/**
 * Levenshtein distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number} Number of single-character edits to turn a into b.
 */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }

  return prev[b.length];
}

/**
 * True when the given header text is a plausible "Division" label.
 *
 * Accepts the exact label plus anything within
 * MAX_EDIT_DISTANCE single-character edits of it — which covers the
 * "Dvision" typo present in the official Textbooks template.
 *
 * @param {unknown} text
 * @returns {boolean}
 */
export function isDivisionHeader(text) {
  const t = String(text ?? "")
    .trim()
    .toLowerCase();
  if (!t) return false;
  if (t === DIVISION_LABEL) return true;
  return editDistance(t, DIVISION_LABEL) <= MAX_EDIT_DISTANCE;
}

/**
 * Index of the division column in a sheet's header band, or -1 when
 * it cannot be found.
 *
 * @param {Object[][]} rows
 * @param {{ column?: number, maxRows?: number }} [options]
 * @returns {number}
 */
export function findDivisionColumn(
  rows,
  { column = DIVISION_COLUMN, maxRows = HEADER_BAND_ROWS } = {},
) {
  if (!Array.isArray(rows)) return -1;
  const limit = Math.min(rows.length, maxRows);
  for (let i = 0; i < limit; i += 1) {
    const row = rows[i] || [];
    if (isDivisionHeader(row[column])) return column;
  }
  return -1;
}

/**
 * Throws when a sheet does not carry a recognisable Division header.
 *
 * @param {Object[][]} rows
 * @param {string} sheetName
 * @param {{ column?: number, maxRows?: number }} [options]
 * @throws {Error} When the layout is not recognised.
 */
export function assertInventorySheetLayout(
  rows,
  sheetName,
  { column = DIVISION_COLUMN, maxRows = HEADER_BAND_ROWS } = {},
) {
  if (findDivisionColumn(rows, { column, maxRows }) === -1) {
    throw new Error(
      `Invalid layout in sheet "${sheetName}". Columns appear to be missing or shifted.`,
    );
  }
}
