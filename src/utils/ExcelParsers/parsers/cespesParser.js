/**
 * cespesParser.js
 * ──────────────────────────────────────────────────────────────
 * Parser for the DepEd "CESPES" Excel format.
 *
 * The workbook has 5 sheets:
 *   1. PART I OPERATIONS
 *   2. PART I SUPPORT TO OPERATIONS
 *   3. PART I GENERAL ADMINISTRATION AND (or GERAL ...)
 *   4. PART II INDIVIDUAL PERFORMANCE
 *   5. PART III INNOVATING AND INTERVENTION (or INTERVE ...)
 *
 * Sheet names may contain typos, so we use fuzzy matching.
 */

import * as XLSX from "xlsx";

// ── Sheet name matchers ───────────────────────────────────────

const SHEET_MATCHERS = {
  operations:          (n) => /PART\s*I\b/i.test(n) && /OPERATIONS/i.test(n) && !/SUPPORT/i.test(n) && !/GENERAL/i.test(n) && !/GERAL/i.test(n),
  supportOperations:   (n) => /PART\s*I\b/i.test(n) && /SUPPORT/i.test(n),
  generalAdmin:        (n) => /PART\s*I\b/i.test(n) && (/GENERAL/i.test(n) || /GERAL/i.test(n)),
  individualPerf:      (n) => /PART\s*II\b/i.test(n) && /INDIVIDUAL/i.test(n),
  innovation:          (n) => /PART\s*III\b/i.test(n) && /INNOVAT/i.test(n),
};

export const CESPES_SHEETS = {
  OPERATIONS:         "PART I OPERATIONS",
  SUPPORT_OPERATIONS: "PART I SUPPORT TO OPERATIONS",
  GENERAL_ADMIN:      "PART I GENERAL ADMINISTRATION",
  INDIVIDUAL_PERF:    "PART II INDIVIDUAL PERFORMANCE",
  INNOVATION:         "PART III INNOVATION",
};

// ── Helpers ───────────────────────────────────────────────────

function str(val) {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function isEmptyRow(row) {
  if (!row) return true;
  return row.every((cell) => str(cell) === "");
}

function findSheet(sheetNames, matcherKey) {
  const matcher = SHEET_MATCHERS[matcherKey];
  return sheetNames.find((name) => matcher(name)) || null;
}

function getRows(workbook, sheetName) {
  if (!sheetName) return [];
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}

// ── Part I Operations Parser ──────────────────────────────────
// Structure:
//   Col 0: Program name (only present on first row of each program group)
//   Col 1: Indicator text (contains "Outcome" or "Output" prefix)
//   Col 2: 1st Sem Target
//   Col 3: 1st Sem Accomplishment
//   Col 4: 2nd Sem Target
//   Col 5: 2nd Sem Accomplishment
// Header rows: rows 0–1 are headers

function parseOperationsSheet(rows) {
  const records = [];
  const errors = [];
  let currentProgram = "";

  // Skip header rows (first 2 rows are headers)
  const dataRows = rows.slice(2);

  dataRows.forEach((row, i) => {
    if (isEmptyRow(row)) return;

    const indicator = str(row[1]);
    if (!indicator) return;

    // Track program name (col 0 only appears when it changes)
    const programCell = str(row[0]);
    if (programCell) currentProgram = programCell;

    // Detect indicator type from text
    let indicatorType = "";
    const match = indicator.match(/^(Outcome|Output)\s*-?\s*(\d+)/i);
    if (match) {
      indicatorType = `${match[1]} ${match[2]}`;
    }

    records.push({
      rowNum: i + 3,
      program: currentProgram,
      indicatorType,
      indicator,
      sem1Target: str(row[2]),
      sem1Accomplishment: str(row[3]),
      sem2Target: str(row[4]),
      sem2Accomplishment: str(row[5]),
    });
  });

  return { records, errors };
}

// ── Part I Support to Operations Parser ───────────────────────
// Structure:
//   Row 0: header row 1 (semester labels)
//   Row 1: header row 2 (column labels)
//   Row 2+: data
//   Col 0: Services/Projects/Activities
//   Col 1: Performance Indicators
//   Col 2: 1st Sem Target
//   Col 3: 1st Sem Accomplishment
//   Col 4: 2nd Sem Target
//   Col 5: 2nd Sem Accomplishment
//   Col 6: Person Involved

function parseSupportOperationsSheet(rows) {
  const records = [];
  const errors = [];
  let currentActivity = "";

  const dataRows = rows.slice(2);

  dataRows.forEach((row, i) => {
    if (isEmptyRow(row)) return;

    const indicator = str(row[1]);
    if (!indicator) return;

    const activityCell = str(row[0]);
    if (activityCell) currentActivity = activityCell;

    records.push({
      rowNum: i + 3,
      serviceActivity: currentActivity,
      indicator,
      sem1Target: str(row[2]),
      sem1Accomplishment: str(row[3]),
      sem2Target: str(row[4]),
      sem2Accomplishment: str(row[5]),
      personInvolved: str(row[6]),
    });
  });

  return { records, errors };
}

// ── Part I General Administration Parser ──────────────────────
// Same structure as Support to Operations

function parseGeneralAdminSheet(rows) {
  // Same layout as support operations
  return parseSupportOperationsSheet(rows);
}

// ── Part II Individual Performance Parser ─────────────────────
// Structure:
//   Row 0: header
//   Row 1+: data
//   Col 0: Program Output and Process Requirements
//   Col 1: Process Output
//   Col 2: Performance Indicator (Quality/Quantity/Timeliness)
//   Col 3: Target
//   Col 4: Accomplishment
//   Col 5: Rating

function parseIndividualPerformanceSheet(rows) {
  const records = [];
  const errors = [];

  const dataRows = rows.slice(1);

  dataRows.forEach((row, i) => {
    if (isEmptyRow(row)) return;

    const programOutput = str(row[0]);
    const processOutput = str(row[1]);
    const indicator = str(row[2]);

    // Must have at least one meaningful field
    if (!programOutput && !processOutput && !indicator) return;

    records.push({
      rowNum: i + 2,
      programOutput,
      processOutput,
      performanceIndicator: indicator,
      target: str(row[3]),
      accomplishment: str(row[4]),
      rating: str(row[5]),
    });
  });

  return { records, errors };
}

// ── Part III Innovation & Intervention Parser ─────────────────
// Structure:
//   Row 0: header
//   Row 1+: data
//   Col 0: Innovating and Intervening Process Output / Outcomes
//   Col 1: Quality
//   Col 2: Quantity
//   Col 3: Timeliness
//   Col 4: Average

function parseInnovationSheet(rows) {
  const records = [];
  const errors = [];

  const dataRows = rows.slice(1);

  dataRows.forEach((row, i) => {
    if (isEmptyRow(row)) return;

    const outputOutcomes = str(row[0]);
    if (!outputOutcomes) return;

    records.push({
      rowNum: i + 2,
      outputOutcomes,
      quality: str(row[1]),
      quantity: str(row[2]),
      timeliness: str(row[3]),
      average: str(row[4]),
    });
  });

  return { records, errors };
}

// ── Main entry point ──────────────────────────────────────────

export async function parseCespesFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  const names = workbook.SheetNames;

  // Resolve sheet names with fuzzy matching
  const operationsName       = findSheet(names, "operations");
  const supportOpsName       = findSheet(names, "supportOperations");
  const generalAdminName     = findSheet(names, "generalAdmin");
  const individualPerfName   = findSheet(names, "individualPerf");
  const innovationName       = findSheet(names, "innovation");

  const sheetSummary = {
    operations:        operationsName ? "found" : "missing",
    supportOperations: supportOpsName ? "found" : "missing",
    generalAdmin:      generalAdminName ? "found" : "missing",
    individualPerf:    individualPerfName ? "found" : "missing",
    innovation:        innovationName ? "found" : "missing",
  };

  const operations         = parseOperationsSheet(getRows(workbook, operationsName));
  const supportOperations  = parseSupportOperationsSheet(getRows(workbook, supportOpsName));
  const generalAdmin       = parseGeneralAdminSheet(getRows(workbook, generalAdminName));
  const individualPerformance = parseIndividualPerformanceSheet(getRows(workbook, individualPerfName));
  const innovation         = parseInnovationSheet(getRows(workbook, innovationName));

  return {
    operations,
    supportOperations,
    generalAdmin,
    individualPerformance,
    innovation,
    sheetSummary,
  };
}
