/**
 * enrollmentParser.js
 * ──────────────────────────────────────────────────────────────
 * Purpose-built parser for the DepEd Baliwag SDO "LATEST ENROLLMENT.xlsx"
 * format.
 *
 * File structure:
 *   - 2 Sheets: "PUBLIC" and "PRIVATE"
 *   - 6 header rows (merged cells across row 1–6)
 *   - Data rows start at row 7 (index 6)
 *   - 100 columns (col 0–99)
 *
 * Each data row = one school's full enrollment breakdown with M/F counts
 * across all grade levels and SHS tracks.
 *
 * Column map (0-indexed):
 *   [0]       → Row #
 *   [1]       → "SCHOOL_ID - School Name"
 *   [2]       → Type (Public / Private / LUC/SUC)
 *
 *   Elementary (col 3–24):
 *     Kinder      [3]=M  [4]=F
 *     Grade 1     [5]=M  [6]=F
 *     Grade 2     [7]=M  [8]=F
 *     Grade 3     [9]=M  [10]=F
 *     Sub G1-G3   [11]=M [12]=F
 *     Grade 4     [13]=M [14]=F
 *     Grade 5     [15]=M [16]=F
 *     Grade 6     [17]=M [18]=F
 *     Sub G4-G6   [19]=M [20]=F
 *     Non-Graded  [21]=M [22]=F
 *     TOTAL       [23]=M [24]=F
 *
 *   Junior High School (col 25–38):
 *     Grade 7     [25]=M [26]=F
 *     Grade 8     [27]=M [28]=F
 *     Grade 9     [29]=M [30]=F
 *     Grade 10    [31]=M [32]=F
 *     Sub G7-G10  [33]=M [34]=F
 *     Non-Graded  [35]=M [36]=F
 *     TOTAL       [37]=M [38]=F
 *
 *   Senior High — 1st Semester (col 39–68):
 *     Grade 11:
 *       ACAD      [39]=M [40]=F
 *       TVL       [41]=M [42]=F
 *       SPORTS    [43]=M [44]=F
 *       ARTS      [45]=M [46]=F
 *       UNIQUE    [47]=M [48]=F
 *       ACAD-SSHS [49]=M [50]=F
 *       TECHPRO   [51]=M [52]=F
 *     Grade 12:
 *       ACAD      [53]=M [54]=F
 *       TVL       [55]=M [56]=F
 *       SPORTS    [57]=M [58]=F
 *       ARTS      [59]=M [60]=F
 *       UNIQUE    [61]=M [62]=F
 *       ACAD-SSHS [63]=M [64]=F
 *       TECHPRO   [65]=M [66]=F
 *     TOTAL S1    [67]=M [68]=F
 *
 *   Senior High — 2nd Semester (col 69–98):
 *     (same layout as 1st Semester, offset by +30)
 *     TOTAL S2    [97]=M [98]=F
 *
 *   [99] → Grand Total (M+F combined)
 *
 * Usage:
 *   import { parseEnrollmentFile } from './parsers/enrollmentParser';
 *   const { records, errors } = await parseEnrollmentFile(file);
 */

import * as XLSX from "xlsx";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Number of header rows to skip before data rows begin. */
const HEADER_ROW_COUNT = 6;

/** Sheets to parse in order. */
export const ENROLLMENT_SHEETS = ["PUBLIC", "PRIVATE"];

// ── Column index helpers ──────────────────────────────────────────────────────

/** Returns { m, f } object from a raw row array given the Male column index. */
function mf(row, mIdx) {
  return {
    m: Number(row[mIdx])   || 0,
    f: Number(row[mIdx + 1]) || 0,
  };
}

// ── School ID / Name parser ───────────────────────────────────────────────────

/**
 * Splits "401818 - ACLC College of Poblacion, Baliuag" into
 * { schoolId: "401818", schoolName: "ACLC College of Poblacion, Baliuag" }
 */
function parseSchoolCell(raw) {
  if (!raw) return { schoolId: "", schoolName: "" };
  const str   = String(raw).trim();
  const dash  = str.indexOf(" - ");
  if (dash === -1) return { schoolId: "", schoolName: str };
  return {
    schoolId:   str.slice(0, dash).trim(),
    schoolName: str.slice(dash + 3).trim(),
  };
}

// ── Row parser ────────────────────────────────────────────────────────────────

/**
 * Transforms one raw data row array into a structured enrollment record.
 *
 * @param {Array}  row       - Raw cell values (length 100).
 * @param {string} sheet     - "PUBLIC" or "PRIVATE".
 * @param {number} rowIndex  - 0-based index within data rows (for error reporting).
 * @returns {{ record: Object, rowErrors: Object[] }}
 */
function parseRow(row, sheet, rowIndex) {
  const rowNum   = rowIndex + HEADER_ROW_COUNT + 1; // 1-based Excel row number
  const rowErrors = [];

  const { schoolId, schoolName } = parseSchoolCell(row[1]);
  const schoolType = String(row[2] ?? "").trim();

  if (!schoolName) {
    rowErrors.push({ row: rowNum, field: "School Name", message: "Missing school name" });
  }

  const record = {
    // ── Identity ──────────────────────────────────────────────────────────
    sheet,
    rowNum,
    schoolId,
    schoolName,
    schoolType,   // "Public" | "Private" | "LUC/SUC"

    // ── Elementary ────────────────────────────────────────────────────────
    elementary: {
      kinder:       mf(row, 3),
      grade1:       mf(row, 5),
      grade2:       mf(row, 7),
      grade3:       mf(row, 9),
      subG1G3:      mf(row, 11),
      grade4:       mf(row, 13),
      grade5:       mf(row, 15),
      grade6:       mf(row, 17),
      subG4G6:      mf(row, 19),
      nonGraded:    mf(row, 21),
      total:        mf(row, 23),
    },

    // ── Junior High School ────────────────────────────────────────────────
    juniorHigh: {
      grade7:       mf(row, 25),
      grade8:       mf(row, 27),
      grade9:       mf(row, 29),
      grade10:      mf(row, 31),
      subG7G10:     mf(row, 33),
      nonGraded:    mf(row, 35),
      total:        mf(row, 37),
    },

    // ── Senior High — 1st Semester ────────────────────────────────────────
    seniorHighS1: {
      grade11: {
        acad:       mf(row, 39),
        tvl:        mf(row, 41),
        sports:     mf(row, 43),
        arts:       mf(row, 45),
        unique:     mf(row, 47),
        acadSshs:   mf(row, 49),
        techpro:    mf(row, 51),
      },
      grade12: {
        acad:       mf(row, 53),
        tvl:        mf(row, 55),
        sports:     mf(row, 57),
        arts:       mf(row, 59),
        unique:     mf(row, 61),
        acadSshs:   mf(row, 63),
        techpro:    mf(row, 65),
      },
      total:        mf(row, 67),
    },

    // ── Senior High — 2nd Semester ────────────────────────────────────────
    seniorHighS2: {
      grade11: {
        acad:       mf(row, 69),
        tvl:        mf(row, 71),
        sports:     mf(row, 73),
        arts:       mf(row, 75),
        unique:     mf(row, 77),
        acadSshs:   mf(row, 79),
        techpro:    mf(row, 81),
      },
      grade12: {
        acad:       mf(row, 83),
        tvl:        mf(row, 85),
        sports:     mf(row, 87),
        arts:       mf(row, 89),
        unique:     mf(row, 91),
        acadSshs:   mf(row, 93),
        techpro:    mf(row, 95),
      },
      total:        mf(row, 97),
    },

    // ── Grand Total ───────────────────────────────────────────────────────
    grandTotal: Number(row[99]) || 0,
  };

  return { record, rowErrors };
}

// ── Sheet parser ──────────────────────────────────────────────────────────────

/**
 * Parses all data rows from one sheet.
 *
 * @param {Array[]}  allRows  - All rows from XLSX.utils.sheet_to_json (header:1).
 * @param {string}   sheet    - Sheet name ("PUBLIC" or "PRIVATE").
 * @returns {{ records: Object[], errors: Object[] }}
 */
function parseSheet(allRows, sheet) {
  const dataRows = allRows.slice(HEADER_ROW_COUNT);
  const records  = [];
  const errors   = [];

  dataRows.forEach((row, i) => {
    // Skip completely empty rows or summary/total rows (col[0] is not a number)
    const rowNum = row[0];
    if (rowNum === "" || rowNum === null || rowNum === undefined) return;
    if (typeof rowNum !== "number" && isNaN(Number(rowNum)))     return;

    const { record, rowErrors } = parseRow(row, sheet, i);
    records.push(record);
    if (rowErrors.length) errors.push(...rowErrors);
  });

  return { records, errors };
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Reads an enrollment Excel File object and parses both PUBLIC and PRIVATE sheets.
 *
 * @param {File} file - The uploaded .xlsx file.
 * @returns {Promise<{
 *   records: Object[],   // all school records from both sheets
 *   errors:  Object[],   // row-level validation errors
 *   sheetSummary: { sheet: string, count: number }[]
 * }>}
 *
 * @example
 *   import { parseEnrollmentFile } from '@/utils/ExcelParsers/parsers/enrollmentParser';
 *   const { records, errors } = await parseEnrollmentFile(file);
 *   // records[0] = {
 *   //   sheet: "PRIVATE",
 *   //   schoolId: "401818",
 *   //   schoolName: "ACLC College of Poblacion, Baliuag",
 *   //   schoolType: "Private",
 *   //   elementary: { kinder:{m,f}, grade1:{m,f}, ..., total:{m,f} },
 *   //   juniorHigh: { grade7:{m,f}, ..., total:{m,f} },
 *   //   seniorHighS1: { grade11:{acad,tvl,...}, grade12:{...}, total:{m,f} },
 *   //   seniorHighS2: { ... },
 *   //   grandTotal: 609
 *   // }
 */
export async function parseEnrollmentFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: "array" });

        // Validate that expected sheets exist
        const availableSheets = workbook.SheetNames;
        const missingSheets   = ENROLLMENT_SHEETS.filter(
          (s) => !availableSheets.includes(s)
        );
        if (missingSheets.length === availableSheets.length) {
          return reject(new Error(
            `Invalid Enrollment file. Expected sheets: ${ENROLLMENT_SHEETS.join(", ")}. ` +
            `Found: ${availableSheets.join(", ")}`
          ));
        }

        const allRecords     = [];
        const allErrors      = [];
        const sheetSummary   = [];

        for (const sheetName of ENROLLMENT_SHEETS) {
          if (!availableSheets.includes(sheetName)) continue;

          const ws      = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          const { records, errors } = parseSheet(rawRows, sheetName);

          allRecords.push(...records);
          allErrors.push(...errors);
          sheetSummary.push({ sheet: sheetName, count: records.length });
        }

        resolve({ records: allRecords, errors: allErrors, sheetSummary });
      } catch (err) {
        reject(new Error(`Failed to parse enrollment file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsArrayBuffer(file);
  });
}

// ── Convenience: totals aggregator ───────────────────────────────────────────

/**
 * Sums up enrollment totals across all records for quick dashboard display.
 *
 * @param {Object[]} records - Output from parseEnrollmentFile().
 * @returns {{
 *   totalSchools: number,
 *   elementary:   { m: number, f: number },
 *   juniorHigh:   { m: number, f: number },
 *   seniorHighS1: { m: number, f: number },
 *   seniorHighS2: { m: number, f: number },
 *   grandTotal:   number
 * }}
 */
export function aggregateEnrollmentTotals(records) {
  const sum = (key, sub = "total") =>
    records.reduce(
      (acc, r) => ({
        m: acc.m + (r[key]?.[sub]?.m ?? 0),
        f: acc.f + (r[key]?.[sub]?.f ?? 0),
      }),
      { m: 0, f: 0 }
    );

  return {
    totalSchools:  records.length,
    elementary:    sum("elementary"),
    juniorHigh:    sum("juniorHigh"),
    seniorHighS1:  sum("seniorHighS1"),
    seniorHighS2:  sum("seniorHighS2"),
    grandTotal:    records.reduce((a, r) => a + r.grandTotal, 0),
  };
}
