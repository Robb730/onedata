import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { X, Save, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { parseAndSyncStructuredData } from "../../utils/structuredDataSync";

function getBucket(category) {
  return category === "general" || !category ? "repository-files" : "excel-files";
}

export default function FileEditModal({ isOpen, onClose, file, uploaderName, onSaved }) {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [workbookMeta, setWorkbookMeta] = useState(null); // { SheetNames, Sheets (raw, for styles) }
  const [sheets, setSheets]     = useState({});           // { sheetName: aoa[][] }
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
        const wb = XLSX.read(arrayBuffer, { type: "array" });

        const sheetData = {};
        wb.SheetNames.forEach((name) => {
          const ws = wb.Sheets[name];
          sheetData[name] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        });

        if (cancelled) return;
        setWorkbookMeta(wb);
        setSheets(sheetData);
        setActiveSheet(wb.SheetNames[0]);
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
      // pad row if needed
      while (updated[rowIdx].length <= colIdx) updated[rowIdx].push("");
      updated[rowIdx][colIdx] = value;
      return { ...prev, [activeSheet]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // 1. Rebuild the workbook from edited sheet data
      const newWb = XLSX.utils.book_new();
      Object.keys(sheets).forEach((name) => {
        const ws = XLSX.utils.aoa_to_sheet(sheets[name]);
        XLSX.utils.book_append_sheet(newWb, ws, name);
      });

      const wbOut = XLSX.write(newWb, { bookType: "xlsx", type: "array" });
      const newFileBlob = new Blob([wbOut], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const newFile = new File([newFileBlob], file.name, { type: newFileBlob.type });

      // 2. Overwrite the file in Storage
      const bucket = getBucket(file.data_category);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(file.path, newFile, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      // 3. Update files row (size, timestamp) — optional but useful
      await supabase
        .from("files")
        .update({ file_size: newFile.size })
        .eq("id", file.id);

      // 4. Re-parse and resync the DB tables to match the edited data
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
        {workbookMeta && workbookMeta.SheetNames.length > 1 && (
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-gray-100 shrink-0">
            {workbookMeta.SheetNames.map((name) => (
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
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 className="animate-spin" size={18} /> Loading file…
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500 gap-2 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          ) : (
            <table className="border-collapse text-xs">
              <tbody>
                {activeRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {Array.from({ length: colCount }).map((_, colIdx) => (
                      <td key={colIdx} className="border border-gray-200 p-0">
                        <input
                          value={row[colIdx] ?? ""}
                          onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                          className="w-24 px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-blue-50"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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