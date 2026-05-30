import { useState, useRef, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  FileText,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  ChevronDown,
  Lock,
  X,
  Clock,
  FolderPlus,
  Trash2,
  Trash,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  KeyRound,
  BookOpen,
  Tag,
  ChevronRight,
} from "lucide-react";
import RequestFilesModal from "../components/RequestFilesModal";
import ViewFileRequestsModal from "../components/ViewFileRequestsModal";
import FileAccessModal from "../components/FileAccessModal";

// ── Section focal officers ────────────────────────────────────────────────────
const SECTION_FOCAL_OFFICERS = {
  "DRRM": "Maria Santos",
  "EDUCATION FACILITIES": "Carlos Mendoza",
  "HRD": "Anna Reyes",
  "LEARNER FORMATION": "Jose Dela Cruz",
  "PLANNING AND RESEARCH": "Hensley Santos",
  "SCHOOL HEALTH": "Robbi Olazo",
  "SIME": "John Hekusan Santos",
  "SMN": "Elena Cruz",
  "SPORTS": "Miguel Reyes",
};

// ── Permission helpers ────────────────────────────────────────────────────────
function canVerify(role) { return role === "admin" || role === "division"; }
function canAccessFiles(role, currentUserSection, folderName) {
  if (role === "admin" || role === "division") return true;
  if ((role === "sectionFocal" || role === "personnel") && currentUserSection === folderName) return true;
  return false;
}
function canDirectDelete(role) { return role === "admin" || role === "division"; }

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_FILE_REQUESTS = [
  { id: "r1", requesterName: "Maria Santos",   requesterRole: "School Principal", requesterInitials: "MS", requesterColor: "bg-teal-500",   fileName: "Annual Implementation Plan", fileId: "1", actionType: "download", requestedOn: "Feb 28, 2026", reason: "Needed for school board presentation.",    status: "Pending",  type: "access" },
  { id: "r2", requesterName: "Carlos Mendoza", requesterRole: "Department Head",  requesterInitials: "CM", requesterColor: "bg-blue-500",   fileName: "Data Analysis Report Q4",     fileId: "3", actionType: "view",     requestedOn: "Feb 28, 2026", reason: "Cross-reference with department KPIs.",    status: "Pending",  type: "access" },
  { id: "r3", requesterName: "Anna Reyes",     requesterRole: "Teacher III",      requesterInitials: "AR", requesterColor: "bg-purple-500", fileName: "Strategic Plan 2026-2026",    fileId: "4", actionType: "download", requestedOn: "Feb 27, 2026", reason: "Required for accreditation review.",       status: "Approved", type: "access" },
];
const MOCK_DELETE_REQUESTS = [
  { id: "dr1", requesterName: "Juan Paolo",     requesterRole: "Section Focal", requesterInitials: "JP", requesterColor: "bg-violet-500", fileName: "Survey Results January 2",  fileId: "6", requestedOn: "Mar 5, 2026", reason: "File contains outdated data superseded by the March 2026 survey.", status: "Pending", type: "delete" },
  { id: "dr2", requesterName: "Rosa Dela Cruz", requesterRole: "Section Focal", requesterInitials: "RD", requesterColor: "bg-rose-500",   fileName: "Budget Forecast 2026.xls", fileId: "5", requestedOn: "Mar 4, 2026", reason: "Duplicate of the updated version uploaded on March 1.",            status: "Denied",  type: "delete" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysUntilPermanentDelete(deletedAt) {
  const diffMs = new Date() - new Date(deletedAt);
  return Math.max(0, 14 - Math.floor(diffMs / 86400000));
}

// Validate code: 1-4 uppercase alphanumeric chars
function isValidCode(code) { return /^[A-Z0-9]{1,4}$/.test(code.toUpperCase()); }

// Build the auto-coded filename: CODE-YEAR-OriginalName
export function buildCodedFilename(originalName, code, schoolYear) {
  if (!code || !schoolYear) return originalName;
  // Strip existing extension handling
  return `${code.toUpperCase()}-${schoolYear}-${originalName}`;
}

// ── Codebook Panel ────────────────────────────────────────────────────────────
function CodebookPanel({ subfolders, folderName }) {
  const [isOpen, setIsOpen] = useState(false);
  const codedFolders = subfolders.filter((sf) => sf.code);
  if (codedFolders.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-500" />
          <span className="text-sm font-bold text-gray-900">Section Codebook</span>
          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold rounded-full">
            {codedFolders.length} {codedFolders.length === 1 ? "code" : "codes"}
          </span>
          <span className="text-xs text-gray-400 font-normal ml-1">· Codes auto-applied to filenames on upload</span>
        </div>
        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-500 mb-3">
            Files uploaded into a coded folder are automatically renamed as{" "}
            <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[11px] font-mono">
              CODE-YEAR-OriginalFilename
            </code>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {codedFolders.map((sf) => (
              <div
                key={sf.id}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5"
              >
                <span className="flex-shrink-0 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md font-mono border border-indigo-200">
                  {sf.code}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{sf.name}</p>
                  <p className="text-[10px] text-gray-400">e.g. {sf.code}-2025-2026-filename.pdf</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Delete Request Modal ──────────────────────────────────────────────────────
function DeleteRequestModal({ isOpen, onClose, file, onSubmit }) {
  const [reason, setReason] = useState("");
  if (!isOpen || !file) return null;
  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(file, reason.trim());
    setReason("");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-red-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center"><Trash2 size={16} className="text-red-500" /></div>
              <h2 className="text-base font-bold text-gray-900">Request File Deletion</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><X size={14} /></button>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
            <FileText size={18} className="text-gray-400 flex-shrink-0" />
            <div><p className="text-sm font-semibold text-gray-800">{file.name}</p><p className="text-xs text-gray-400">{file.type} · {file.size}</p></div>
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
            <ShieldAlert size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">Your deletion request will be sent to the <strong>Division Focal Officer</strong> for approval.</p>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reason for Deletion <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this file should be deleted..." rows={3} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={!reason.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ background: "linear-gradient(135deg,#f97316 0%,#ef4444 100%)" }}>Send Request</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Direct Delete Modal ───────────────────────────────────────────────
function ConfirmDeleteModal({ isOpen, onClose, file, onConfirm }) {
  if (!isOpen || !file) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-full bg-gradient-to-r from-red-400 to-rose-600" />
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-500" /></div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Move to Trash?</h2>
          <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-700">"{file.name}"</span> will be moved to the trash bin.</p>
          <p className="text-xs text-gray-400 mb-6">Files in trash are permanently deleted after 14 days.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={() => { onConfirm(file); onClose(); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors" style={{ background: "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)" }}>Move to Trash</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trash Bin Modal ───────────────────────────────────────────────────────────
function TrashBinModal({ isOpen, onClose, trashedFiles, onRestore, onPermanentDelete, canDirectDel }) {
  if (!isOpen) return null;
  const expiringSoon = trashedFiles.filter((f) => daysUntilPermanentDelete(f.deletedAt) <= 3);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: "min(880px, calc(100vw - 48px))", height: "min(680px, calc(100vh - 64px))" }} onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-full flex-shrink-0 bg-gradient-to-r from-gray-500 to-gray-700" />
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center"><Trash size={17} className="text-gray-500" /></div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">Trash Bin</h2>
              <p className="text-xs text-gray-400">Unrecovered files are permanently deleted after 14 days</p>
            </div>
            {trashedFiles.length > 0 && (
              <span className="ml-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full border border-gray-200">{trashedFiles.length} {trashedFiles.length === 1 ? "file" : "files"}</span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><X size={15} /></button>
        </div>
        {expiringSoon.length > 0 && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex-shrink-0">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700"><span className="font-bold">{expiringSoon.length} {expiringSoon.length === 1 ? "file" : "files"}</span> will be permanently deleted within 3 days.</p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {trashedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4"><Trash size={28} className="text-gray-300" /></div>
              <p className="text-sm font-semibold text-gray-500">Trash is empty</p>
              <p className="text-xs mt-1 text-gray-400">Files you delete will appear here before permanent removal</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[35%]">File</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deleted By</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deleted On</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires In</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {trashedFiles.map((file) => {
                    const daysLeft   = daysUntilPermanentDelete(file.deletedAt);
                    const isCritical = daysLeft <= 3;
                    const isWarning  = daysLeft <= 7 && !isCritical;
                    return (
                      <tr key={file.id} className={`transition-colors ${isCritical ? "bg-red-50/50 hover:bg-red-50/80" : "hover:bg-gray-50"}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText size={14} className="text-gray-400" /></div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate leading-tight">{file.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{file.type} · {file.size}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><span className="text-xs text-gray-500">{file.deletedBy || "—"}</span></td>
                        <td className="px-5 py-3.5"><span className="text-xs text-gray-500">{new Date(file.deletedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${isCritical ? "bg-red-100 text-red-600 border-red-200" : isWarning ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {isCritical && <AlertTriangle size={10} />}{daysLeft}d remaining
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => onRestore(file.id)} className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"><RotateCcw size={12} />Restore</button>
                            {canDirectDel && (
                              <button onClick={() => onPermanentDelete(file.id)} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-semibold bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"><Trash2 size={12} />Delete Forever</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{trashedFiles.length} {trashedFiles.length === 1 ? "file" : "files"} in trash</span>
            {expiringSoon.length > 0 && <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><AlertTriangle size={11} />{expiringSoon.length} expiring soon</span>}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><Clock size={11} />Auto-purge after 14 days</div>
        </div>
      </div>
    </div>
  );
}

// ── Requests Panel ────────────────────────────────────────────────────────────
function RequestsPanel({ requests, onApproveAccess, onDenyAccess, onApproveDelete, onDenyDelete, currentUserRole }) {
  const [isExpanded, setIsExpanded]         = useState(false);
  const [statusFilter, setStatusFilter]     = useState("pending");
  const [expandedReason, setExpandedReason] = useState(null);

  const isAdminOrDivision = currentUserRole === "admin" || currentUserRole === "division";
  const visibleRequests   = isAdminOrDivision ? requests.filter((r) => r.type === "delete") : requests.filter((r) => r.type === "access");
  const pendingAll        = visibleRequests.filter((r) => r.status === "Pending");
  const displayed         = statusFilter === "pending" ? visibleRequests.filter((r) => r.status === "Pending") : visibleRequests;
  const reviewed          = visibleRequests.filter((r) => r.status !== "Pending").length;
  const progress          = visibleRequests.length > 0 ? Math.round((reviewed / visibleRequests.length) * 100) : 0;

  const panelLabel       = isAdminOrDivision ? "Deletion Requests" : "Access Requests";
  const accentFrom       = isAdminOrDivision ? "#f97316" : "#0ea5e9";
  const accentTo         = isAdminOrDivision ? "#ef4444" : "#6366f1";
  const bubbleShadow     = isAdminOrDivision ? "rgba(239,68,68,0.45)" : "rgba(99,102,241,0.45)";
  const progressGradient = isAdminOrDivision ? "linear-gradient(90deg,#f97316,#ef4444)" : "linear-gradient(90deg,#2dd4bf,#3b82f6)";
  const tabActiveClass   = isAdminOrDivision ? "border-red-500 text-red-600" : "border-blue-500 text-blue-600";
  const tabActiveBadge   = isAdminOrDivision ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600";

  return (
    <>
      {!isExpanded && (
        <button onClick={() => setIsExpanded(true)} className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all duration-200 hover:scale-110 active:scale-95" style={{ background: `linear-gradient(135deg, ${accentFrom} 0%, ${accentTo} 100%)`, boxShadow: `0 8px 24px ${bubbleShadow}` }} title={panelLabel}>
          {isAdminOrDivision ? <Trash2 size={22} className="text-white" /> : <FileText size={20} className="text-white" />}
          {pendingAll.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">{pendingAll.length}</span>}
        </button>
      )}
      {isExpanded && (
        <div className="fixed top-0 right-0 z-50 h-full flex flex-col bg-white border-l border-gray-200" style={{ width: "380px", boxShadow: "-4px 0 32px rgba(0,0,0,0.12)", animation: "slideInRight 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
          <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
          <div className="h-1.5 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg,${accentFrom},${accentTo})` }} />
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              {isAdminOrDivision ? <Trash2 size={15} className="text-red-400" /> : <FileText size={15} className="text-gray-500" />}
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">{panelLabel}</span>
              {pendingAll.length > 0 && <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full"><Clock size={9} />{pendingAll.length} pending</span>}
            </div>
            <button onClick={() => setIsExpanded(false)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><X size={14} /></button>
          </div>
          <div className="px-4 pt-3 flex-shrink-0 border-b border-gray-100">
            <div className="flex">
              {[{ key: "pending", label: "Pending", count: visibleRequests.filter((r) => r.status === "Pending").length }, { key: "all", label: "All", count: visibleRequests.length }].map((tab) => (
                <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`flex items-center gap-1.5 pb-2 px-1 mr-5 text-xs font-semibold border-b-2 transition-colors ${statusFilter === tab.key ? tabActiveClass : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {tab.label}
                  {tab.count > 0 && <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${statusFilter === tab.key ? tabActiveBadge : "bg-gray-100 text-gray-500"}`}>{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>
          {isAdminOrDivision ? (
            <div className="mx-4 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex-shrink-0">
              <Trash2 size={12} className="text-red-500 flex-shrink-0" />
              <p className="text-[11px] text-red-700">Approving moves the file to the <strong>Trash Bin</strong>. It can still be restored within 14 days.</p>
            </div>
          ) : (
            <div className="mx-4 mt-3 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 flex-shrink-0">
              <KeyRound size={12} className="text-indigo-500 flex-shrink-0" />
              <p className="text-[11px] text-indigo-700">Approving grants the requester temporary access to the specified file.</p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                <CheckCircle size={28} className="text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-500">{statusFilter === "pending" ? "No pending requests" : "No requests found"}</p>
                {statusFilter === "pending" && visibleRequests.length > 0 && <button onClick={() => setStatusFilter("all")} className="text-[11px] text-blue-500 mt-1.5 hover:underline">View all requests</button>}
              </div>
            ) : (
              displayed.map((req) => (
                <div key={req.id} className={`p-4 ${req.type === "delete" && req.status === "Pending" ? "bg-red-50/20" : ""}`}>
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${req.requesterColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{req.requesterInitials}</div>
                      <div><p className="text-xs font-semibold text-gray-800 leading-tight">{req.requesterName}</p><p className="text-[11px] text-gray-400">{req.requesterRole}</p></div>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${req.status === "Pending" ? "text-orange-600 bg-orange-50 border-orange-200" : req.status === "Approved" ? "text-green-600 bg-green-50 border-green-200" : "text-red-500 bg-red-50 border-red-200"}`}>{req.status}</span>
                  </div>
                  <div className="ml-10 mb-2">
                    <div className="flex items-start gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-2 mb-1.5 shadow-sm">
                      <FileText size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-800 font-semibold leading-tight">{req.fileName}</p>
                    </div>
                    {req.type === "access" && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${req.actionType === "download" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-purple-50 text-purple-600 border-purple-200"}`}>
                        {req.actionType === "download" ? <Download size={8} /> : <Eye size={8} />}{req.actionType === "download" ? "Download" : "View"} Request
                      </span>
                    )}
                  </div>
                  <div className="ml-10 flex items-center justify-between mb-2.5">
                    <span className="text-[11px] text-gray-400">{req.requestedOn}</span>
                    {req.reason && <button onClick={() => setExpandedReason(expandedReason === req.id ? null : req.id)} className="text-[11px] text-blue-500 hover:text-blue-700 font-medium">{expandedReason === req.id ? "Hide reason" : "View reason"}</button>}
                  </div>
                  {expandedReason === req.id && req.reason && (
                    <div className="ml-10 mb-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <p className="text-[11px] text-gray-600 leading-relaxed italic">"{req.reason}"</p>
                    </div>
                  )}
                  {req.status === "Pending" && (
                    <div className="ml-10 flex gap-2">
                      <button onClick={() => req.type === "delete" ? onApproveDelete(req.id, req.fileId) : onApproveAccess(req.id, req.fileId, req.actionType)} className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors ${req.type === "delete" ? "bg-red-500 hover:bg-red-600" : "bg-teal-500 hover:bg-teal-600"}`}>
                        <CheckCircle size={12} />{req.type === "delete" ? "Approve Delete" : "Approve"}
                      </button>
                      <button onClick={() => req.type === "delete" ? onDenyDelete(req.id) : onDenyAccess(req.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white hover:bg-red-50 text-red-500 border border-red-200 text-xs font-semibold rounded-lg transition-colors">
                        <X size={12} />Deny
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-gray-500">{reviewed} of {visibleRequests.length} reviewed</span>
              <span className="text-[11px] font-semibold text-gray-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progressGradient }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Create Subfolder Modal (UPDATED: now includes code field) ─────────────────
function CreateSubfolderModal({ isOpen, onClose, onConfirm, parentFolder }) {
  const [name, setName]     = useState("");
  const [code, setCode]     = useState("");
  const [codeError, setCodeError] = useState("");

  if (!isOpen) return null;

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setCode(val);
    if (val && !isValidCode(val)) setCodeError("Code must be 1–4 letters/numbers only.");
    else setCodeError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (code && !isValidCode(code)) return;
    onConfirm(name.trim(), code.trim().toUpperCase());
    setName("");
    setCode("");
    setCodeError("");
  };

  const previewName = code && name
    ? `${code.toUpperCase()}-2025-2026-example.pdf`
    : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 to-blue-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center"><FolderPlus size={16} className="text-teal-500" /></div>
              <h2 className="text-base font-bold text-gray-900">Create New Folder</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><X size={14} /></button>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Adding a folder inside <span className="font-semibold text-gray-700">{parentFolder}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Folder Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Folder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Enrollment, Budget, Performance"
                autoFocus
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                required
              />
            </div>

            {/* File Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                File Code{" "}
                <span className="text-gray-400 font-normal">(optional but recommended)</span>
              </label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="e.g. E1, BD, PR"
                  maxLength={4}
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-mono uppercase tracking-widest ${codeError ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                {code && !codeError && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{4 - code.length} left</span>
                )}
              </div>
              {codeError
                ? <p className="text-xs text-red-500 mt-1">{codeError}</p>
                : <p className="text-xs text-gray-400 mt-1">Short code (max 4 chars). Letters and numbers only. Will prefix all filenames in this folder.</p>
              }
            </div>

            {/* Live Preview */}
            {previewName && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3.5 py-3">
                <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                  📄 Filename Preview
                </p>
                <p className="text-xs font-mono text-indigo-800 break-all">{previewName}</p>
                <p className="text-[11px] text-indigo-500 mt-1">
                  Files uploaded here will be automatically renamed this way.
                </p>
              </div>
            )}

            {/* No code notice */}
            {!code && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">
                  Without a code, files in this folder won't be auto-classified. You can always edit the code later.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="submit" disabled={!name.trim() || !!codeError} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ background: "linear-gradient(135deg,#14b8a6 0%,#3b82f6 100%)" }}>
                Create Folder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function FolderDetail({ folder, currentUserSection, currentUserRole }) {
  const [selectedYear, setSelectedYear]             = useState("All Years");
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery]               = useState("");
  const [verifiedFiles, setVerifiedFiles]           = useState({});
  const [grantedAccess, setGrantedAccess]           = useState({});
  // subfolders now store: { id, name, code, createdOn, createdBy }
  // Pre-seeded with Enrollment/E1 for demo purposes
  const [subfolders, setSubfolders] = useState([
    { id: "sf1", name: "Enrollment",   code: "E1", createdOn: "Mar 1, 2026",  createdBy: "Division Officer" },
    { id: "sf2", name: "Budget",       code: "BD", createdOn: "Mar 1, 2026",  createdBy: "Division Officer" },
    { id: "sf3", name: "Performance",  code: "PR", createdOn: "Mar 2, 2026",  createdBy: "Division Officer" },
  ]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  // Active subfolder filter — null means "All"
  const [activeSubfolderFilter, setActiveSubfolderFilter] = useState(null);
  const [isTrashOpen, setIsTrashOpen]               = useState(false);
  const [allRequests, setAllRequests]               = useState([...MOCK_FILE_REQUESTS, ...MOCK_DELETE_REQUESTS]);
  const [deleteRequestModal, setDeleteRequestModal] = useState({ isOpen: false, file: null });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, file: null });
  const [trashedFiles, setTrashedFiles]             = useState([]);
  const [fileRequests, setFileRequests]             = useState([]);
  const [isRequestModalOpen, setIsRequestModalOpen]         = useState(false);
  const [isViewRequestsModalOpen, setIsViewRequestsModalOpen] = useState(false);
  const [accessModal, setAccessModal]               = useState({ isOpen: false, file: null, actionType: "download" });

  const dropdownRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsYearDropdownOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const folderName       = folder?.name  || "PLANNING AND RESEARCH";
  const folderOwner      = folder?.owner || "Hensley Santos";
  const folderModified   = folder?.date  ? `Modified ${folder.date}` : "Modified Feb 18, 2026";
  const thisSectionFocal = SECTION_FOCAL_OFFICERS[folderName] || folderOwner;

  const hasFullAccess    = canAccessFiles(currentUserRole, currentUserSection, folderName);
  const canVerifyFiles   = canVerify(currentUserRole);
  const canDirectDel     = canDirectDelete(currentUserRole);
  const canManageFolders = currentUserRole === "admin" || currentUserRole === "division";

  const showRequestsPanel =
    currentUserRole === "admin" ||
    currentUserRole === "division" ||
    (currentUserRole === "sectionFocal" && currentUserSection === folderName);

  const canSeeTrashBin =
    currentUserRole === "admin" ||
    currentUserRole === "division" ||
    (currentUserRole === "sectionFocal" && currentUserSection === folderName);

  const [files, setFiles] = useState([
    // Uncategorized files (no code prefix)
    { id: "1",  name: "Annual Implementation Plan",          schoolYear: "2023-2024", type: "PDF",         size: "4.8 MB", uploadedBy: "Hensley Santos",     uploadedOn: "Feb 16, 2026", status: "Verified"   },
    { id: "2",  name: "Research Proposal Template",          schoolYear: "2025-2026", type: "Document",    size: "1.2 MB", uploadedBy: "John Hekusan Santos", uploadedOn: "Feb 17, 2026", status: "Verified"   },
    { id: "3",  name: "Policy Brief - Education Reform",     schoolYear: "2025-2026", type: "Document",    size: "980 KB", uploadedBy: "John Hekusan Santos", uploadedOn: "Feb 11, 2026", status: "Unverified" },
    // Enrollment subfolder files (E1)
    { id: "4",  name: "E1-2025-2026-Enrollment Report Q1",  schoolYear: "2025-2026", type: "PDF",         size: "3.2 MB", uploadedBy: "Hensley Santos",     uploadedOn: "Mar 1, 2026",  status: "Verified"   },
    { id: "5",  name: "E1-2024-2025-Student Masterlist",    schoolYear: "2024-2025", type: "Spreadsheet", size: "5.1 MB", uploadedBy: "Hensley Santos",     uploadedOn: "Mar 1, 2026",  status: "Verified"   },
    { id: "6",  name: "E1-2025-2026-Enrollment Summary",    schoolYear: "2025-2026", type: "Spreadsheet", size: "2.4 MB", uploadedBy: "Hensley Santos",     uploadedOn: "Mar 2, 2026",  status: "Unverified" },
    // Budget subfolder files (BD)
    { id: "7",  name: "BD-2025-2026-Budget Forecast 2026",  schoolYear: "2025-2026", type: "Spreadsheet", size: "2.1 MB", uploadedBy: "Carlos Mendoza",     uploadedOn: "Feb 14, 2026", status: "Verified"   },
    { id: "8",  name: "BD-2024-2025-Annual Budget Report",  schoolYear: "2024-2025", type: "PDF",         size: "4.3 MB", uploadedBy: "Carlos Mendoza",     uploadedOn: "Feb 20, 2026", status: "Verified"   },
    // Performance subfolder files (PR)
    { id: "9",  name: "PR-2024-2025-Performance Indicators",schoolYear: "2024-2025", type: "Spreadsheet", size: "4.3 MB", uploadedBy: "Robbi Olazo",        uploadedOn: "Feb 12, 2026", status: "Verified"   },
    { id: "10", name: "PR-2025-2026-KPI Dashboard Q1",      schoolYear: "2025-2026", type: "PDF",         size: "1.9 MB", uploadedBy: "Maria Santos",       uploadedOn: "Mar 3, 2026",  status: "Unverified" },
  ]);

  const schoolYears   = ["All Years", ...Array.from(new Set(files.map((f) => f.schoolYear))).sort()];

  // Get the code for the active subfolder filter
  const activeFilterCode = activeSubfolderFilter
    ? subfolders.find((sf) => sf.name === activeSubfolderFilter)?.code ?? null
    : null;

  const filteredFiles = files.filter((file) => {
    const matchesYear      = selectedYear === "All Years" || file.schoolYear === selectedYear;
    const matchesSearch    = file.name.toLowerCase().includes(searchQuery.toLowerCase()) || file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    // Subfolder filter: match files whose name starts with CODE-
    const matchesSubfolder = activeFilterCode
      ? file.name.startsWith(`${activeFilterCode}-`)
      : true;
    return matchesYear && matchesSearch && matchesSubfolder;
  });

  // Count files per subfolder for badges
  const subfolderCounts = subfolders.reduce((acc, sf) => {
    acc[sf.name] = files.filter((f) => f.name.startsWith(`${sf.code}-`)).length;
    return acc;
  }, {});

  const getFileStatus  = (file) => verifiedFiles[file.id] !== undefined ? verifiedFiles[file.id] : file.status;
  const hasFileAccess  = (fileId, actionType) => { if (hasFullAccess) return true; return grantedAccess[fileId]?.has(actionType) ?? false; };

  const handleFileAction = (file, actionType) => {
    if (hasFileAccess(file.id, actionType)) { console.log(`${actionType}:`, file.name); return; }
    setAccessModal({ isOpen: true, file, actionType });
  };
  const handleVerify = (fileId) => setVerifiedFiles((prev) => ({ ...prev, [fileId]: "Verified" }));

  const handleDirectDelete = (file) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    setTrashedFiles((prev) => [...prev, { ...file, deletedAt: new Date().toISOString(), deletedBy: currentUserRole === "admin" ? "Admin" : "Division Officer" }]);
  };
  const handleSubmitDeleteRequest = (file, reason) => {
    setAllRequests((prev) => [...prev, {
      id: `dr-${Date.now()}`, requesterName: "Section Focal", requesterRole: "Section Focal Officer",
      requesterInitials: "SF", requesterColor: "bg-violet-500",
      fileName: file.name, fileId: file.id,
      requestedOn: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      reason, status: "Pending", type: "delete",
    }]);
  };
  const handleApproveDelete = (requestId, fileId) => {
    setAllRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "Approved" } : r));
    const file = files.find((f) => f.id === fileId);
    if (file) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setTrashedFiles((prev) => [...prev, { ...file, deletedAt: new Date().toISOString(), deletedBy: "Section Focal (Approved)" }]);
    }
  };
  const handleDenyDelete    = (requestId) => setAllRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "Denied" } : r));
  const handleApproveAccess = (requestId, fileId, actionType) => {
    setAllRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "Approved" } : r));
    if (fileId) {
      setGrantedAccess((prev) => { const s = new Set(prev[fileId] || []); s.add(actionType); return { ...prev, [fileId]: s }; });
    }
  };
  const handleDenyAccess    = (requestId) => setAllRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "Denied" } : r));
  const handleRestore       = (fileId) => {
    const file = trashedFiles.find((f) => f.id === fileId);
    if (file) { const { deletedAt, deletedBy, ...restored } = file; setFiles((prev) => [...prev, restored]); setTrashedFiles((prev) => prev.filter((f) => f.id !== fileId)); }
  };
  const handlePermanentDelete = (fileId) => setTrashedFiles((prev) => prev.filter((f) => f.id !== fileId));

  // UPDATED: now receives both name and code
  const handleCreateFolder = (name, code) => {
    setSubfolders((prev) => [...prev, {
      id: String(Date.now()),
      name,
      code: code || null,
      createdOn: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      createdBy: "Division Officer",
    }]);
    setShowCreateFolderModal(false);
  };

  const handleAddFileRequest  = (fileRequested, deadline) => {
    setFileRequests((prev) => [...prev, { id: Date.now().toString(), fileRequested, requestedBy: "Admin", role: "Division Head", requestedOn: new Date().toLocaleDateString(), deadline, status: "Pending", folderName }]);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "PDF":         return "bg-red-50 text-red-600 border-red-200";
      case "Document":    return "bg-blue-50 text-blue-600 border-blue-200";
      case "Spreadsheet": return "bg-green-50 text-green-600 border-green-200";
      default:            return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const stats = {
    pdfs:         files.filter((f) => f.type === "PDF").length,
    documents:    files.filter((f) => f.type === "Document").length,
    spreadsheets: files.filter((f) => f.type === "Spreadsheet").length,
  };

  return (
    <div className="relative bg-gray-50 min-h-screen">
      <div className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <span>Data Repository</span><span>/</span>
          <span>School Governance and Operations Division</span><span>/</span>
          <span className="text-gray-900 font-medium">{folderName}</span>
        </div>

        {/* Folder Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center"><FolderOpen className="text-blue-500" size={28} /></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">{folderName}</h1>
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-green-600 font-medium">Active</span></div>
                  <span className="text-gray-300">·</span><span className="text-gray-600">{folderOwner}</span>
                  <span className="text-gray-300">·</span><span className="text-gray-500">{folderModified}</span>
                  {!hasFullAccess && (<><span className="text-gray-300">·</span><span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium"><Lock size={10} />Per-file access required</span></>)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {canSeeTrashBin && (
                <button onClick={() => setIsTrashOpen(true)} className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200">
                  <Trash size={15} />Trash Bin
                  {trashedFiles.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">{trashedFiles.length}</span>}
                </button>
              )}
              {(currentUserRole === "admin" || currentUserRole === "division") && (
                <>
                  {canManageFolders && (
                    <button onClick={() => setShowCreateFolderModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors" style={{ background: "linear-gradient(135deg,#14b8a6 0%,#3b82f6 100%)" }}>
                      <FolderPlus size={15} />Create Folder
                    </button>
                  )}
                  <button onClick={() => setIsRequestModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">+ Request Files</button>
                  <button onClick={() => setIsViewRequestsModalOpen(true)} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium text-sm transition-colors">View File Requests</button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2"><FileText size={16} className="text-red-500" /><span className="font-semibold text-blue-600">{stats.pdfs} PDFs</span></div>
            <div className="flex items-center gap-2"><FileText size={16} className="text-blue-500" /><span className="font-semibold text-blue-600">{stats.documents} Documents</span></div>
            <div className="flex items-center gap-2"><FileText size={16} className="text-green-500" /><span className="font-semibold text-blue-600">{stats.spreadsheets} Spreadsheets</span></div>
            <span className="text-gray-400 text-xs ml-auto">{files.length} files total</span>
          </div>
        </div>

        {/* ── CODEBOOK PANEL (shown when subfolders with codes exist) ── */}
        <CodebookPanel subfolders={subfolders} folderName={folderName} />

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search files in this folder..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
            </div>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsYearDropdownOpen((v) => !v)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors min-w-[140px] justify-between">
                {selectedYear}<ChevronDown size={16} className={`transition-transform duration-200 ${isYearDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isYearDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden min-w-[140px]">
                  {schoolYears.map((year) => (
                    <button key={year} onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedYear === year ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>{year}</button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500 whitespace-nowrap">Showing {filteredFiles.length} {filteredFiles.length === 1 ? "file" : "files"}</span>
          </div>
        </div>

        {/* ── Subfolders + Filter Bar ── */}
        {subfolders.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FolderPlus size={16} className="text-teal-500" />
                Sub-folders
              </h3>
              <span className="text-xs text-gray-400">Click a folder to filter files below</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* All button */}
              <button
                onClick={() => setActiveSubfolderFilter(null)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  activeSubfolderFilter === null
                    ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <FolderOpen size={14} />
                All
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeSubfolderFilter === null ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {files.length}
                </span>
              </button>

              {/* One chip per subfolder */}
              {subfolders.map((sf) => {
                const isActive = activeSubfolderFilter === sf.name;
                const count    = subfolderCounts[sf.name] ?? 0;
                return (
                  <button
                    key={sf.id}
                    onClick={() => setActiveSubfolderFilter(isActive ? null : sf.name)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
                    }`}
                  >
                    <FolderOpen size={14} />
                    {sf.name}
                    {sf.code && (
                      <span className={`text-[10px] font-bold px-1 py-0.5 rounded font-mono border ${
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : "bg-indigo-100 text-indigo-700 border-indigo-200"
                      }`}>
                        {sf.code}
                      </span>
                    )}
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active filter info strip */}
            {activeSubfolderFilter && activeFilterCode && (
              <div className="mt-3 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                <Tag size={12} className="text-indigo-500 flex-shrink-0" />
                <p className="text-xs text-indigo-700">
                  Showing files in <span className="font-bold">{activeSubfolderFilter}</span> — all filenames begin with code{" "}
                  <span className="font-mono font-bold bg-indigo-200 text-indigo-800 px-1 py-0.5 rounded">{activeFilterCode}</span>
                </p>
                <button
                  onClick={() => setActiveSubfolderFilter(null)}
                  className="ml-auto flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold"
                >
                  <X size={11} />Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Files Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">File Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">School Year</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Size</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Uploaded By</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Uploaded On</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => {
                    const fileStatus       = getFileStatus(file);
                    const isUnverified     = fileStatus === "Unverified";
                    const canDownload      = hasFileAccess(file.id, "download");
                    const canView          = hasFileAccess(file.id, "view");
                    const pendingDeleteReq = allRequests.find((r) => r.type === "delete" && r.fileId === file.id && r.status === "Pending");
                    // Detect if filename has a code prefix (CODE-YEAR- pattern)
                    const codeMatch = file.name.match(/^([A-Z0-9]{1,4})-(\d{4}-\d{4})-/);
                    return (
                      <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              {codeMatch && (
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded font-mono border border-indigo-200">{codeMatch[1]}</span>
                                  <span className="text-[10px] text-gray-400">{codeMatch[2]}</span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900 truncate max-w-[200px] block">{file.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-sm text-gray-600">{file.schoolYear}</span></td>
                        <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getTypeColor(file.type)}`}>{file.type}</span></td>
                        <td className="px-6 py-4"><span className="text-sm text-gray-600">{file.size}</span></td>
                        <td className="px-6 py-4"><span className="text-sm text-gray-600">{file.uploadedBy}</span></td>
                        <td className="px-6 py-4"><span className="text-sm text-gray-600">{file.uploadedOn}</span></td>
                        <td className="px-6 py-4">
                          {fileStatus === "Verified"
                            ? <div className="flex items-center gap-1.5 text-teal-600"><CheckCircle size={16} /><span className="text-xs font-medium">Verified</span></div>
                            : <div className="flex items-center gap-1.5 text-orange-500"><AlertCircle size={16} /><span className="text-xs font-medium">Unverified</span></div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {canVerifyFiles && isUnverified && (
                              <button onClick={() => handleVerify(file.id)} className="text-green-600 hover:text-green-700 transition-colors" title="Mark as Verified"><CheckCircle size={18} /></button>
                            )}
                            <button onClick={() => handleFileAction(file, "download")} className={`transition-colors ${canDownload ? "text-blue-600 hover:text-blue-700" : "text-gray-300 hover:text-orange-400"}`} title={canDownload ? "Download" : "Restricted"}>
                              {canDownload ? <Download size={18} /> : <span className="relative inline-flex"><Download size={18} /><Lock size={10} className="absolute -bottom-0.5 -right-0.5 text-orange-400" /></span>}
                            </button>
                            <button onClick={() => handleFileAction(file, "view")} className={`transition-colors ${canView ? "text-gray-600 hover:text-gray-700" : "text-gray-300 hover:text-orange-400"}`} title={canView ? "Preview" : "Restricted"}>
                              {canView ? <Eye size={18} /> : <span className="relative inline-flex"><Eye size={18} /><Lock size={10} className="absolute -bottom-0.5 -right-0.5 text-orange-400" /></span>}
                            </button>
                            {canDirectDel ? (
                              <button onClick={() => setConfirmDeleteModal({ isOpen: true, file })} className="text-red-400 hover:text-red-600 transition-colors" title="Move to Trash"><Trash2 size={18} /></button>
                            ) : (currentUserRole === "sectionFocal" && currentUserSection === folderName) ? (
                              pendingDeleteReq ? (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full"><Clock size={9} />Pending</span>
                              ) : (
                                <button onClick={() => setDeleteRequestModal({ isOpen: true, file })} className="text-orange-400 hover:text-red-500 transition-colors" title="Request Deletion">
                                  <span className="relative inline-flex"><Trash2 size={18} /><Lock size={10} className="absolute -bottom-0.5 -right-0.5 text-orange-400" /></span>
                                </button>
                              )
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <FileText size={32} className="text-gray-300" />
                        <p className="text-sm font-medium">No files found</p>
                        <p className="text-xs">{selectedYear !== "All Years" ? `No files for School Year ${selectedYear}` : "Try adjusting your search"}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showRequestsPanel && (
        <RequestsPanel requests={allRequests} onApproveAccess={handleApproveAccess} onDenyAccess={handleDenyAccess} onApproveDelete={handleApproveDelete} onDenyDelete={handleDenyDelete} currentUserRole={currentUserRole} />
      )}

      <DeleteRequestModal isOpen={deleteRequestModal.isOpen} onClose={() => setDeleteRequestModal({ isOpen: false, file: null })} file={deleteRequestModal.file} onSubmit={handleSubmitDeleteRequest} />
      <ConfirmDeleteModal isOpen={confirmDeleteModal.isOpen} onClose={() => setConfirmDeleteModal({ isOpen: false, file: null })} file={confirmDeleteModal.file} onConfirm={handleDirectDelete} />
      <TrashBinModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} trashedFiles={trashedFiles} onRestore={handleRestore} onPermanentDelete={handlePermanentDelete} canDirectDel={canDirectDel} />
      <CreateSubfolderModal isOpen={showCreateFolderModal} onClose={() => setShowCreateFolderModal(false)} onConfirm={handleCreateFolder} parentFolder={folderName} />
      <RequestFilesModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} folderName={folderName} onAddFileRequest={handleAddFileRequest} />
      <ViewFileRequestsModal isOpen={isViewRequestsModalOpen} onClose={() => setIsViewRequestsModalOpen(false)} requests={fileRequests} />
      <FileAccessModal isOpen={accessModal.isOpen} onClose={() => setAccessModal((s) => ({ ...s, isOpen: false }))} file={accessModal.file} sectionName={folderName} focalOfficer={thisSectionFocal} actionType={accessModal.actionType} currentUserRole={currentUserRole} />
    </div>
  );
}