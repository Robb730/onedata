import { useState, useEffect, useRef, useMemo } from "react";
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

function getBucket(category) {
  return category === "general" || !category
    ? "repository-files"
    : "excel-files";
}

// Turn a SheetJS sheet into a plain array-of-arrays of strings. This is the
// FAST path used for on-screen display/editing — it's what makes the grid
// appear almost instantly even on huge workbooks, because SheetJS's parser
// is far quicker than walking every cell with ExcelJS.
function extractSheetRowsFast(xWorkbook, sheetName) {
  const ws = xWorkbook.Sheets[sheetName];
  if (!ws) return [];
  const aoa = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: "",
  });
  return aoa.map((row) => row.map((v) => (v == null ? "" : String(v))));
}

function deepCloneSheets(sheets) {
  const clone = {};
  for (const [name, rows] of Object.entries(sheets)) {
    clone[name] = rows.map((row) => [...row]);
  }
  return clone;
}

// Row height (px) used both for CSS and for virtualization math — must
// stay in sync with the cell padding/line-height below.
const ROW_HEIGHT = 32;
const OVERSCAN = 8; // extra rows rendered above/below the viewport
const LARGE_SHEET_ROW_THRESHOLD = 500;

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

  // The ExcelJS workbook is what we ultimately write back to storage on
  // Save, because it's the only one of the two parsers that preserves
  // styles, merges, column widths, etc. It loads in the background and is
  // NOT required just to view the file.
  const workbookRef = useRef(null);
  const [savePrepared, setSavePrepared] = useState(false); // true once the background ExcelJS load finishes
  const [savePrepError, setSavePrepError] = useState(null);

  // The SheetJS workbook backs the fast display path and lazy per-sheet
  // parsing when switching tabs.
  const xWorkbookRef = useRef(null);

  const [sheetNames, setSheetNames] = useState([]);
  const [sheets, setSheets] = useState({}); // { sheetName: aoa[][] } — populated lazily per sheet
  const [activeSheet, setActiveSheet] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false); // true while a not-yet-opened sheet is being parsed

  const [saving, setSaving] = useState(false);

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
    if (isOpen) return;
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
      setPdfUrl(null);
    }
  }, [isOpen]);

  // ── Load: download once, parse fast (SheetJS) for display, then ──
  // ── prepare the ExcelJS workbook in the background for saving. ──
  useEffect(() => {
    if (!isOpen || !file) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setSavePrepared(false);
      setSavePrepError(null);
      setSheets({});
      setMode("view");
      // PDFs open straight into an immersive full-screen reader; every
      // other file type keeps the normal windowed view.
      setIsFullScreen(isPdfFile(file));
      setPdfLoaded(false);
      setIsDirty(false);
      editSnapshotRef.current = null;
      setDiscardIntent(null);
      workbookRef.current = null;
      xWorkbookRef.current = null;

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
          setSheets({
            [firstName]: extractSheetRowsFast(xWorkbook, firstName),
          });
          setActiveSheet(firstName);
        }
        setLoading(false);

        try {
          const excelWorkbook = new ExcelJS.Workbook();
          await excelWorkbook.xlsx.load(arrayBuffer.slice(0));
          if (cancelled) return;
          workbookRef.current = excelWorkbook;
          setSavePrepared(true);
        } catch (bgErr) {
          if (!cancelled) {
            setSavePrepError(
              bgErr.message ||
                "Failed to prepare this file for editing. You can still view it, but editing is unavailable.",
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load file.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, file]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, []);

  // ── Lazily parse a sheet the first time its tab is opened ────
  useEffect(() => {
    if (!activeSheet || !xWorkbookRef.current) return;
    if (sheets[activeSheet]) return; // already parsed/cached

    setSheetLoading(true);
    // Defer to next tick so the tab-switch click and loading indicator
    // paint before we run the parse.
    const timer = setTimeout(() => {
      setSheets((prev) => ({
        ...prev,
        [activeSheet]: extractSheetRowsFast(xWorkbookRef.current, activeSheet),
      }));
      setSheetLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeSheet]); // eslint-disable-line react-hooks/exhaustive-deps

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
      while (updated[rowIdx].length <= colIdx) updated[rowIdx].push("");
      updated[rowIdx][colIdx] = value;
      return { ...prev, [activeSheet]: updated };
    });
    setIsDirty(true);
  };

  // ── Mode transitions ──────────────────────────────────────────
  function enterEditMode() {
    if (!canEdit) return; // defensive — button should already be hidden for this user
    editSnapshotRef.current = deepCloneSheets(sheets);
    setIsDirty(false);
    setMode("edit");
  }

  function discardEditsAndRestore() {
    if (editSnapshotRef.current) {
      setSheets(editSnapshotRef.current);
    }
    editSnapshotRef.current = null;
    setIsDirty(false);
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
    if (!canEdit) return; // defensive — button should already be hidden for this user
    if (!workbookRef.current) return; // shouldn't happen — Save is disabled until this is ready
    setSaving(true);
    setError(null);
    try {
      const workbook = workbookRef.current;
      Object.entries(sheets).forEach(([name, rows]) => {
        const ws = workbook.getWorksheet(name);
        if (!ws) return;
        rows.forEach((row, rIdx) => {
          row.forEach((value, cIdx) => {
            const cell = ws.getCell(rIdx + 1, cIdx + 1);
            if (cell.type === ExcelJS.ValueType.Merge) return; // only the merge "master" cell can be set
            cell.value = value === "" ? null : value;
          });
        });
      });

      const arrayBuffer = await workbook.xlsx.writeBuffer();
      const newFileBlob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const newFile = new File([newFileBlob], file.name, {
        type: newFileBlob.type,
      });

      const bucket = getBucket(file.data_category);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(file.path, newFile, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      await supabase
        .from("files")
        .update({ file_size: newFile.size })
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

      editSnapshotRef.current = null;
      setIsDirty(false);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save changes.");
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
              onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}
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
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isFullScreen ? "p-0" : "p-4"}`}
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
                          {Array.from({ length: colCount }).map((_, colIdx) => (
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
                                  style={{ height: ROW_HEIGHT - 2 }}
                                  className={`w-28 px-2 py-1.5 text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50 ${
                                    rowIdx === 0
                                      ? "font-semibold text-gray-700"
                                      : "text-gray-800"
                                  }`}
                                />
                              ) : (
                                <div
                                  style={{ height: ROW_HEIGHT - 2 }}
                                  title={row[colIdx] ?? ""}
                                  className={`w-28 px-2 py-1.5 text-xs truncate flex items-center cursor-default select-text ${
                                    rowIdx === 0
                                      ? "font-semibold text-gray-700"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {row[colIdx] ?? ""}
                                </div>
                              )}
                            </td>
                          ))}
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
          {mode === "edit" && savePrepError ? (
            <span className="text-xs text-red-500 mr-auto flex items-center gap-1">
              <AlertTriangle size={12} /> {savePrepError}
            </span>
          ) : mode === "edit" && !savePrepared && !loading && !error ? (
            <span className="text-xs text-gray-400 mr-auto flex items-center gap-1.5">
              <Loader2 className="animate-spin" size={12} /> Preparing file for
              saving…
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
                disabled={saving || loading || !savePrepared}
                title={
                  !savePrepared
                    ? "Still preparing this file for saving…"
                    : undefined
                }
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
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
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
  );
}