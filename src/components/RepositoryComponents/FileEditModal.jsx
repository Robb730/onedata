import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import {
  X,
  Save,
  Loader2,
  AlertTriangle,
  Pencil,
  Eye,
  Maximize2,
  Minimize2,
  Download,
  FileType,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { parseAndSyncStructuredData } from "../../utils/structuredDataSync";
import ModalPortal from "../Modals/ModalPortal";

function getBucket(category) {
  return category === "general" || !category
    ? "repository-files"
    : "excel-files";
}

// Which cells in a sheet hold formulas, keyed as "A1"-style refs. Split out
// from extractSheetDataFast so callers that only need the flag set (e.g.
// after sourcing cell values from the live formula engine instead of the
// original SheetJS parse) don't pay for a full row parse just to get it.
function getFormulaRefsForSheet(xWorkbook, sheetName) {
  const ws = xWorkbook.Sheets[sheetName];
  const formulaRefs = new Set();
  if (!ws) return formulaRefs;
  for (const key in ws) {
    if (key[0] === "!") continue;
    if (ws[key]?.f) formulaRefs.add(key);
  }
  return formulaRefs;
}

// Turn a SheetJS sheet into a plain array-of-arrays of strings, PLUS a set
// of cell refs ("A1", "B2", ...) that hold formulas. This is the FAST path
// used for on-screen display/editing — it's what makes the grid appear
// almost instantly even on huge workbooks, because SheetJS's parser is far
// quicker than walking every cell with ExcelJS.
function extractSheetDataFast(xWorkbook, sheetName) {
  const ws = xWorkbook.Sheets[sheetName];
  if (!ws) return { rows: [], formulaRefs: new Set() };

  // IMPORTANT: sheet_to_json() defaults to the sheet's *used* range, which
  // can start after A1 if the top row/left column is blank (very common in
  // report-style sheets with title/spacer rows). If we let that happen,
  // aoa[0] silently becomes "Excel row 2" instead of "Excel row 1", while
  // handleSave() always assumes aoa[0] === row 1 when writing back via
  // ExcelJS (ws.getCell(rIdx + 1, cIdx + 1)). That mismatch causes every
  // edit to be saved to the wrong row/column — no error, just silently
  // wrong data (and anything that re-parses the saved file downstream,
  // e.g. dashboard sync, then fails or reads garbage). The formula worker
  // (formulaEngine.worker.js) uses the same A1-anchored convention, so row/
  // col indices line up between the grid, the save path, and live recalc.
  //
  // Fix: force the read range to start at A1 (row 0, col 0) so array
  // indices always line up 1:1 with real worksheet coordinates, no matter
  // where the sheet's actual data starts.
  const ref = ws["!ref"];
  const range = ref
    ? XLSX.utils.decode_range(ref)
    : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
  range.s = { r: 0, c: 0 };

  const aoa = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: "",
    range,
  });
  const rows = aoa.map((row) => row.map((v) => (v == null ? "" : String(v))));

  // Many real-world workbooks (this one included) are made mostly of
  // formula cells (totals, "needs"/"excess" columns, etc.) — in the Seats
  // Inventory template over 90% of cells are formulas. We surface which
  // cells those are so the grid can flag them, since editing one replaces
  // the formula with a fixed value (same as typing over a formula in Excel).
  const formulaRefs = getFormulaRefsForSheet(xWorkbook, sheetName);

  return { rows, formulaRefs };
}

function deepCloneSheets(sheets) {
  const clone = {};
  for (const [name, rows] of Object.entries(sheets)) {
    clone[name] = rows.map((row) => [...row]);
  }
  return clone;
}

// A resolvable/observable promise so handleSave() can wait (with a bound)
// for the background ExcelJS prep to finish, without blocking the Save
// button entirely while that prep is running or if it never completes.
function createDeferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// Build (or rebuild) the background Web Worker that hosts the HyperFormula
// engine used for live, cross-sheet recalculation. Isolated in a worker so
// parsing/recalculating even a large, formula-heavy workbook never blocks
// typing on the main thread. Returns null (rather than throwing) if the
// browser/bundler can't create a module worker, so the feature degrades
// silently instead of breaking editing.
function createFormulaWorker() {
  try {
    return new Worker(
      new URL("../../workers/formulaEngine.worker.js", import.meta.url),
      { type: "module" },
    );
  } catch (err) {
    console.error("Could not start the live-formula worker:", err);
    return null;
  }
}

// Coerce the edited (always-a-string) value back to match the cell's
// original type, so numeric/date columns don't silently turn into text —
// which breaks any downstream code that sums/aggregates them (string
// concatenation instead of addition, producing "inaccurate" totals).
function coerceEditedValue(value, kind) {
  if (value === "") return null;
  if (kind === "number") {
    const cleaned = value.replace(/[,%\s]/g, "").trim();
    const num = Number(cleaned);
    return Number.isNaN(num) ? value : num; // fall back to raw text if not really numeric
  }
  if (kind === "date") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d;
  }
  return value;
}

// HyperFormula reports formula errors (#DIV/0!, #REF!, etc.) as objects
// rather than plain values, and those may not survive the worker's
// postMessage structured-clone intact. Rather than risk writing something
// malformed into the file, we just leave the existing cached result alone
// for any cell whose recalculated value isn't a plain scalar/Date.
function normalizeEngineValue(v) {
  if (v === undefined || v === null) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === "object") return undefined;
  return v;
}

// Refreshes the CACHED result of every cell that is still a formula (i.e.
// wasn't just overwritten by a direct user edit) to match what the live
// formula engine actually computed — including cells the user never
// touched directly but that depend on ones they did, on any sheet.
//
// This is what makes Save produce a file whose numbers are correct
// immediately, rather than a file that LOOKS unchanged until something
// forces a full recalculation. Formulas themselves are left completely
// intact; only their displayed/cached result changes. Call this BEFORE
// applyChangesToExcelJS so that cells the user directly edited (which
// become plain values, not formulas) always win.
// Writes back ONLY the specific cells passed in `engineChanges` — never a
// full-sheet snapshot. Each cell is still required to currently be a
// formula (so a cell whose formula was removed some other way is left
// alone), same safety check as before.
function applyEngineResultsToExcelJS(workbook, engineChanges) {
  const bySheet = new Map();
  for (const ch of engineChanges) {
    const ws = workbook.getWorksheet(ch.sheet);
    if (!ws) continue;
    const newValue = normalizeEngineValue(ch.value);
    if (newValue === undefined) continue;

    let cell = ws.getCell(ch.r + 1, ch.c + 1);
    if (cell.type === ExcelJS.ValueType.Merge) {
      const master = cell.master;
      if (!master) continue;
      cell = master;
    }
    if (cell.type !== ExcelJS.ValueType.Formula || !cell.formula) continue;

    cell.value = { formula: cell.formula, result: newValue };
    bySheet.set(ch.sheet, true);
  }
  if (bySheet.size > 0) {
    workbook.calcProperties = {
      ...(workbook.calcProperties || {}),
      fullCalcOnLoad: true,
    };
  }
}

function applyEngineResultsToSheetJS(xWorkbook, engineChanges) {
  for (const ch of engineChanges) {
    const ws = xWorkbook.Sheets[ch.sheet];
    if (!ws) continue;
    const ref = XLSX.utils.encode_cell({ r: ch.r, c: ch.c });
    const existing = ws[ref];
    if (!existing || !existing.f) continue;

    const newValue = normalizeEngineValue(ch.value);
    if (newValue === undefined) continue;

    const { w: _oldText, ...preserved } = existing;
    if (typeof newValue === "number") {
      ws[ref] = { ...preserved, t: "n", v: newValue };
    } else if (newValue instanceof Date) {
      ws[ref] = { ...preserved, t: "d", v: newValue };
    } else if (typeof newValue === "boolean") {
      ws[ref] = { ...preserved, t: "b", v: newValue };
    } else {
      ws[ref] = { ...preserved, t: "s", v: String(newValue) };
    }
  }
  xWorkbook.Workbook = xWorkbook.Workbook || {};
  xWorkbook.Workbook.WBProps = {
    ...(xWorkbook.Workbook.WBProps || {}),
    fullCalcOnLoad: true,
  };
}

// PRIMARY write path — preserves styles, merges, column widths, etc.
// Returns the number of cells actually written.
//
// NOTE ON FORMULA CELLS: earlier versions of this function skipped any
// edited cell whose original type was ExcelJS.ValueType.Formula, on the
// assumption that formulas are "computed, not editable". In practice a lot
// of real workbooks (this one included — 90%+ of cells in the Seats
// Inventory sheets are formulas) use formulas for ordinary data columns
// like "needs"/"excess" totals, so that skip silently threw away real user
// edits with no error at all — it looked exactly like "my change didn't
// save". We now do what Excel itself does when you type over a formula
// cell: replace the formula with the typed value.
//
// `changes` only ever contains cells the user directly typed into (see
// editedCellsRef in the component) — never cells that merely recalculated
// on screen as a side effect of live formula recalculation — so dependent
// formula cells are never accidentally flattened into hardcoded values on
// save. They stay formulas in the saved file, and Excel/Google Sheets will
// recompute them fresh the next time the file is opened, same as before.
function applyChangesToExcelJS(workbook, changes) {
  let changedCount = 0;
  for (const { sheet, r, c, value } of changes) {
    const ws = workbook.getWorksheet(sheet);
    if (!ws) continue;

    let cell = ws.getCell(r + 1, c + 1);
    if (cell.type === ExcelJS.ValueType.Merge) {
      const master = cell.master;
      if (!master) continue;
      cell = master;
    }

    let kind;
    if (cell.type === ExcelJS.ValueType.Number) {
      kind = "number";
    } else if (cell.type === ExcelJS.ValueType.Date) {
      kind = "date";
    } else if (cell.type === ExcelJS.ValueType.Formula) {
      // Base the coercion on the formula's last computed result, so typing
      // "500" into a cell that used to compute a number still stores a
      // number rather than the string "500".
      const result = cell.result;
      kind =
        typeof result === "number"
          ? "number"
          : result instanceof Date
            ? "date"
            : "string";
    } else {
      kind = "string";
    }

    // Assigning .value directly replaces whatever was there before —
    // including a formula — with a plain value.
    cell.value = coerceEditedValue(value, kind);
    changedCount++;
  }
  return changedCount;
}

// FALLBACK write path — used whenever ExcelJS can't prepare the workbook
// (too large/complex, throws on load, or takes too long) so saving never
// silently gets stuck. Formatting fidelity is a little lower than the
// ExcelJS path, but the edited data is guaranteed to be written correctly.
// Same formula-replacement behavior as applyChangesToExcelJS above — see
// the note there for why formula cells are written to rather than skipped.
function applyChangesToSheetJS(xWorkbook, changes) {
  let changedCount = 0;
  for (const { sheet, r, c, value } of changes) {
    const ws = xWorkbook.Sheets[sheet];
    if (!ws) continue;

    const ref = XLSX.utils.encode_cell({ r, c });
    const existing = ws[ref];
    const kind =
      existing?.t === "n" ? "number" : existing?.t === "d" ? "date" : "string";
    const coerced = coerceEditedValue(value, kind);

    // Carry over everything except the formula ("f") and cached display
    // text ("w") — a cell can't have both a formula and a hardcoded value,
    // and keeping the old formula around would leave the file inconsistent
    // (or have Excel silently recompute over the user's edit on next open).
    const { f: _oldFormula, w: _oldText, ...preserved } = existing || {};

    if (coerced === null) {
      delete preserved.v;
      ws[ref] = { ...preserved, t: "z" };
    } else if (kind === "number") {
      ws[ref] = { ...preserved, t: "n", v: coerced };
    } else if (kind === "date") {
      ws[ref] = { ...preserved, t: "d", v: coerced };
    } else {
      ws[ref] = { ...preserved, t: "s", v: String(coerced) };
    }
    changedCount++;

    // Expand the sheet's used range if this edit landed outside it (e.g. a
    // new row appended at the bottom), otherwise some readers will ignore it.
    const range = ws["!ref"]
      ? XLSX.utils.decode_range(ws["!ref"])
      : { s: { r, c }, e: { r, c } };
    range.s.r = Math.min(range.s.r, r);
    range.s.c = Math.min(range.s.c, c);
    range.e.r = Math.max(range.e.r, r);
    range.e.c = Math.max(range.e.c, c);
    ws["!ref"] = XLSX.utils.encode_range(range);
  }
  return changedCount;
}

// Row height (px) used both for CSS and for virtualization math — must
// stay in sync with the cell padding/line-height below.
const ROW_HEIGHT = 32;
const OVERSCAN = 8; // extra rows rendered above/below the viewport
const LARGE_SHEET_ROW_THRESHOLD = 500;

// How long handleSave() will wait for a still-in-progress ExcelJS prep
// before giving up on full fidelity and using the SheetJS fallback instead.
const EXCELJS_PREP_WAIT_MS = 45000;

export default function FileEditModal({
  isOpen,
  onClose,
  file,
  uploaderName,
  onSaved,
  canEdit,
}) {
  const [loading, setLoading] = useState(true); // true only while the initial fast (SheetJS) parse is in flight
  const [error, setError] = useState(null);
  const engineChangedCellsRef = useRef(new Map());

  // The ExcelJS workbook is what we *prefer* to write back to storage on
  // Save, because it's the only one of the two parsers that preserves
  // styles, merges, column widths, etc. It loads in the background and is
  // NOT required just to view the file — and, as of this fix, it's no
  // longer required to save either (see rawArrayBufferRef below).
  const workbookRef = useRef(null);
  const [savePrepared, setSavePrepared] = useState(false); // true once the background ExcelJS load finishes
  const [savePrepError, setSavePrepError] = useState(null);
  const savePrepDeferredRef = useRef(null); // resolves(true|false) when bg ExcelJS prep settles

  // The SheetJS workbook backs the fast display path and lazy per-sheet
  // parsing when switching tabs.
  const xWorkbookRef = useRef(null);

  // Raw bytes of the downloaded file, kept around so Save can always build
  // a SheetJS-based fallback workbook — with style info this time — even
  // if the ExcelJS workbook never finished preparing (or failed). Also
  // reused to rebuild the formula worker from scratch on discard (see
  // resetFormulaEngine). This is what makes editing/saving work
  // universally, regardless of how large or complex the workbook is.
  const rawArrayBufferRef = useRef(null);

  const [sheetNames, setSheetNames] = useState([]);
  const [sheets, setSheets] = useState({}); // { sheetName: aoa[][] } — populated lazily per sheet
  const [sheetFormulaCells, setSheetFormulaCells] = useState({}); // { sheetName: Set<"A1"> } — which cells are formulas, for the grid's ƒx indicator
  const [activeSheet, setActiveSheet] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false); // true while a not-yet-opened sheet is being parsed

  const [saving, setSaving] = useState(false);
  // Save-time failures only, kept separate from `error` (load failures) so
  // a save hiccup shows an inline footer message instead of replacing the
  // whole grid with a full-screen error state.
  const [saveError, setSaveError] = useState(null);

  // ── Live formula recalculation (HyperFormula, in a Web Worker) ──
  // Cells the user has directly typed into, keyed "sheet::row::col" ->
  // { sheet, r, c, value }. This — NOT a diff against the edit snapshot —
  // is the source of truth for what handleSave() writes back, precisely
  // so that dependent formula cells recalculating on screen are never
  // mistaken for user edits and flattened into hardcoded values.
  const editedCellsRef = useRef(new Map());

  const formulaWorkerRef = useRef(null);
  const formulaRpcIdRef = useRef(0);
  const formulaPendingRef = useRef(new Map()); // rpc id -> resolve fn
  const [formulaEngineReady, setFormulaEngineReady] = useState(false);
  const sheetsRef = useRef({}); // mirrors `sheets` state, for effects that need current tabs without depending on `sheets` itself

  // ── Fullscreen toggle ─────────────────────────────────────────
  const [isFullScreen, setIsFullScreen] = useState(false);

  // ── View / edit mode ──────────────────────────────────────────
  const [mode, setMode] = useState("view"); // "view" | "edit"
  const [isDirty, setIsDirty] = useState(false);
  const editSnapshotRef = useRef(null); // sheets state at the moment "Edit File" was clicked, for discard/restore
  const [discardIntent, setDiscardIntent] = useState(null); // null | "close" | "exitEdit"

  // ── Virtualization state ─────────────────────────────────────
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);

  const [pdfUrl, setPdfUrl] = useState(null);
  const pdfUrlRef = useRef(null); // so cleanup can revoke it even after state resets
  const [pdfLoaded, setPdfLoaded] = useState(false); // true once the iframe has actually painted the PDF

  function isPdfFile(f) {
    if (!f) return false;
    if (f.type === "PDF") return true; // matches your inferType() output
    return f.name?.toLowerCase().endsWith(".pdf");
  }

  const fileIsPdf = isPdfFile(file);

  useEffect(() => {
    sheetsRef.current = sheets;
  }, [sheets]);

  useEffect(() => {
    if (isOpen) return;
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
      setPdfUrl(null);
    }
  }, [isOpen]);

  // Applies changes reported by the formula worker (the edited cell itself,
  // plus any dependents on any sheet) to on-screen state. Cells on sheets
  // that haven't been opened yet are skipped here — they're not stale,
  // because the lazy-load effect below always pulls fresh values straight
  // from the engine (not the original SheetJS parse) once it's ready.
  const applyRecalcChanges = useCallback((changes) => {
    if (!changes || !changes.length) return;

    for (const ch of changes) {
      const key = `${ch.sheet}::${ch.row}::${ch.col}`;
      engineChangedCellsRef.current.set(key, {
        sheet: ch.sheet,
        r: ch.row,
        c: ch.col,
        value: ch.value,
      });
    }

    setSheets((prev) => {
      // ...unchanged from here down
      const bySheet = new Map();
      for (const ch of changes) {
        if (!prev[ch.sheet]) continue; // not loaded on screen — nothing to patch
        if (!bySheet.has(ch.sheet)) bySheet.set(ch.sheet, []);
        bySheet.get(ch.sheet).push(ch);
      }
      if (bySheet.size === 0) return prev;

      const next = { ...prev };
      for (const [sheetName, cellChanges] of bySheet) {
        const updatedRows = next[sheetName].map((row) => [...row]);
        for (const { row, col, value } of cellChanges) {
          while (updatedRows.length <= row) updatedRows.push([]);
          while (updatedRows[row].length <= col) updatedRows[row].push("");
          updatedRows[row][col] = value == null ? "" : String(value);
        }
        next[sheetName] = updatedRows;
      }
      return next;
    });
  }, []);

  const handleFormulaWorkerMessage = useCallback(
    (e) => {
      const { type, id } = e.data || {};
      const resolvePending = (value) => {
        const resolve = formulaPendingRef.current.get(id);
        if (resolve) {
          resolve(value);
          formulaPendingRef.current.delete(id);
        }
      };

      if (type === "ready") {
        setFormulaEngineReady(true);
        resolvePending(true);
        return;
      }
      if (type === "error") {
        console.error("Formula engine error:", e.data.message);
        resolvePending(null);
        return;
      }
      if (type === "editResult") {
        applyRecalcChanges(e.data.changes);
        resolvePending(e.data.changes);
        return;
      }
      if (type === "sheetValues") {
        resolvePending(e.data.values);
        return;
      }
    },
    [applyRecalcChanges],
  );

  // Fire a request at the formula worker and get a Promise back for its
  // reply. Used both fire-and-forget (edits) and awaited (sheet fetches,
  // replaying past edits).
  const formulaRpc = useCallback((type, payload) => {
    const worker = formulaWorkerRef.current;
    if (!worker) return Promise.resolve(null);
    const id = ++formulaRpcIdRef.current;
    return new Promise((resolve) => {
      formulaPendingRef.current.set(id, resolve);
      worker.postMessage({ type, id, ...payload });
    });
  }, []);

  // (Re)builds the formula worker from the current file's raw bytes. Used
  // both on initial load and to fully discard any live-recalculated state
  // when the user cancels an edit session — reinitializing from scratch is
  // the simplest way to guarantee discarded edits can never leak into a
  // later recalculation, without having to hand-track every formula's
  // original text ourselves.
  const startFormulaWorker = useCallback(() => {
    formulaWorkerRef.current?.terminate();
    formulaPendingRef.current.clear();
    setFormulaEngineReady(false);

    if (!rawArrayBufferRef.current) {
      formulaWorkerRef.current = null;
      return;
    }

    const worker = createFormulaWorker();
    formulaWorkerRef.current = worker;
    if (!worker) return; // feature unavailable in this environment; degrade silently

    worker.onmessage = handleFormulaWorkerMessage;
    worker.onerror = (err) => {
      console.error("Formula worker crashed:", err);
    };

    const buf = rawArrayBufferRef.current.slice(0);
    worker.postMessage(
      { type: "init", id: ++formulaRpcIdRef.current, arrayBuffer: buf },
      [buf],
    );
  }, [handleFormulaWorkerMessage]);

  // Pulls one sheet's current (fully recalculated) values straight from
  // the engine and overwrites that sheet's on-screen display with them —
  // used to correct any cell whose value was stale in the ORIGINAL file
  // (e.g. a file previously saved by an external tool, or simply one
  // whose cached formula results were out of date) as soon as the engine
  // has a true answer, not just after the user edits something.
  const refreshSheetFromEngine = useCallback(
    async (name) => {
      const values = await formulaRpc("getSheet", { sheet: name });
      if (!values) return;
      const rows = values.map((row) =>
        row.map((v) => (v == null ? "" : String(v))),
      );
      setSheets((prev) => (prev[name] ? { ...prev, [name]: rows } : prev));
    },
    [formulaRpc],
  );

  // Once the engine finishes initializing: replay any edits typed before
  // it was ready (a real possibility — "live as you type" starts the
  // instant the grid is interactive, while the engine builds in the
  // background), THEN refresh every currently-open tab from the engine so
  // stale cached totals correct themselves immediately — this is what
  // fixes a reopened file still showing an old total until you touch it.
  useEffect(() => {
    if (!formulaEngineReady) return;
    let cancelled = false;

    (async () => {
      for (const { sheet, r, c, value } of editedCellsRef.current.values()) {
        await formulaRpc("edit", { sheet, row: r, col: c, value });
      }
      if (cancelled) return;
      await Promise.all(
        Object.keys(sheetsRef.current).map(refreshSheetFromEngine),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [formulaEngineReady, formulaRpc, refreshSheetFromEngine]);

  // Terminate the worker on unmount so it isn't left running after the
  // modal goes away.
  useEffect(() => {
    return () => {
      formulaWorkerRef.current?.terminate();
      formulaWorkerRef.current = null;
    };
  }, []);

  // ── Load: download once, parse fast (SheetJS) for display, then ──
  // ── prepare the ExcelJS workbook in the background for saving, ──
  // ── and start the formula worker for live recalculation. ──
  useEffect(() => {
    if (!isOpen || !file) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setSaveError(null);
      setSavePrepared(false);
      setSavePrepError(null);
      setSheets({});
      setSheetFormulaCells({});
      setMode("view");
      // PDFs open straight into an immersive full-screen reader; every
      // other file type keeps the normal windowed view.
      setIsFullScreen(isPdfFile(file));
      setPdfLoaded(false);
      setIsDirty(false);
      editSnapshotRef.current = null;
      editedCellsRef.current = new Map();
      setDiscardIntent(null);
      workbookRef.current = null;
      xWorkbookRef.current = null;
      rawArrayBufferRef.current = null;
      savePrepDeferredRef.current = createDeferred();

      formulaWorkerRef.current?.terminate();
      formulaWorkerRef.current = null;
      formulaPendingRef.current.clear();
      setFormulaEngineReady(false);

      // Clean up any previous PDF blob URL before loading a new file
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
      setPdfUrl(null);

      try {
        const primaryBucket = getBucket(file.data_category);
        const fallbackBucket =
          primaryBucket === "repository-files"
            ? "excel-files"
            : "repository-files";

        let blob = null;
        let lastErr = null;
        for (const bucket of [primaryBucket, fallbackBucket]) {
          const { data, error: dlError } = await supabase.storage
            .from(bucket)
            .download(file.path);
          if (!dlError && data) {
            blob = data;
            break;
          }
          lastErr = dlError;
        }

        if (!blob) {
          throw new Error(
            `Could not find "${file.name}" in storage at path "${file.path}". ` +
              `The file record may be out of date — try refreshing the file list. ` +
              (lastErr?.message ? `(${lastErr.message})` : ""),
          );
        }

        // ── PDF: skip all spreadsheet parsing, just show it ──
        if (isPdfFile(file)) {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          pdfUrlRef.current = url;
          setPdfUrl(url);
          setLoading(false);
          return;
        }

        const arrayBuffer = await blob.arrayBuffer();
        if (cancelled) return;

        // Keep a pristine copy of the raw bytes for the SheetJS fallback
        // save path (see rawArrayBufferRef above) and for rebuilding the
        // formula worker on discard. Sliced up front so it's never
        // affected by anything the other parsers do to their copies.
        rawArrayBufferRef.current = arrayBuffer.slice(0);

        // ── FAST PATH: parse with SheetJS so the user can see the data
        // right away, without waiting on ExcelJS's much slower style-aware
        // full parse.
        const xWorkbook = XLSX.read(arrayBuffer, {
          type: "array",
          cellText: true,
        });
        if (cancelled) return;

        xWorkbookRef.current = xWorkbook;
        const names = xWorkbook.SheetNames;
        setSheetNames(names);

        const firstName = names[0];
        if (firstName) {
          const { rows, formulaRefs } = extractSheetDataFast(
            xWorkbook,
            firstName,
          );
          setSheets({ [firstName]: rows });
          setSheetFormulaCells({ [firstName]: formulaRefs });
          setActiveSheet(firstName);
        }
        setLoading(false);

        // Background prep #1: style-preserving ExcelJS workbook, for
        // high-fidelity saving.
        (async () => {
          try {
            const excelWorkbook = new ExcelJS.Workbook();
            await excelWorkbook.xlsx.load(arrayBuffer.slice(0));
            if (cancelled) return;
            workbookRef.current = excelWorkbook;
            setSavePrepared(true);
            savePrepDeferredRef.current?.resolve(true);
          } catch (bgErr) {
            if (!cancelled) {
              setSavePrepError(
                bgErr.message ||
                  "Couldn't fully prepare this file for high-fidelity saving. You can still edit and save — some formatting may be simplified.",
              );
            }
            savePrepDeferredRef.current?.resolve(false);
          }
        })();

        // Background prep #2: HyperFormula engine, for live recalculation.
        if (!cancelled) startFormulaWorker();
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load file.");
          setLoading(false);
        }
        savePrepDeferredRef.current?.resolve(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, file]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, []);

  // ── Lazily parse a sheet the first time its tab is opened. Once the ──
  // ── formula engine is ready, source values from IT instead of the ──
  // ── original SheetJS parse, so a tab that's affected by edits made ──
  // ── on another sheet shows current numbers instead of stale ones. ──
  useEffect(() => {
    if (!activeSheet) return;
    if (sheets[activeSheet]) return; // already parsed/cached

    let cancelled = false;
    setSheetLoading(true);

    async function loadSheet() {
      if (formulaEngineReady) {
        const values = await formulaRpc("getSheet", { sheet: activeSheet });
        if (cancelled) return;
        if (values) {
          const rows = values.map((row) =>
            row.map((v) => (v == null ? "" : String(v))),
          );
          const formulaRefs = xWorkbookRef.current
            ? getFormulaRefsForSheet(xWorkbookRef.current, activeSheet)
            : new Set();
          setSheets((prev) => ({ ...prev, [activeSheet]: rows }));
          setSheetFormulaCells((prev) => ({
            ...prev,
            [activeSheet]: formulaRefs,
          }));
          setSheetLoading(false);
          return;
        }
      }

      // Fallback: engine isn't ready yet (or this sheet failed to
      // resolve) — use the fast SheetJS parse so viewing is never blocked
      // on the formula engine.
      if (!xWorkbookRef.current) {
        setSheetLoading(false);
        return;
      }
      const { rows, formulaRefs } = extractSheetDataFast(
        xWorkbookRef.current,
        activeSheet,
      );
      if (cancelled) return;
      setSheets((prev) => ({ ...prev, [activeSheet]: rows }));
      setSheetFormulaCells((prev) => ({ ...prev, [activeSheet]: formulaRefs }));
      setSheetLoading(false);
    }

    loadSheet();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSheet, formulaEngineReady]);

  // Escape key: exit fullscreen first if active, otherwise let the normal
  // close (with discard-confirmation) handle it. For PDFs, fullscreen IS
  // the viewer, so Escape just closes the modal outright.
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e) {
      if (e.key !== "Escape") return;
      if (isFullScreen && !fileIsPdf) {
        e.stopPropagation();
        setIsFullScreen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, isFullScreen, fileIsPdf]);

  // Reset scroll position whenever the visible sheet changes.
  useEffect(() => {
    setScrollTop(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeSheet]);

  // Track the scroll container's rendered height so we know how many
  // rows fit in the viewport.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setViewportHeight(el.clientHeight || 480);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeSheet, loading, sheetLoading]);

  const handleCellChange = (rowIdx, colIdx, value) => {
    setSheets((prev) => {
      const updated = prev[activeSheet].map((row) => [...row]);
      while (updated.length <= rowIdx) updated.push([]);
      while (updated[rowIdx].length <= colIdx) updated[rowIdx].push("");
      updated[rowIdx][colIdx] = value;
      return { ...prev, [activeSheet]: updated };
    });

    // Track this as a genuine user edit for saving — independent of
    // whatever the formula engine does further down, so a dependent
    // formula cell recalculating in response is never mistaken for a user
    // edit and written back to the file as a hardcoded value.
    const key = `${activeSheet}::${rowIdx}::${colIdx}`;
    editedCellsRef.current.set(key, {
      sheet: activeSheet,
      r: rowIdx,
      c: colIdx,
      value,
    });

    // Typing into a formula cell replaces the formula, same as Excel — so
    // it stops being flagged as one in the grid.
    setSheetFormulaCells((prev) => {
      const cellSet = prev[activeSheet];
      if (!cellSet) return prev;
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      if (!cellSet.has(cellRef)) return prev;
      const nextSet = new Set(cellSet);
      nextSet.delete(cellRef);
      return { ...prev, [activeSheet]: nextSet };
    });

    setIsDirty(true);

    // Live recalculation: push the edit into the background formula
    // engine so dependent cells — on this sheet or any other — update on
    // screen immediately, without waiting for Excel/Sheets to reopen the
    // file. If the engine isn't ready yet, this edit is replayed into it
    // automatically once it comes online (see the effect above).
    if (formulaEngineReady) {
      formulaRpc("edit", {
        sheet: activeSheet,
        row: rowIdx,
        col: colIdx,
        value,
      });
    }
  };

  // ── Mode transitions ──────────────────────────────────────────
  function enterEditMode() {
    if (!canEdit) return;
    editSnapshotRef.current = deepCloneSheets(sheets);
    editedCellsRef.current = new Map();
    engineChangedCellsRef.current = new Map();
    setIsDirty(false);
    setMode("edit");
  }

  function discardEditsAndRestore() {
    if (editSnapshotRef.current) {
      setSheets(editSnapshotRef.current);
    }
    editSnapshotRef.current = null;
    editedCellsRef.current = new Map();
    engineChangedCellsRef.current = new Map();
    setIsDirty(false);
    // Rebuild the formula engine from the original bytes so discarded
    // edits (and anything that recalculated because of them) can't leak
    // into a later editing session.
    startFormulaWorker();
  }

  function handleCancelEdit() {
    if (isDirty) {
      setDiscardIntent("exitEdit");
    } else {
      discardEditsAndRestore();
      setMode("view");
    }
  }

  function handleRequestClose() {
    if (mode === "edit" && isDirty) {
      setDiscardIntent("close");
    } else {
      onClose();
    }
  }

  function handleDownloadPdf() {
    if (!pdfUrl || !file) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function confirmDiscard() {
    const intent = discardIntent;
    discardEditsAndRestore();
    setDiscardIntent(null);
    if (intent === "close") {
      setMode("view");
      onClose();
    } else {
      setMode("view");
    }
  }

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    setSaveError(null);
    try {
      const changes = Array.from(editedCellsRef.current.values());

      // Only the cells HyperFormula reported as changed as a direct
      // consequence of a real edit this session — never a full-workbook
      // snapshot. See the note on engineChangedCellsRef.
      const engineChanges = Array.from(engineChangedCellsRef.current.values());

      let excelReady = savePrepared && !!workbookRef.current;
      if (!excelReady && !savePrepError && savePrepDeferredRef.current) {
        excelReady = await Promise.race([
          savePrepDeferredRef.current.promise,
          new Promise((resolve) =>
            setTimeout(() => resolve(false), EXCELJS_PREP_WAIT_MS),
          ),
        ]);
      }

      let arrayBuffer = null;
      let usedFallback = false;

      if (excelReady && workbookRef.current) {
        try {
          applyEngineResultsToExcelJS(workbookRef.current, engineChanges);
          const changedCount = applyChangesToExcelJS(
            workbookRef.current,
            changes,
          );
          console.log("cells actually written (ExcelJS):", changedCount);
          arrayBuffer = await workbookRef.current.xlsx.writeBuffer();
        } catch (exceljsErr) {
          console.error("ExcelJS write failed, falling back:", exceljsErr);
          arrayBuffer = null;
        }
      }

      if (!arrayBuffer) {
        usedFallback = true;
        if (!rawArrayBufferRef.current) {
          throw new Error(
            "The original file data is no longer available. Please close and reopen the file, then try again.",
          );
        }
        const fallbackWorkbook = XLSX.read(rawArrayBufferRef.current.slice(0), {
          type: "array",
          cellStyles: true,
          cellDates: true,
        });
        applyEngineResultsToSheetJS(fallbackWorkbook, engineChanges);
        const changedCount = applyChangesToSheetJS(fallbackWorkbook, changes);
        console.log("cells actually written (SheetJS fallback):", changedCount);
        arrayBuffer = XLSX.write(fallbackWorkbook, {
          type: "array",
          bookType: "xlsx",
          cellStyles: true,
        });
      }

      // ...rest (blob upload, files table update, parseAndSyncStructuredData,
      // editSnapshotRef/editedCellsRef reset) stays exactly as-is

      const newFileBlob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const newFile = new File([newFileBlob], file.name, {
        type: newFileBlob.type,
      });

      const bucket = getBucket(file.data_category);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(file.path, newFile, { upsert: true, cacheControl: "0" });
      if (uploadError) throw uploadError;

      await supabase
        .from("files")
        .update({
          file_size: newFile.size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", file.id);

      if (file.data_category && file.data_category !== "general") {
        await parseAndSyncStructuredData(
          file.data_category,
          newFile,
          file.school_year,
          uploaderName,
          file.id,
          { replace: true },
        );
      }

      if (usedFallback) {
        console.warn(
          "Saved via the simplified-formatting fallback writer — some styling may differ from the original file, but all data edits were written.",
        );
      }

      editSnapshotRef.current = null;
      editedCellsRef.current = new Map();
      engineChangedCellsRef.current = new Map();
      setIsDirty(false);
      onSaved?.();
      onClose();
    } catch (err) {
      setSaveError(err.message || "Failed to save changes.");
      console.error(err); // add this so future errors show full detail in console, not just message
    } finally {
      setSaving(false);
    }
  };

  const activeRows = sheets[activeSheet] || [];
  const colCount = useMemo(
    () => activeRows.reduce((max, row) => Math.max(max, row.length), 0),
    [activeRows],
  );

  // ── Virtualization math: only render rows in/near the viewport ──
  const totalRows = activeRows.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(totalRows, startIndex + visibleCount);
  const topSpacer = startIndex * ROW_HEIGHT;
  const bottomSpacer = (totalRows - endIndex) * ROW_HEIGHT;
  const isLargeSheet = totalRows > LARGE_SHEET_ROW_THRESHOLD;

  if (!isOpen || !file) return null;

  // ─────────────────────────────────────────────────────────────
  // ── PDF VIEWER — dedicated immersive layout ────────────────────
  // ─────────────────────────────────────────────────────────────
  if (fileIsPdf) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b0d12] flex flex-col h-dvh">
        {/* Slim dark toolbar */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 bg-[#15181f] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <FileType size={16} className="text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white truncate max-w-md leading-tight">
                {file.name}
              </p>
              <p className="text-[10.5px] text-white/40 mt-0.5">
                PDF document{file.size ? ` · ${file.size}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownloadPdf}
              disabled={!pdfUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors disabled:opacity-40"
              title="Download"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={() =>
                window.open(pdfUrl, "_blank", "noopener,noreferrer")
              }
              disabled={!pdfUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors disabled:opacity-40"
              title="Open in new tab"
            >
              <Maximize2 size={13} />
              <span className="hidden sm:inline">New Tab</span>
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF surface */}
        <div className="flex-1 min-h-0 relative bg-[#0b0d12]">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center px-8">
              <div className="flex items-center gap-2 text-red-400 text-sm text-center max-w-md">
                <AlertTriangle size={16} className="shrink-0" /> {error}
              </div>
            </div>
          ) : (
            <>
              {(!pdfUrl || !pdfLoaded) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-white/50">
                    <Loader2 className="animate-spin" size={22} />
                    <span className="text-xs font-medium">
                      Preparing preview…
                    </span>
                  </div>
                </div>
              )}
              {pdfUrl && (
                <iframe
                  src={pdfUrl}
                  title={file.name}
                  onLoad={() => setPdfLoaded(true)}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                    pdfLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ border: "none" }}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ── SPREADSHEET / DEFAULT VIEWER ───────────────────────────────
  // ─────────────────────────────────────────────────────────────
  return (
    <ModalPortal>
    <div
      className={`modal-overlay fixed inset-0 flex items-center justify-center z-50 ${isFullScreen ? "p-0" : "p-4"}`}
    >
      <div
        className={`relative bg-white shadow-2xl flex flex-col overflow-hidden transition-all ${
          isFullScreen
            ? "w-screen h-dvh rounded-none"
            : "w-full max-w-6xl h-[85dvh] max-h-[85dvh] rounded-xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 truncate max-w-lg">
                {file.name}
              </h2>
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  mode === "edit"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                {mode === "edit" ? <Pencil size={10} /> : <Eye size={10} />}
                {mode === "edit" ? "Editing" : "Viewing"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === "edit"
                ? file.data_category && file.data_category !== "general"
                  ? "Saving will re-sync the dashboard data for this file."
                  : "General file — saving only updates the stored spreadsheet."
                : canEdit
                  ? 'Read-only view. Click "Edit File" to make changes.'
                  : "Read-only view. You don't have edit access to this file."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mode === "view" && canEdit && (
              <button
                onClick={enterEditMode}
                disabled={loading || !!error}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pencil size={13} />
                Edit File
              </button>
            )}
            <button
              onClick={() => setIsFullScreen((f) => !f)}
              className="text-gray-400 hover:text-gray-600 p-1"
              title={isFullScreen ? "Exit full screen" : "Full screen"}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={handleRequestClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Sheet tabs */}
        {sheetNames.length > 1 && (
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-gray-100 shrink-0 overflow-x-auto">
            {sheetNames.map((name) => (
              <button
                key={name}
                onClick={() => setActiveSheet(name)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                  activeSheet === name
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-hidden p-4 bg-gray-50 flex flex-col min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 className="animate-spin" size={18} /> Loading file…
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500 gap-2 text-sm text-center px-8">
              <AlertTriangle size={16} className="shrink-0" /> {error}
            </div>
          ) : sheetLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 className="animate-spin" size={18} /> Loading sheet…
            </div>
          ) : (
            <>
              {isLargeSheet && (
                <div className="mb-2 flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 shrink-0">
                  <AlertTriangle size={12} />
                  Large sheet ({totalRows.toLocaleString()} rows × {colCount}{" "}
                  columns) — only visible rows are rendered for performance.
                  Scroll to load more.
                </div>
              )}
              <div
                ref={scrollRef}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <table
                  className="border-collapse text-xs"
                  style={{ tableLayout: "fixed" }}
                >
                  <tbody>
                    {topSpacer > 0 && (
                      <tr style={{ height: topSpacer }} aria-hidden="true">
                        <td
                          colSpan={colCount || 1}
                          style={{ padding: 0, border: "none" }}
                        />
                      </tr>
                    )}
                    {activeRows.slice(startIndex, endIndex).map((row, i) => {
                      const rowIdx = startIndex + i;
                      return (
                        <tr
                          key={rowIdx}
                          style={{ height: ROW_HEIGHT }}
                          className={`${
                            rowIdx === 0
                              ? "bg-gray-100"
                              : rowIdx % 2 === 0
                                ? "bg-gray-50/60"
                                : "bg-white"
                          } ${mode === "view" ? "hover:bg-blue-50/50" : ""}`}
                        >
                          {Array.from({ length: colCount }).map((_, colIdx) => {
                            const cellRef = XLSX.utils.encode_cell({
                              r: rowIdx,
                              c: colIdx,
                            });
                            const isFormula =
                              sheetFormulaCells[activeSheet]?.has(cellRef);
                            return (
                              <td
                                key={colIdx}
                                className="border border-gray-200 p-0"
                              >
                                {mode === "edit" ? (
                                  <input
                                    value={row[colIdx] ?? ""}
                                    onChange={(e) =>
                                      handleCellChange(
                                        rowIdx,
                                        colIdx,
                                        e.target.value,
                                      )
                                    }
                                    title={
                                      isFormula
                                        ? "This cell is computed by a formula. Editing it will replace the formula with the value you type."
                                        : undefined
                                    }
                                    style={{ height: ROW_HEIGHT - 2 }}
                                    className={`w-28 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50 ${
                                      isFormula
                                        ? "bg-amber-50/70 italic text-amber-800"
                                        : "bg-transparent"
                                    } ${
                                      rowIdx === 0
                                        ? "font-semibold text-gray-700"
                                        : isFormula
                                          ? ""
                                          : "text-gray-800"
                                    }`}
                                  />
                                ) : (
                                  <div
                                    style={{ height: ROW_HEIGHT - 2 }}
                                    title={
                                      isFormula
                                        ? `Formula result: ${row[colIdx] ?? ""}`
                                        : (row[colIdx] ?? "")
                                    }
                                    className={`w-28 px-2 py-1.5 text-xs truncate flex items-center gap-1 cursor-default select-text ${
                                      isFormula ? "bg-amber-50/40" : ""
                                    } ${
                                      rowIdx === 0
                                        ? "font-semibold text-gray-700"
                                        : isFormula
                                          ? "italic text-amber-800"
                                          : "text-gray-700"
                                    }`}
                                  >
                                    {isFormula && (
                                      <span className="text-[9px] font-bold text-amber-500 shrink-0">
                                        ƒx
                                      </span>
                                    )}
                                    {row[colIdx] ?? ""}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {bottomSpacer > 0 && (
                      <tr style={{ height: bottomSpacer }} aria-hidden="true">
                        <td
                          colSpan={colCount || 1}
                          style={{ padding: 0, border: "none" }}
                        />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
          {saveError ? (
            <span className="text-xs text-red-500 mr-auto flex items-center gap-1">
              <AlertTriangle size={12} /> {saveError}
            </span>
          ) : mode === "edit" && !!sheetFormulaCells[activeSheet]?.size ? (
            <span className="text-xs text-amber-600 mr-auto flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-amber-500">ƒx</span>
              Amber cells are computed by formulas — editing one replaces it
              with a fixed value.{" "}
              {formulaEngineReady ? (
                "Related cells update live as you type."
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-500">
                  <Loader2 className="animate-spin" size={11} />
                  Formulas are still loading for this large sheet — totals will
                  update live once ready.
                </span>
              )}
            </span>
          ) : mode === "edit" && !savePrepared && !loading && !error ? (
            <span className="text-xs text-gray-400 mr-auto flex items-center gap-1.5">
              <Loader2 className="animate-spin" size={12} />
              {savePrepError
                ? "Simplified formatting will be used for saving this file."
                : "Preparing full-fidelity save… you can save at any time."}
            </span>
          ) : null}

          {mode === "view" ? (
            <button
              onClick={handleRequestClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={15} />
                ) : (
                  <Save size={15} />
                )}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          )}
        </div>

        {/* Discard-changes confirmation overlay */}
        {discardIntent && (
          <div className="modal-overlay absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl shadow-2xl p-5 w-80">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-amber-500" size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Discard unsaved changes?
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    You have edits that haven't been saved.{" "}
                    {discardIntent === "close"
                      ? "Closing"
                      : "Leaving edit mode"}{" "}
                    now will lose them.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDiscardIntent(null)}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Keep Editing
                </button>
                <button
                  onClick={confirmDiscard}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
