/**
 * inventoryTypeGuard.js
 * ──────────────────────────────────────────────────────────────
 * Guards the four DepEd "inventory" Excel templates against
 * cross-type uploads.
 *
 * The Classrooms / Seats / Teachers / Textbooks workbooks all ship
 * with the SAME sheet names (DB, KES, JHS, SHS, Status) and the same
 * loose "Division" layout check, so a Classrooms file uploaded with
 * the "Teachers Inventory" upload type used to sail through every
 * parser and get written into the teachers_* tables using teacher
 * column offsets applied to classroom columns — silent data
 * corruption.
 *
 * This module identifies which inventory type a workbook ACTUALLY is
 * by reading the type-specific header labels, and refuses the parse
 * when the detected type does not match the declared one.
 *
 * How detection works
 * ───────────────────
 *   1. Collect every header-band string (rows 0-9) from the KES,
 *      JHS and SHS sheets — the sheets that actually describe the
 *      inventory being tracked. The DB sheet is skipped on purpose:
 *      it is the shared national school masterlist and is byte-for-byte
 *      identical across all four workbooks, so it carries no signal.
 *   2. Score each inventory type against those strings.
 *        STRONG signal (2 pts) — "<resource> inventory", "<resource>
 *          requirements", "inventory of <resource>".
 *        WEAK   signal (1 pt)  — "no. of <resource>".
 *      Strong signals outrank weak ones so an incidental mention
 *      (e.g. a "Seat Capacity" column inside the Classrooms file)
 *      can never outvote the file's own title/header labels.
 *   3. The highest score wins. If that winner is not the declared
 *      type, the file is rejected.
 *
 * Safety rule
 * ───────────
 * The guard blocks ONLY when it positively identifies a DIFFERENT
 * inventory type. When no type can be recognised (score 0 for every
 * candidate) the file is allowed through and the parsers' existing
 * sheet/layout checks remain the only gate. That way a legitimate
 * template with an unexpected signature is never falsely rejected.
 *
 * Usage:
 *   import { assertInventoryFileType } from '../validations/inventoryTypeGuard';
 *   const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
 *   assertInventoryFileType(workbook, "classrooms");
 */

import * as XLSX from "xlsx";

// ── Inventory type registry ───────────────────────────────────────────────────

export const INVENTORY_TYPES = {
  classrooms: {
    label: "Classrooms Inventory",
    resource: "classrooms?",
    strong: [
      /\bclassrooms?\s+(inventory|requirements)\b/i,
      /\binventory\s+of\s+classrooms?\b/i,
    ],
    weak: [/\bno\.?\s*of\s+classrooms?\b/i],
  },
  seats: {
    label: "Seats Inventory",
    resource: "seats?",
    strong: [
      /\bseats?\s+(inventory|requirements)\b/i,
      /\binventory\s+of\s+seats?\b/i,
    ],
    weak: [/\bno\.?\s*of\s+seats?\b/i],
  },
  teachers_inventory: {
    label: "Teachers Inventory",
    resource: "teachers?",
    strong: [
      /\bteachers?\s+(inventory|requirements)\b/i,
      /\binventory\s+of\s+teachers?\b/i,
    ],
    weak: [/\bno\.?\s*of\s+teachers?\b/i],
  },
  textbook_inventory: {
    label: "Textbooks Inventory",
    resource: "textbooks?",
    strong: [
      /\btextbooks?\s+(inventory|requirements)\b/i,
      /\binventory\s+of\s+textbooks?\b/i,
    ],
    weak: [/\bno\.?\s*of\s+textbooks?\b/i],
  },
};

// Sheets that carry the type-specific headers, in priority order.
const SIGNAL_SHEETS = ["KES", "JHS", "SHS"];

// How many rows from the top of a sheet to treat as the header band.
const HEADER_BAND_ROWS = 10;

const STRONG_POINTS = 2;
const WEAK_POINTS = 1;

// ── Internals ────────────────────────────────────────────────────────────────

function readSheetRows(workbook, sheetName) {
  const sheet = workbook?.Sheets?.[sheetName];
  if (!sheet) return null;
  try {
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  } catch {
    return null;
  }
}

/**
 * Finds a sheet by name, case-insensitively. The DepEd workbooks ship
 * the inventory sheets as exactly "KES" / "JHS" / "SHS", but matching
 * loosely costs nothing and keeps the guard working if a file is
 * re-saved with different casing.
 */
function findSheet(workbook, wanted) {
  const names = workbook?.SheetNames || [];
  const direct = names.find((n) => n === wanted);
  if (direct) return direct;
  return names.find((n) => n.toLowerCase() === wanted.toLowerCase()) || null;
}

/**
 * Collects every non-empty string in the header band of the given
 * sheets. Falls back to scanning every sheet when none of the
 * inventory sheets are present.
 */
function collectHeaderStrings(workbook) {
  const strings = [];
  let matchedSheets = 0;

  for (const wanted of SIGNAL_SHEETS) {
    const sheetName = findSheet(workbook, wanted);
    if (!sheetName) continue;
    const rows = readSheetRows(workbook, sheetName);
    if (!rows) continue;
    matchedSheets += 1;

    for (let i = 0; i < Math.min(rows.length, HEADER_BAND_ROWS); i += 1) {
      const row = rows[i] || [];
      for (const cell of row) {
        if (cell === null || cell === undefined) continue;
        const text = String(cell).trim();
        if (text) strings.push(text);
      }
    }
  }

  // No inventory sheets found — scan the whole workbook's header bands
  // so a differently-structured file still gets a chance to be typed.
  if (matchedSheets === 0) {
    for (const sheetName of workbook?.SheetNames || []) {
      const rows = readSheetRows(workbook, sheetName);
      if (!rows) continue;
      for (let i = 0; i < Math.min(rows.length, HEADER_BAND_ROWS); i += 1) {
        const row = rows[i] || [];
        for (const cell of row) {
          if (cell === null || cell === undefined) continue;
          const text = String(cell).trim();
          if (text) strings.push(text);
        }
      }
    }
  }

  return strings;
}

function scoreType(strings, spec) {
  let score = 0;
  const matches = [];

  for (const text of strings) {
    let hit = false;
    for (const pattern of spec.strong) {
      if (pattern.test(text)) {
        score += STRONG_POINTS;
        matches.push(text);
        hit = true;
        break;
      }
    }
    if (hit) continue;
    for (const pattern of spec.weak) {
      if (pattern.test(text)) {
        score += WEAK_POINTS;
        matches.push(text);
        break;
      }
    }
  }

  return { score, matches };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Identifies which inventory type a workbook is.
 *
 * @param {Object} workbook - A SheetJS workbook (already read).
 * @returns {{ type: string|null, label: string|null, score: number,
 *             scores: Record<string, number>, matches: string[] }}
 *   `type` is null when no inventory type could be identified.
 */
export function detectInventoryType(workbook) {
  const strings = collectHeaderStrings(workbook);
  const scores = {};
  const matches = {};
  let bestType = null;
  let bestScore = 0;

  for (const [key, spec] of Object.entries(INVENTORY_TYPES)) {
    const { score, matches: found } = scoreType(strings, spec);
    scores[key] = score;
    matches[key] = found;
    if (score > bestScore) {
      bestScore = score;
      bestType = key;
    }
  }

  return {
    type: bestType,
    label: bestType ? INVENTORY_TYPES[bestType].label : null,
    score: bestScore,
    scores,
    matches: bestType ? matches[bestType] : [],
  };
}

/**
 * Throws when the workbook is a recognisable inventory file of a type
 * OTHER than the one the caller declared.
 *
 * Never throws when the type cannot be identified — the caller's own
 * sheet/layout checks remain in charge in that case.
 *
 * @param {Object} workbook      - A SheetJS workbook (already read).
 * @param {string} expectedType  - One of the keys of INVENTORY_TYPES.
 * @param {string} [expectedLabel] - Human-readable label override.
 * @throws {Error} When a different inventory type is detected.
 */
export function assertInventoryFileType(workbook, expectedType, expectedLabel) {
  const spec = INVENTORY_TYPES[expectedType];
  if (!spec) return;

  const detection = detectInventoryType(workbook);
  if (!detection.type || detection.type === expectedType) return;

  const expectedName = expectedLabel || spec.label;
  const detectedName = INVENTORY_TYPES[detection.type].label;

  const error = new Error(
    `Detected file type: ${detectedName}. Please select the matching upload type.`,
  );
  error.code = "INVENTORY_TYPE_MISMATCH";
  error.expectedType = expectedType;
  error.detectedType = detection.type;
  error.detectedLabel = detectedName;
  error.expectedLabel = expectedName;
  throw error;
}
