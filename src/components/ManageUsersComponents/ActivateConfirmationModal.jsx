import { X, CheckCircle } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";

export default function ActivateConfirmationModal({ isOpen, onClose, onConfirm, userName }) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
    <div
      className="modal-overlay fixed inset-x-0 bottom-0 top-14 lg:inset-0 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl lg:rounded-xl shadow-2xl w-full max-w-md border border-slate-200 border-b-0 lg:border-b overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden flex justify-center pt-2.5">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Activate User</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to activate{" "}
            <span className="font-bold text-gray-900">{userName}</span>?
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Note:</strong> This user will be able to access the system again. Their account status will change to Active.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 px-4 sm:px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 min-h-[44px] px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Activate User
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
