import { AlertTriangle, Mail, XCircle } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";

/**
 * UserCreateErrorModal — styled replacement for alert() on user-creation
 * AND user-deletion failures. Two variants:
 *   duplicate → amber warning, "Email already in use", back-to-form button
 *   generic   → red error, server message + optional title/confirm overrides
 * The parent keeps the underlying modal mounted, so closing this modal
 * returns the user straight to where they were.
 */
export default function UserCreateErrorModal({
  isOpen,
  onClose,
  variant = "generic",
  email,
  message,
  title,
  confirmLabel,
  emailLabel,
}) {
  if (!isOpen) return null;
  const isDuplicate = variant === "duplicate";

  return (
    <ModalPortal>
      <div
        className="modal-overlay fixed inset-x-0 bottom-0 top-14 lg:inset-0 z-[70] flex items-end lg:items-center justify-center p-0 lg:p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-t-2xl lg:rounded-xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-3.5rem)] lg:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 border-b-0 lg:border-b"
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="user-create-error-title"
          aria-describedby="user-create-error-desc"
        >
          <div className="lg:hidden flex justify-center pt-2.5 shrink-0">
            <div className="h-1 w-10 rounded-full bg-slate-200" />
          </div>
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isDuplicate ? "bg-amber-50" : "bg-rose-50"
                }`}
              >
                {isDuplicate ? (
                  <AlertTriangle className="text-amber-500" size={24} />
                ) : (
                  <XCircle className="text-rose-500" size={24} />
                )}
              </div>
              <h2
                id="user-create-error-title"
                className="text-lg sm:text-xl font-bold text-gray-900 truncate"
              >
                {isDuplicate ? "Email already in use" : (title ?? "Couldn't create user")}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              {/* X icon inline to avoid extra import churn */}
              <span className="text-xl leading-none">×</span>
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <p
              id="user-create-error-desc"
              className="text-sm text-gray-700 leading-relaxed"
            >
              {isDuplicate
                ? "That email address is already registered in the system. Each account needs a unique email."
                : (message || "Something went wrong while creating the user. Please try again.")}
            </p>

            {email && (
              <div
                className={`border rounded-lg p-4 ${
                  isDuplicate
                    ? "bg-amber-50 border-amber-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Mail
                    className={`mt-0.5 shrink-0 ${
                      isDuplicate ? "text-amber-600" : "text-slate-500"
                    }`}
                    size={20}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold mb-1 ${
                        isDuplicate ? "text-amber-900" : "text-slate-700"
                      }`}
                    >
                      {isDuplicate ? "Already registered" : (emailLabel ?? "Attempted email")}
                    </p>
                    <p
                      className={`text-sm font-mono mt-1 px-3 py-2 rounded border break-all ${
                        isDuplicate
                          ? "text-amber-900 bg-white border-amber-200"
                          : "text-slate-700 bg-white border-slate-200"
                      }`}
                    >
                      {email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isDuplicate && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600">
                  <strong>Next step:</strong> go back to the form, change the
                  email address, and submit again. Your other fields are kept
                  as-is.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 pt-0 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6 shrink-0">
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className={`w-full min-h-[44px] px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${
                isDuplicate
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isDuplicate ? "Try another email" : (confirmLabel ?? "Back to form")}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
