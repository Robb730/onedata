import { X, CheckCircle, Mail } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";

export default function SuccessModal({ isOpen, onClose, title, message, email }) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
    <div
      className="modal-overlay fixed inset-x-0 bottom-0 top-14 lg:inset-0 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl lg:rounded-xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-3.5rem)] lg:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 border-b-0 lg:border-b"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden flex justify-center pt-2.5 shrink-0">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <p className="text-gray-700">{message}</p>

          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="text-blue-600 mt-0.5 shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Login Credentials Sent
                  </p>
                  <p className="text-sm text-blue-700">
                    An email with login credentials and a temporary password has been sent to:
                  </p>
                  <p className="text-sm font-mono text-blue-900 mt-2 bg-white px-3 py-2 rounded border border-blue-200 break-all">
                    {email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> The user&apos;s account status will be Pending until they log in for the first time. Once they log in, the status will automatically change to Active.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 pt-0 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
