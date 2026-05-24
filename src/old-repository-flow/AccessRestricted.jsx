import { useState } from "react";
import { ArrowLeft, ShieldX, User, Lock, Shield, CheckCircle } from "lucide-react";

export default function AccessRestricted({ folder, role, onBack }) {
  const [requestSent, setRequestSent] = useState(false);

  const roleDisplayMap = {
    admin: "Administrator",
    division: "Division Officer",
    sectionFocal: "Research Officer",
    personnel: "Personnel",
  };

  const roleLabel = roleDisplayMap[role] || role || "Unknown Role";

  const handleRequestAccess = () => {
    setRequestSent(true);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <span className="text-gray-300">›</span>
        <button onClick={onBack} className="hover:text-gray-700 transition-colors">
          Data Repository
        </button>
        <span className="text-gray-300">›</span>
        <span className="text-gray-800 font-medium">{folder?.name || "Restricted Folder"}</span>
      </div>

      {/* Folder Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <ShieldX size={22} className="text-gray-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
            <Lock size={9} className="text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-lg font-bold text-gray-900">{folder?.name || "Restricted Folder"}</h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <Lock size={9} />
              Restricted Access
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User size={11} />
              {folder?.owner || "Juan Paolo"}
            </span>
            <span className="flex items-center gap-1">
              <span>Modified {folder?.date || "Feb 20, 2026"}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>{folder?.fileCount || 48} files</span>
            </span>
          </div>
        </div>
      </div>

      {/* Restricted Content Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <Shield size={36} className="text-red-300" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <Lock size={14} className="text-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-gray-500 mb-1">
          You don't have permission to view the contents of this folder.
        </p>
        <p className="text-xs text-gray-400 max-w-sm mb-8">
          This folder is restricted to {folder?.name || "authorized"} personnel only. Your
          current role ({roleLabel}) does not have access.
        </p>

        {/* Info Pills */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
            <User size={13} className="text-gray-400" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Managed By</p>
              <p className="text-sm font-semibold text-gray-800">{folder?.owner || "Juan Paolo"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
            <Lock size={13} className="text-red-400" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Permission Level</p>
              <p className="text-sm font-semibold text-red-500">No Access</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
            <Shield size={13} className="text-gray-400" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Your Role</p>
              <p className="text-sm font-semibold text-gray-800">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!requestSent ? (
            <button
              onClick={handleRequestAccess}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 shadow-sm"
            >
              <Shield size={15} />
              Request Access
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-6 py-2.5 bg-green-50 border border-green-200 text-green-600 text-sm font-semibold rounded-lg cursor-default"
            >
              <CheckCircle size={15} />
              Access Request Sent
            </button>
          )}

          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
