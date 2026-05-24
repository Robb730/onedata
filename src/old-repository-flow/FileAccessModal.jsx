import { useState, useEffect } from "react";
import { X, Lock, Shield, Download, Eye, CheckCircle, User, AlertTriangle } from "lucide-react";

export default function FileAccessModal({
  isOpen,
  onClose,
  file,
  sectionName,
  focalOfficer,
  actionType = "download",
  currentUserRole,
}) {
  const [requestSent, setRequestSent] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) { setRequestSent(false); setReason(""); }
  }, [isOpen, file?.name]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roleDisplayMap = {
    admin: "Administrator",
    division: "Division Officer",
    sectionFocal: "Section Focal Officer",
    personnel: "Section Personnel",
  };
  const roleLabel = roleDisplayMap[currentUserRole] || currentUserRole || "User";
  const actionLabel = actionType === "download" ? "Download" : "View";
  const ActionIcon = actionType === "download" ? Download : Eye;
  const accentColor = actionType === "download"
    ? "from-blue-400 via-blue-500 to-indigo-500"
    : "from-purple-400 via-purple-500 to-indigo-500";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(15,23,42,0.2), 0 4px 16px rgba(15,23,42,0.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1.5 w-full bg-gradient-to-r ${accentColor}`} />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={15} />
        </button>

        <div className="px-7 pt-7 pb-6">
          {/* Icon */}
          <div className="relative mb-5 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <ActionIcon size={20} className="text-red-400" />
              </div>
            </div>
            <div className="absolute bottom-0 right-[calc(50%-32px)] w-6 h-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
              <Lock size={11} className="text-white" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 text-center mb-1">
            {actionLabel} Restricted
          </h2>
          <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
            You don't have permission to {actionType} files from the{" "}
            <span className="font-semibold text-gray-700">{sectionName}</span> section.
          </p>

          {/* File info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{file?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Section: <span className="font-medium text-gray-600">{sectionName}</span>
                {file?.type && <span className="ml-2">· {file.type}</span>}
              </p>
            </div>
          </div>

          {/* Info pills */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Approver</p>
              <div className="flex items-center gap-1.5">
                <User size={12} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-gray-800 truncate">{focalOfficer || "Section Focal Officer"}</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Your Role</p>
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-gray-800 truncate">{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* Reason field — hidden once sent */}
          {!requestSent && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Reason for access <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Why do you need to ${actionType} this file?`}
                rows={3}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
            </div>
          )}

          {/* Notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-6">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Your request will be sent to{" "}
              <span className="font-semibold">{focalOfficer || "the section focal officer"}</span> for
              approval. You'll be notified once access is granted.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>

            {!requestSent ? (
              <button
                onClick={() => { if (reason.trim()) setRequestSent(true); }}
                disabled={!reason.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}
              >
                <Shield size={14} />
                Request Access
              </button>
            ) : (
              <button
                disabled
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-green-600 bg-green-50 border border-green-200 flex items-center justify-center gap-2 cursor-default"
              >
                <CheckCircle size={14} />
                Request Sent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}