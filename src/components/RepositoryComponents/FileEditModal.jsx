import { useState, useEffect, useRef } from "react";
import ExcelJS from "exceljs";
import { X, Save, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { parseAndSyncStructuredData } from "../../utils/structuredDataSync";

function getBucket(category) {
  return category === "general" || !category ? "repository-files" : "excel-files";
}

// Extract a plain, editable string from any ExcelJS cell value —
// handles rich text, hyperlinks, formulas, and dates safely so we
// never render "[object Object]" in the grid.
function cellText(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if (Array.isArray(value.richText)) return value.richText.map((rt) => rt.text).join("");
    if (value.text != null) return value.text;                   // hyperlink
    if (value.result !== undefined) return String(value.result); // formula
    if (value instanceof Date) return value.toLocaleDateString();
    return "";
  }
  return String(value);
}

export default function FileEditModal({ isOpen, onClose, file, uploaderName, onSaved }) {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const workbookRef = useRef(null); // live ExcelJS workbook — holds all original styling for save
  const [sheetNames, setSheetNames] = useState([]);
  const [sheets, setSheets]     = useState({}); // { sheetName: aoa[][] }
  const [activeSheet, setActiveSheet] = useState(null);

  useEffect(() => {
    if (!isOpen || !file) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const bucket = getBucket(file.data_category);
        const { data: blob, error: dlError } = await supabase.storage.from(bucket).download(file.path);
        if (dlError) throw dlError;

        const arrayBuffer = await blob.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const sheetData = {};
        workbook.worksheets.forEach((ws) => {
          const rows = [];
          for (let r = 1; r <= ws.rowCount; r++) {
            const row = [];
            for (let c = 1; c <= ws.columnCount; c++) {
              row.push(cellText(ws.getCell(r, c).value));
            }
            rows.push(row);
          }
          sheetData[ws.name] = rows;
        });

        if (cancelled) return;
        workbookRef.current = workbook;
        setSheetNames(workbook.worksheets.map((ws) => ws.name));
        setSheets(sheetData);
        setActiveSheet(workbook.worksheets[0]?.name ?? null);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load file.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const handleCellChange = (rowIdx, colIdx, value) => {
    setSheets((prev) => {
      const updated = prev[activeSheet].map((row) => [...row]);
      while (updated[rowIdx].length <= colIdx) updated[rowIdx].push("");
      updated[rowIdx][colIdx] = value;
      return { ...prev, [activeSheet]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Write only the VALUES back onto the original live workbook.
      // Merges, column widths, fonts, fills, number formats etc. are
      // untouched — this is the same workbook instance that was loaded
      // from storage, so nothing about the file's real formatting is
      // rebuilt or discarded, even though the editor view above is
      // deliberately a simplified flat grid.
      const workbook = workbookRef.current;
      Object.entries(sheets).forEach(([name, rows]) => {
        const ws = workbook.getWorksheet(name);
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
      const newFile = new File([newFileBlob], file.name, { type: newFileBlob.type });

      const bucket = getBucket(file.data_category);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(file.path, newFile, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      await supabase.from("files").update({ file_size: newFile.size }).eq("id", file.id);

      if (file.data_category && file.data_category !== "general") {
        await parseAndSyncStructuredData(
          file.data_category,
          newFile,
          file.school_year,
          uploaderName,
          file.id,
          { replace: true }
        );
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const activeRows = sheets[activeSheet] || [];
  const colCount = activeRows.reduce((max, row) => Math.max(max, row.length), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 truncate max-w-lg">{file.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {file.data_category && file.data_category !== "general"
                ? "Editing will re-sync the dashboard data for this file."
                : "General file — editing only updates the stored spreadsheet."}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={saving}>
            <X size={22} />
          </button>
        </div>

        {/* Sheet tabs */}
        {sheetNames.length > 1 && (
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-gray-100 shrink-0">
            {sheetNames.map((name) => (
              <button
                key={name}
                onClick={() => setActiveSheet(name)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
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
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 className="animate-spin" size={18} /> Loading file…
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500 gap-2 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          ) : (
            <div className="inline-block rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
              <table className="border-collapse text-xs">
                <tbody>
                  {activeRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={rowIdx === 0 ? "bg-gray-100" : rowIdx % 2 === 0 ? "bg-gray-50/60" : "bg-white"}
                    >
                      {Array.from({ length: colCount }).map((_, colIdx) => (
                        <td key={colIdx} className="border border-gray-200 p-0">
                          <input
                            value={row[colIdx] ?? ""}
                            onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                            className={`w-28 px-2 py-1.5 text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50 ${
                              rowIdx === 0 ? "font-semibold text-gray-700" : "text-gray-800"
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
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
            {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}