import { AlertTriangle, X } from "lucide-react";

export default function DeleteSectionWarningModal({ isOpen, onClose, onContinue, sectionName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50">
              <AlertTriangle size={16} className="text-rose-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Delete this section?</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <p className="mb-6 text-xs leading-relaxed text-slate-500">
          Deleting <span className="font-semibold text-slate-700">"{sectionName}"</span> will also permanently
          delete every file inside it once an administrator approves the request. This can't be undone.
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}