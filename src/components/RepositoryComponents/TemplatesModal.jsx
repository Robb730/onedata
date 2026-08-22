// TemplatesModal.jsx
// Shown when a non-admin user clicks the floating Templates button inside a
// Repository folder. Displays templates assigned to the user's section or
// division, and allows them to download the Excel template file.

import { useState, useEffect } from "react";
import {
  LayoutTemplate,
  X,
  Download,
  FileSpreadsheet,
  FolderOpen,
  Building2,
  Loader2,
} from "lucide-react";
import { fetchTemplatesForUser, getTemplateDownloadUrl } from "../../utils/templatesApi";
import { resolveUserDivisionId } from "../../utils/accessControl";
import ModalPortal from "../Modals/ModalPortal";

export default function TemplatesModal({ isOpen, onClose, userProfile }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (!isOpen || !userProfile) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadTemplates() {
      try {
        const divisionId = await resolveUserDivisionId(userProfile);
        if (!divisionId) {
          if (!cancelled) setTemplates([]);
          return;
        }
        const data = await fetchTemplatesForUser();
        if (!cancelled) setTemplates(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTemplates();

    return () => { cancelled = true; };
  }, [isOpen, userProfile]);

  async function handleDownload(template) {
    setDownloadingId(template.id);
    try {
      const url = await getTemplateDownloadUrl(template.storage_path);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.file_name;
      a.click();
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
        className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.22)] border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <LayoutTemplate size={17} className="text-white" />
              </div>
              <div>
                <h2 className="text-[0.95rem] font-bold text-slate-800">Templates</h2>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">
                  Excel templates available for your section or division
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <Loader2 size={24} className="animate-spin" />
                <p className="text-sm font-medium">Loading templates…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <p className="text-sm text-red-500 font-medium">{error}</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileSpreadsheet size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-400 text-center">
                  No templates have been assigned to your section or division yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {templates.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group"
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <FileSpreadsheet size={17} className="text-emerald-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-[0.68rem] text-slate-400 truncate">{t.file_name}</p>
                        {t.section?.name && (
                          <span className="inline-flex items-center gap-0.5 text-[0.62rem] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                            <FolderOpen size={8} /> {t.section.name}
                          </span>
                        )}
                        {t.division?.name && (
                          <span className="inline-flex items-center gap-0.5 text-[0.62rem] font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full border border-violet-100">
                            <Building2 size={8} /> {t.division.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Download button */}
                    <button
                      id={`download-template-${t.id}`}
                      onClick={() => handleDownload(t)}
                      disabled={downloadingId === t.id}
                      title={`Download ${t.name}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
                    >
                      {downloadingId === t.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {templates.length > 0 && `${templates.length} template${templates.length !== 1 ? "s" : ""} available`}
            </p>
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
