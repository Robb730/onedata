// formulaEngine.worker.js
//
// Runs entirely off the main thread. Owns one HyperFormula instance per
// open file, built from EVERY sheet in the workbook (not just the active
// tab) so that cross-sheet formulas ("=Summary!B2 + Roster!C10") resolve
// correctly, and live-recalculate as edits come in.
//
// Message protocol (all messages carry an `id` echoed back in the reply):
//   { type: "init", id, arrayBuffer }
//     -> { type: "ready", id }  |  { type: "error", id, message }
//
//   { type: "edit", id, sheet, row, col, value }
//     -> { type: "editResult", id, changes: [{ sheet, row, col, value }, ...] }
//     `changes` includes every cell whose computed value changed as a
//     result — the edited cell itself plus any dependents, on any sheet.
//
//   { type: "getSheet", id, sheet }
//     -> { type: "sheetValues", id, sheet, values: value[][] | null }
//     Full current (post-recalculation) value matrix for one sheet —
//     used when the UI opens a tab it hasn't displayed yet, so it shows
//     up-to-date numbers instead of the original file's cached ones.
//
// Row/col indices are 0-based and always relative to real cell A1 (row 0,
// col 0) — matching the convention the main thread uses everywhere else
// (see the comment in extractSheetDataFast in FileEditModal.jsx).

import { HyperFormula } from "hyperformula";
import * as XLSX from "xlsx";

let hf = null;

function buildSheetsForHF(xWorkbook) {
  const sheetsData = {};
  for (const name of xWorkbook.SheetNames) {
    const ws = xWorkbook.Sheets[name];
    if (!ws) {
      sheetsData[name] = [[null]];
      continue;
    }

    const ref = ws["!ref"];
    const range = ref
      ? XLSX.utils.decode_range(ref)
      : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
    // Force the read range to start at A1, same as the main thread's
    // extractSheetDataFast — otherwise row/col indices here won't line
    // up with the indices the UI sends on edit.
    const startRow = 0;
    const startCol = 0;

    const rows = [];
    for (let r = startRow; r <= range.e.r; r++) {
      const row = [];
      for (let c = startCol; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell) {
          row.push(null);
          continue;
        }
        if (cell.f) {
          // Leading "=" tells HyperFormula this is a formula to parse,
          // not literal text.
          row.push("=" + cell.f);
        } else if (cell.t === "n") {
          row.push(cell.v);
        } else if (cell.t === "d") {
          row.push(cell.v instanceof Date ? cell.v : new Date(cell.v));
        } else if (cell.t === "b") {
          row.push(!!cell.v);
        } else if (cell.v != null) {
          row.push(String(cell.v));
        } else {
          row.push(null);
        }
      }
      rows.push(row);
    }
    sheetsData[name] = rows.length ? rows : [[null]];
  }
  return sheetsData;
}

function changeToPlain(ch) {
  // HyperFormula's ExportedChange shape has varied slightly across
  // versions — read defensively from either the flat or nested form.
  const sheetId = ch.sheet ?? ch.address?.sheet;
  const row = ch.row ?? ch.address?.row;
  const col = ch.col ?? ch.address?.col;
  if (sheetId == null || row == null || col == null) return null;
  const sheetName = hf.getSheetName(sheetId);
  if (sheetName == null) return null;
  return { sheet: sheetName, row, col, value: ch.newValue };
}

self.onmessage = (e) => {
  const data = e.data || {};
  const { type, id } = data;

  try {
    if (type === "init") {
      const xWorkbook = XLSX.read(data.arrayBuffer, {
        type: "array",
        cellFormula: true,
        cellDates: true,
      });
      const sheetsData = buildSheetsForHF(xWorkbook);
      hf = HyperFormula.buildFromSheets(sheetsData, {
        licenseKey: "gpl-v3",
      });
      self.postMessage({ type: "ready", id });
      return;
    }

    if (!hf) {
      self.postMessage({
        type: "error",
        id,
        message: "Formula engine not initialized yet.",
      });
      return;
    }

    if (type === "edit") {
      const { sheet, row, col, value } = data;
      const sheetId = hf.getSheetId(sheet);
      if (sheetId === undefined) {
        self.postMessage({ type: "editResult", id, changes: [] });
        return;
      }
      const rawChanges = hf.setCellContents({ sheet: sheetId, row, col }, value);
      const changes = (rawChanges || [])
        .map(changeToPlain)
        .filter(Boolean);
      self.postMessage({ type: "editResult", id, changes });
      return;
    }

    if (type === "getSheet") {
      const { sheet } = data;
      const sheetId = hf.getSheetId(sheet);
      if (sheetId === undefined) {
        self.postMessage({ type: "sheetValues", id, sheet, values: null });
        return;
      }
      const values = hf.getSheetValues(sheetId);
      self.postMessage({ type: "sheetValues", id, sheet, values });
      return;
    }

    self.postMessage({ type: "error", id, message: `Unknown message type: ${type}` });
  } catch (err) {
    self.postMessage({ type: "error", id, message: err?.message || String(err) });
  }
};
