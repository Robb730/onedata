/**
 * importService.js
 * ──────────────────────────────────────────────────────────────
 * Central import service.
 *
 * Responsibilities:
 *   1. Read the uploaded Excel / CSV file using SheetJS (xlsx).
 *   2. Extract headers and rows — supports single AND multi-sheet files.
 *   3. Route to the correct parser based on the selected import type.
 *   4. Return structured { data, errors } to the UI.
 *
 * Install SheetJS if not yet installed:
 *   npm install xlsx
 *
 * Usage (single sheet — default):
 *   import { runImport, IMPORT_TYPES } from './services/importService';
 *   const result = await runImport(file, 'enrollment');
 *
 * Usage (specific sheet by name or 0-based index):
 *   const result = await runImport(file, 'enrollment', { sheet: 'Sheet2' });
 *   const result = await runImport(file, 'enrollment', { sheet: 1 });
 *
 * Usage (all sheets):
 *   import { readAllSheets } from './services/importService';
 *   const sheets = await readAllSheets(file);
 *   // sheets = [{ sheetName, headers, rows }, ...]
 */

import * as XLSX from "xlsx";

import { parseEnrollmentFile } from "../parsers/enrollmentParser";
import { parseSchools }         from "../parsers/schoolsParser";
import { parseTeachers }        from "../parsers/teachersParser";
import { parseStudents }        from "../parsers/studentsParser";

// ── Supported import types ────────────────────────────────────────────────────
//
// Two parser strategies:
//
//   strategy: "file"  → parseFile(file) handles everything internally.
//                        Used for complex multi-sheet files (e.g. enrollment).
//                        Returns: { records, errors, sheetSummary }
//
//   strategy: "rows"  → Generic: service reads the file, parser receives
//                        (rows, headers) and returns { data, errors }.
//
export const IMPORT_TYPES = {
  enrollment: {
    label:     "Enrollment Data",
    strategy:  "file",
    parseFile: parseEnrollmentFile,
  },
  schools: {
    label:    "Number of Schools",
    strategy: "rows",
    parser:   parseSchools,
  },
  teachers: {
    label:    "Teachers Data",
    strategy: "rows",
    parser:   parseTeachers,
  },
  students: {
    label:    "Students Data",
    strategy: "rows",
    parser: parseStudents,
  },
};

// ── Internal: parse ArrayBuffer into a SheetJS workbook ──────────────────────
function _readWorkbook(arrayBuffer) {
  return XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
}

// ── Internal: convert one sheet to { sheetName, headers, rows } ───────────────
function _parseSheet(workbook, sheetName) {
  const sheet   = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rawRows.length === 0) return { sheetName, headers: [], rows: [] };

  const headers = rawRows[0].map((h) => h?.toString().trim() ?? "");
  const rows    = rawRows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj;
  });

  return { sheetName, headers, rows };
}

// ── File reader (single sheet) ────────────────────────────────────────────────
/**
 * Reads one sheet from an Excel/CSV File object.
 *
 * @param {File}              file    - Uploaded file.
 * @param {{ sheet?: string|number }} [options]
 *   - sheet: sheet name (string) or 0-based index (number). Defaults to 0.
 * @returns {Promise<{ sheetName: string, headers: string[], rows: Object[] }>}
 */
export async function readExcelFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = _readWorkbook(e.target.result);

        // Resolve which sheet to read
        const { sheet = 0 } = options;
        let targetName;

        if (typeof sheet === "string") {
          if (!workbook.SheetNames.includes(sheet)) {
            return reject(new Error(
              `Sheet "${sheet}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`
            ));
          }
          targetName = sheet;
        } else {
          // numeric index
          if (sheet >= workbook.SheetNames.length) {
            return reject(new Error(
              `Sheet index ${sheet} out of range. File has ${workbook.SheetNames.length} sheet(s).`
            ));
          }
          targetName = workbook.SheetNames[sheet];
        }

        const result = _parseSheet(workbook, targetName);

        if (result.headers.length === 0) {
          return reject(new Error(`Sheet "${targetName}" is empty.`));
        }

        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to read file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsArrayBuffer(file);
  });
}

// ── Read ALL sheets ───────────────────────────────────────────────────────────
/**
 * Reads every sheet in an Excel file.
 *
 * @param {File} file
 * @returns {Promise<Array<{ sheetName: string, headers: string[], rows: Object[] }>>}
 *
 * @example
 *   const sheets = await readAllSheets(file);
 *   sheets.forEach(({ sheetName, headers, rows }) => {
 *     console.log(sheetName, rows.length);
 *   });
 */
export async function readAllSheets(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = _readWorkbook(e.target.result);
        const sheets   = workbook.SheetNames.map((name) => _parseSheet(workbook, name));
        resolve(sheets);
      } catch (err) {
        reject(new Error(`Failed to read file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsArrayBuffer(file);
  });
}

// ── Main orchestrator ─────────────────────────────────────────────────────────
/**
 * Reads the file and runs the appropriate parser.
 *
 * Dispatches based on the import type's strategy:
 *   - "file" strategy: calls parseFile(file) directly (e.g. enrollment).
 *   - "rows" strategy: reads the file generically, then calls parser(rows, headers).
 *
 * @param {File}   file       - Uploaded File object.
 * @param {string} importType - Key from IMPORT_TYPES (e.g. "enrollment").
 * @param {{ sheet?: string|number }} [options] - Only used by "rows" strategy.
 * @returns {Promise<Object>}
 *   "file" strategy → { records, errors, sheetSummary }
 *   "rows" strategy → { sheetName, data, errors, headers }
 */
export async function runImport(file, importType, options = {}) {
  const config = IMPORT_TYPES[importType];
  if (!config) {
    throw new Error(`Unknown import type: "${importType}"`);
  }

  // ── File-level parsers (handle multi-sheet / complex formats) ──
  if (config.strategy === "file") {
    return config.parseFile(file);
  }

  // ── Generic row-level parsers ──────────────────────────────────
  const { sheetName, headers, rows } = await readExcelFile(file, options);
  const { data, errors }             = config.parser(rows, headers);
  return { sheetName, data, errors, headers };
}
