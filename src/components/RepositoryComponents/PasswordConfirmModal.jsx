import { useState } from "react";
import { Lock, X, Loader2 } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";

export default function PasswordConfirmModal({
  isOpen,
  onClose,
  onConfirm, // async (password) => void — throw to show error
  title = "Confirm your password",
  description,
  confirmLabel = "Confirm",
}) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(password);
      setPassword("");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
    <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <Lock size={16} className="text-slate-500" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {description && <p className="mb-4 text-xs text-slate-500">{description}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
          {error && <p className="mb-2 text-xs font-medium text-rose-600">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !password}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}