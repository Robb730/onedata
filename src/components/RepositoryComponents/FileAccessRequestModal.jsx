import { useState, useMemo, useEffect } from "react";
import {
  Lock,
  X,
  FileText,
  FileSpreadsheet,
  FileType,
  Image,
  File,
} from "lucide-react";

const REASON_MAX_LENGTH = 150;

function iconFor(type) {
  switch (type) {
    case "PDF":
      return { Icon: FileType, color: "text-red-500", bg: "bg-red-50" };
    case "Excel":
    case "Spreadsheet":
      return {
        Icon: FileSpreadsheet,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      };
    case "Word":
    case "Document":
      return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-50" };
    case "Image":
      return { Icon: Image, color: "text-violet-500", bg: "bg-violet-50" };
    default:
      return { Icon: File, color: "text-slate-400", bg: "bg-slate-50" };
  }
}

/**
 * files          - the file(s) that triggered the modal (pre-checked)
 * availableFiles - other locked, non-pending, non-granted files in the same
 *                   section the user can add to the request (optional)
 * sectionName     - for the header copy
 * onSubmit(fileIds: string[], message: string)
 */
export default function FileAccessRequestModal({
  isOpen,
  onClose,
  files = [],
  availableFiles = [],
  sectionName,
  onSubmit,
  isSubmitting,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState("");

  // Union of the triggering file(s) + any other eligible files in the section
  const allCandidates = useMemo(
    () => [
      ...files,
      ...availableFiles.filter((f) => !files.some((x) => x.id === f.id)),
    ],
    [files, availableFiles],
  );

  const triggerKey = files.map((f) => f.id).join(",");

  // Pre-check only the file(s) that triggered the modal (e.g. the single
  // file you clicked View/Download on). Files pulled in from
  // `availableFiles` are shown so the user *can* add them to the request,
  // but they start unchecked — this component doesn't unmount between
  // opens, so we re-sync selection instead of relying on useState's
  // one-time initializer.
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, triggerKey]);

  if (!isOpen) return null;

  const trimmedMessage = message.trim();
  const isReasonValid = trimmedMessage.length > 0;
  const canSubmit = selectedIds.size > 0 && isReasonValid && !isSubmitting;

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    const ids = allCandidates
      .filter((f) => selectedIds.has(f.id))
      .map((f) => f.id);
    if (ids.length === 0 || !isReasonValid) return;
    onSubmit(ids, trimmedMessage);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.22)] border border-slate-200">
        <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Lock size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[1.05rem] font-black text-slate-800 tracking-[-0.02em]">
              Request File Access
            </h2>
            <p className="text-[0.73rem] text-slate-400 font-medium mt-0.5">
              {sectionName
                ? `Outside your assigned section: ${sectionName}`
                : "Outside your assigned section"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* File checklist */}
        <div className="px-4 sm:px-6 pt-4 max-h-64 overflow-y-auto">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Files to request ({selectedIds.size} selected)
          </p>
          <div className="space-y-1.5">
            {allCandidates.map((file) => {
              const { Icon, color, bg } = iconFor(file.type);
              const checked = selectedIds.has(file.id);
              return (
                <label
                  key={file.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    checked
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(file.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                  />
                  <div
                    className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center shrink-0`}
                  >
                    <Icon size={13} className={color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {file.type} · {file.size}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Reason for access (required, short) */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Reason for access
            </p>
            <p
              className={`text-[10px] font-medium ${
                message.length > REASON_MAX_LENGTH - 20
                  ? "text-amber-500"
                  : "text-slate-400"
              }`}
            >
              {message.length}/{REASON_MAX_LENGTH}
            </p>
          </div>
          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value.slice(0, REASON_MAX_LENGTH))
            }
            rows={2}
            maxLength={REASON_MAX_LENGTH}
            placeholder="Briefly explain why you need this file"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-colors resize-none"
          />
          {!isReasonValid && (
            <p className="text-[10px] text-slate-400 mt-1">
              A short reason is required to submit your request.
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-[12px] text-blue-700 leading-relaxed">
              If approved, you'll be able to view and download the selected
              file(s). Editing and deleting remain limited to your assigned
              section.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-4 sm:px-6 py-5 sm:py-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            <Lock size={15} />
            {isSubmitting ? "Sending…" : `Request Access (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}