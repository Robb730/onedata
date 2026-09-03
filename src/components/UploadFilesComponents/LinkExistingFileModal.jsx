import { useState, useEffect, useMemo } from "react";
import { Search, FileText, X, Link2, Loader, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function prettyCategory(category) {
  if (!category) return "General";
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Lets a section user pick a file already sitting in their section's
 * repository and attach it to a pending/overdue file request, instead
 * of re-uploading a duplicate.
 */
export default function LinkExistingFileModal({
  isOpen,
  onClose,
  sectionId,
  sectionName,
  requestFileName,
  onLink, // async (file) => void
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    if (!isOpen || !sectionId) return;

    setLoading(true);
    setLoadError("");
    setSelectedFileId(null);
    setSearchQuery("");
    setLinkError("");

    supabase
      .from("files")
      .select("id, file_name, file_path, data_category, school_year, created_at, uploaded_by_name")
      .eq("section_id", sectionId)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) {
          setLoadError("Couldn't load files for this section.");
          setFiles([]);
        } else {
          setFiles(data || []);
        }
        setLoading(false);
      });
  }, [isOpen, sectionId]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return files;
    return files.filter(
      (f) =>
        f.file_name?.toLowerCase().includes(q) ||
        prettyCategory(f.data_category).toLowerCase().includes(q) ||
        f.school_year?.toLowerCase().includes(q),
    );
  }, [files, searchQuery]);

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;

  const handleConfirm = async () => {
    if (!selectedFile || linking) return;
    setLinking(true);
    setLinkError("");
    try {
      await onLink(selectedFile);
    } catch (err) {
      console.error("Link failed:", err);
      setLinkError("Something went wrong linking this file. Please try again.");
      setLinking(false);
      return;
    }
    setLinking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-0 sm:px-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200/80 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Link2 size={16} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Link an existing file
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {requestFileName
                  ? `For request: "${requestFileName}"`
                  : sectionName
                    ? `Files in ${sectionName}`
                    : "Select a file already in your section"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files by name, category, or school year"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader size={20} className="animate-spin mb-2" />
              <p className="text-xs font-medium">Loading files…</p>
            </div>
          ) : loadError ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-red-500">{loadError}</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2 border border-slate-100">
                <FileText className="text-slate-300" size={18} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {files.length === 0 ? "No files in this section yet" : "No matches"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {files.length === 0
                  ? "Upload the file instead, then link future requests to it."
                  : "Try a different search term."}
              </p>
            </div>
          ) : (
            filteredFiles.map((f) => {
              const isSelected = f.id === selectedFileId;
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setSelectedFileId(f.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    isSelected
                      ? "border-blue-300 bg-blue-50/70"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/70"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-blue-100" : "bg-slate-50 border border-slate-100"
                    }`}
                  >
                    <FileText
                      size={15}
                      className={isSelected ? "text-blue-600" : "text-slate-400"}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">
                      {f.file_name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {prettyCategory(f.data_category)}
                      {f.school_year ? ` · ${f.school_year}` : ""}
                      {f.created_at ? ` · ${formatDate(f.created_at)}` : ""}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          {linkError && (
            <p className="text-xs font-semibold text-red-500 mb-2">{linkError}</p>
          )}
          <button
            type="button"
            disabled={!selectedFile || linking}
            onClick={handleConfirm}
            className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,0.28)] hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
          >
            {linking ? (
              <>
                <Loader size={15} className="animate-spin" /> Linking…
              </>
            ) : (
              <>
                <Link2 size={15} />
                {selectedFile ? `Link "${selectedFile.file_name}"` : "Select a file to link"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
