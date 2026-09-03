// TemplatesModal.jsx
// Shown when a user clicks the floating Templates button inside a
// Repository section folder. Always scoped to the specific `section` the
// modal was opened from — every role, including admins, sees only that
// section's templates here. (Admins can still see every template across
// every division on the standalone Templates management page.)

import { useState, useEffect } from "react";
import {
  LayoutTemplate,
  X,
  Download,
  FileSpreadsheet,
  Loader2,
  Inbox,
  AlertCircle,
  Check,
} from "lucide-react";
import { fetchTemplatesForSection, getTemplateDownloadUrl } from "../../utils/templatesApi";
import ModalPortal from "../Modals/ModalPortal";

function fileExt(fileName = "") {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
}

function fileSizeLabel(bytes) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TemplatesModal({ isOpen, onClose, userProfile, section }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadedId, setDownloadedId] = useState(null);

  useEffect(() => {
    if (!isOpen || !userProfile || !section?.id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadTemplates() {
      try {
        // Always scoped to this one section — not the user's whole
        // division, and not "all templates" even for admins.
        const data = await fetchTemplatesForSection(section.id);
        if (!cancelled) setTemplates(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTemplates();

    return () => { cancelled = true; };
  }, [isOpen, userProfile, section?.id]);

  async function handleDownload(template) {
    setDownloadingId(template.id);
    try {
      const url = await getTemplateDownloadUrl(template.storage_path);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.file_name;
      a.click();
      setDownloadedId(template.id);
      setTimeout(() => setDownloadedId((cur) => (cur === template.id ? null : cur)), 1800);
    } catch {
      // silently ignore — user will notice the file didn't download
    } finally {
      setDownloadingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.25)] border border-slate-200/80 overflow-hidden">

          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-slate-200" />
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-3 sm:pt-5 pb-4 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
              <LayoutTemplate size={18} className="text-white" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[1rem] font-bold text-slate-900 leading-tight">Templates</h2>
              <p className="text-[0.72rem] text-slate-400 mt-0.5 truncate">
                Ready-to-use Excel templates for {section?.name || "this section"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          <div className="h-px bg-slate-100 shrink-0" />

          {/* Body */}
          <div className="px-3.5 sm:px-4 py-3 overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400">
                <Loader2 size={22} className="animate-spin" />
                <p className="text-[0.82rem] font-medium">Loading templates…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle size={22} className="text-red-400" />
                </div>
                <p className="text-[0.82rem] text-red-500 font-medium text-center px-4">{error}</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Inbox size={22} className="text-slate-300" />
                </div>
                <p className="text-[0.82rem] font-medium text-slate-400 text-center max-w-[240px] leading-relaxed">
                  No templates have been assigned to {section?.name || "this section"} yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {templates.map((t) => {
                  const isDownloading = downloadingId === t.id;
                  const isDownloaded = downloadedId === t.id;
                  const meta = [fileSizeLabel(t.file_size), formatDate(t.created_at)]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 relative">
                        <FileSpreadsheet size={18} className="text-emerald-600" strokeWidth={2} />
                        <span className="absolute -bottom-1 -right-1 text-[0.5rem] font-black tracking-tight text-white bg-emerald-600 px-1 py-px rounded leading-none">
                          {fileExt(t.file_name)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.85rem] font-semibold text-slate-800 truncate leading-tight">
                          {t.name}
                        </p>
                        <p className="text-[0.68rem] text-slate-400 mt-0.5 truncate">
                          {meta || t.file_name}
                        </p>
                      </div>

                      {/* Download button */}
                      <button
                        id={`download-template-${t.id}`}
                        onClick={() => handleDownload(t)}
                        disabled={isDownloading}
                        title={`Download ${t.name}`}
                        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all shrink-0 disabled:opacity-60 ${
                          isDownloaded
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-white border border-slate-200 text-slate-400 group-hover:border-emerald-200 group-hover:text-emerald-600 group-hover:bg-emerald-50"
                        }`}
                      >
                        {isDownloading ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : isDownloaded ? (
                          <Check size={16} strokeWidth={2.5} />
                        ) : (
                          <Download size={15} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {templates.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 shrink-0">
              <p className="text-[0.72rem] font-medium text-slate-400">
                {templates.length} template{templates.length !== 1 ? "s" : ""} available
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}