import { X, CheckCircle, Mail } from "lucide-react";

export default function SuccessModal({ isOpen, onClose, title, message, email }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">{message}</p>
          
          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="text-blue-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Login Credentials Sent
                  </p>
                  <p className="text-sm text-blue-700">
                    An email with login credentials and a temporary password has been sent to:
                  </p>
                  <p className="text-sm font-mono text-blue-900 mt-2 bg-white px-3 py-2 rounded border border-blue-200">
                    {email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> The user's account status will be "Pending" until they log in for the first time. Once they log in, the status will automatically change to "Active".
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
