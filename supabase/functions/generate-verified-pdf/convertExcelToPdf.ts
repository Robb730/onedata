import * as XLSX from "npm:xlsx@0.18.5";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 30;
const FONT_SIZE = 8;
const HEADER_FONT_SIZE = 8;
const ROW_HEIGHT = 16;
const MIN_COL_WIDTH = 50;
const MAX_COL_WIDTH = 160;
const MAX_CELL_CHARS = 80;

// Safety caps so a single pathological sheet (e.g. formatting applied to
// an entire column/row, inflating Excel's "used range" far past the real
// data) can't blow the edge function's CPU/time budget. If a sheet is
// larger than this, it gets truncated with a note rather than silently
// killing the whole conversion (which is what caused the 546 errors).
const MAX_ROWS_PER_SHEET = 2000;
const MAX_COLS_PER_SHEET = 60;

export async function convertExcelToPdf(inputBuffer: Uint8Array) {
  const workbook = XLSX.read(inputBuffer, { type: "array" });
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawRows: string[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });
    if (rawRows.length === 0) continue;

    const trimmed = trimToContent(rawRows);
    if (trimmed.rows.length === 0) continue;

    renderSheet(
      pdfDoc,
      font,
      boldFont,
      sheetName,
      trimmed.rows,
      trimmed.truncatedRows,
      trimmed.truncatedCols,
    );
  }

  if (pdfDoc.getPageCount() === 0) {
    pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  return pdfDoc.save();
}

// Excel's declared sheet range often extends well past the real data
// (e.g. a fill/border applied to a whole column or row). Trim trailing
// empty rows and columns so we don't render — and burn CPU on — blank
// padding, and cap the remaining size so one huge sheet can't take down
// the whole conversion.
function trimToContent(rows: string[][]) {
  let lastRow = -1;
  let lastCol = -1;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val != null && String(val).trim() !== "") {
        if (r > lastRow) lastRow = r;
        if (c > lastCol) lastCol = c;
      }
    }
  }

  if (lastRow === -1 || lastCol === -1) {
    return { rows: [], truncatedRows: false, truncatedCols: false };
  }

  const truncatedRows = lastRow + 1 > MAX_ROWS_PER_SHEET;
  const truncatedCols = lastCol + 1 > MAX_COLS_PER_SHEET;

  const rowLimit = Math.min(lastRow, MAX_ROWS_PER_SHEET - 1);
  const colLimit = Math.min(lastCol, MAX_COLS_PER_SHEET - 1);

  const trimmedRows: string[][] = [];
  for (let r = 0; r <= rowLimit; r++) {
    const row = rows[r] || [];
    trimmedRows.push(row.slice(0, colLimit + 1));
  }

  return { rows: trimmedRows, truncatedRows, truncatedCols };
}

function estimateColWidth(rows: string[][], colIndex: number) {
  let max = 4;
  for (const row of rows) {
    const val = row[colIndex];
    if (val == null) continue;
    const len = String(val).length;
    if (len > max) max = len;
  }
  const px = max * 5.2 + 12;
  return Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, px));
}

function renderSheet(
  pdfDoc: PDFDocument,
  font: any,
  boldFont: any,
  sheetName: string,
  rows: string[][],
  truncatedRows: boolean,
  truncatedCols: boolean,
) {
  let numCols = 0;
  for (const r of rows) if (r.length > numCols) numCols = r.length;

  const colWidths = Array.from({ length: numCols }, (_, i) =>
    estimateColWidth(rows, i),
  );

  const usableWidth = PAGE_WIDTH - MARGIN * 2;
  const colBlocks: number[][] = [];
  let current: number[] = [];
  let currentWidth = 0;
  colWidths.forEach((w, i) => {
    if (currentWidth + w > usableWidth && current.length > 0) {
      colBlocks.push(current);
      current = [];
      currentWidth = 0;
    }
    current.push(i);
    currentWidth += w;
  });
  if (current.length > 0) colBlocks.push(current);

  const noteHeight = truncatedRows || truncatedCols ? 14 : 0;
  const rowsPerPage = Math.floor(
    (PAGE_HEIGHT - MARGIN * 2 - 40 - noteHeight) / ROW_HEIGHT,
  );

  colBlocks.forEach((colIndices, blockIdx) => {
    for (let rowStart = 0; rowStart < rows.length; rowStart += rowsPerPage) {
      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      let y = PAGE_HEIGHT - MARGIN;

      page.drawText(
        colBlocks.length > 1
          ? `${sheetName}  (columns ${blockIdx + 1} of ${colBlocks.length})`
          : sheetName,
        { x: MARGIN, y, size: 12, font: boldFont, color: rgb(0.1, 0.1, 0.1) },
      );
      y -= 20;

      if (truncatedRows || truncatedCols) {
        const parts = [];
        if (truncatedRows) parts.push(`first ${MAX_ROWS_PER_SHEET} rows`);
        if (truncatedCols) parts.push(`first ${MAX_COLS_PER_SHEET} columns`);
        page.drawText(`Note: sheet truncated to ${parts.join(" and ")}.`, {
          x: MARGIN,
          y,
          size: 7,
          font,
          color: rgb(0.6, 0.3, 0.1),
        });
        y -= 14;
      }

      const tableTop = y + 4;
      const rowSlice = rows.slice(rowStart, rowStart + rowsPerPage);

      // Compute x-offsets for each column in this block once.
      const xOffsets: number[] = [];
      let xCursor = MARGIN;
      colIndices.forEach((c) => {
        xOffsets.push(xCursor);
        xCursor += colWidths[c];
      });
      const blockWidth = xCursor - MARGIN;

      // Draw header fill (row 0 of the whole sheet only) as a single
      // rectangle instead of one per cell.
      const isHeaderBlock = rowStart === 0;
      if (isHeaderBlock && rowSlice.length > 0) {
        page.drawRectangle({
          x: MARGIN,
          y: tableTop - ROW_HEIGHT,
          width: blockWidth,
          height: ROW_HEIGHT,
          color: rgb(0.94, 0.94, 0.96),
        });
      }

      // Draw text per cell (unavoidable), but replace the per-cell
      // rectangle border with a shared grid of lines drawn once — this
      // is the main cost reduction, cutting draw calls roughly in half
      // on large sheets.
      rowSlice.forEach((row, rIdx) => {
        const rowY = tableTop - rIdx * ROW_HEIGHT;
        const isHeaderRow = isHeaderBlock && rIdx === 0;

        colIndices.forEach((c, ci) => {
          const raw = row[c] ?? "";
          const text = String(raw).slice(0, MAX_CELL_CHARS);
          if (text === "") return;

          page.drawText(text, {
            x: xOffsets[ci] + 3,
            y: rowY - 12,
            size: isHeaderRow ? HEADER_FONT_SIZE : FONT_SIZE,
            font: isHeaderRow ? boldFont : font,
            color: rgb(0, 0, 0),
          });
        });
      });

      // Horizontal grid lines (one per row boundary instead of per cell).
      for (let i = 0; i <= rowSlice.length; i++) {
        const lineY = tableTop - i * ROW_HEIGHT;
        page.drawLine({
          start: { x: MARGIN, y: lineY },
          end: { x: MARGIN + blockWidth, y: lineY },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85),
        });
      }

      // Vertical grid lines (one per column boundary instead of per cell).
      const tableBottom = tableTop - rowSlice.length * ROW_HEIGHT;
      xOffsets.forEach((xOff) => {
        page.drawLine({
          start: { x: xOff, y: tableTop },
          end: { x: xOff, y: tableBottom },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85),
        });
      });
      page.drawLine({
        start: { x: MARGIN + blockWidth, y: tableTop },
        end: { x: MARGIN + blockWidth, y: tableBottom },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });
    }
  });
}