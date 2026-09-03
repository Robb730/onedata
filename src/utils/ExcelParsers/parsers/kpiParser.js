/**
 * kpiParser.js
 * ──────────────────────────────────────────────────────────────
 * Parses the 31-sheet Performance Indicators Excel file.
 * Looks for rows belonging to "City of Baliwag" and extracts the
 * Total, Male, and Female rows, alongside their headers.
 */

import * as XLSX from "xlsx";
import { collectErrors } from "../validations/validateRows";

export const KPI_SHEETS = [
  // List of all sheet names is not strictly needed for the file parser 
  // since we iterate through workbook.SheetNames dynamically.
];

export async function parseKpiFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
        const errors = [];
        const records = [];

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

          if (rawRows.length > 0) {
            const row0 = rawRows[0] || [];
            if (!String(row0[0] || "").toUpperCase().includes("DEPARTMENT OF EDUCATION")) {
              throw new Error(`Invalid layout in sheet "${sheetName}". Columns appear to be missing or shifted.`);
            }
          }

          let baliwagTotalRowIdx = -1;
          let headers1 = [];
          let headers2 = [];

          // 1. Identify header rows
          let headerIdx = -1;
          for (let i = 0; i < Math.min(10, rawRows.length); i++) {
            const row = rawRows[i];
            if (
              row &&
              row[0] &&
              (row[0].toString().includes("Division") ||
                row[0].toString().includes("City") ||
                row[0].toString().includes("Region"))
            ) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx !== -1) {
            headers1 = rawRows[headerIdx] || [];
            headers2 = rawRows[headerIdx + 1] || [];
          }

          // 2. Find the row for City of Baliwag
          for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (row && row[0] && row[0].toString().toLowerCase().includes("baliwag")) {
              baliwagTotalRowIdx = i;
              break;
            }
          }

          if (baliwagTotalRowIdx !== -1) {
            const totalRow = rawRows[baliwagTotalRowIdx] || [];
            const maleRow = rawRows[baliwagTotalRowIdx + 1] || [];
            const femaleRow = rawRows[baliwagTotalRowIdx + 2] || [];

            records.push({
              sheetName,
              headersMain: headers1,
              headersSub: headers2,
              totalRow,
              maleRow,
              femaleRow,
            });
          } else {
            errors.push({
              sheet: sheetName,
              row: "N/A",
              message: `'City of Baliwag' row not found.`,
            });
          }
        });

        if (records.length === 0) {
          return reject(new Error(`Invalid Performance Indicators file. No valid data found for City of Baliwag.`));
        }

        resolve({ records, errors });
      } catch (err) {
        reject(new Error(`Failed to read Performance Indicators file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsArrayBuffer(file);
  });
}
