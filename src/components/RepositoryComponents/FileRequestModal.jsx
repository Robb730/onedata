import { useState } from "react";
import { X, FileText, Calendar, MessageSquare } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";

export default function FileRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const [fileName, setFileName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  if (!isOpen) return null;

  function handleClose() {
    setFileName("");
    setDeadline("");
    setMessage("");
    setError("");
    onClose();
  }

  function handleSubmit() {
    if (!fileName.trim()) {
      setError("File name is required.");
      return;
    }
    if (!deadline) {
      setError("Deadline is required.");
      return;
    }
    setError("");
    onSubmit({
      fileName: fileName.trim(),
      deadline,
      message: message.trim() || null,
    });
  }

  return (
    <ModalPortal>
    <div className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Request a File</h2>
            <p className="text-[12px] text-slate-400 font-medium mt-0.5">
              Section personnel will see this in their upload page
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-5 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 mb-1.5">
              <FileText size={13} /> File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. Q3 Enrollment Report"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 mb-1.5">
              <Calendar size={13} /> Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={todayStr}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 mb-1.5">
              <MessageSquare size={13} /> Additional Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Any extra instructions..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-500 font-medium">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-4 sm:px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center rounded-[10px] bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,0.28)] hover:bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
