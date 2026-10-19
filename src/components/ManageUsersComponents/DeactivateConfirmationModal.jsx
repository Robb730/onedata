
import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";

export default function DeactivateConfirmationModal({ isOpen, onClose, onConfirm, userName }) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = () => {
    const trimmed = reason.trim() || null;
    setReason("");
    onConfirm(trimmed);
  };

  return (
    <ModalPortal>
    <div
      className="modal-overlay fixed inset-x-0 bottom-0 top-14 lg:inset-0 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-2xl lg:rounded-xl shadow-2xl w-full max-w-md border border-slate-200 border-b-0 lg:border-b overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden flex justify-center pt-2.5">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Deactivate User</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to deactivate{" "}
            <span className="font-bold text-gray-900">{userName}</span>?
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Warning:</strong> This user will no longer be able to access the system until their account is reactivated. All their data will be preserved.
            </p>
          </div>
          <div className="mt-4">
            <label
              htmlFor="deactivate-reason"
              className="block text-[0.8rem] font-bold text-slate-700 mb-1.5 ml-1"
            >
              Reason <span className="font-semibold text-slate-400">(optional — shown in the email)</span>
            </label>
            <textarea
              id="deactivate-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Repeated policy violations"
              rows={2}
              maxLength={500}
              className="w-full bg-slate-50/50 px-4 py-3 rounded-[12px] border border-slate-200/80 text-[0.85rem] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-orange-400 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 px-4 sm:px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
          >
            Deactivate User
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
