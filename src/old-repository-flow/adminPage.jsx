import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Upload,
  FileText,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  ArrowLeft,
  LogOut,
  User,
  Settings,
  ChevronDown,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Plus,
  FolderPlus,
} from "lucide-react";

import Dashboard from "./Dashboard";
import Repository from "./Repository";
import FolderDetail from "./FolderDetail";
import AccessRestricted from "./AccessRestricted";
import ManageUsers from "./ManageUsers";
import AuditLogs from "./AuditLogs";
import UploadFiles from "./UploadFiles";
import { useNavigate } from "react-router-dom";

// ── Module-level constants ────────────────────────────────────────────────────
const DIVISION_SUBFOLDERS = {
  "School Governance and Operations Division": [
    { name: "DRRM", fileCount: 48, date: "Feb 14, 2026", owner: "Maria Santos" },
    { name: "EDUCATION FACILITIES", fileCount: 32, date: "Feb 14, 2026", owner: "Carlos Mendoza" },
    { name: "HRD", fileCount: 55, date: "Feb 14, 2026", owner: "Anna Reyes" },
    { name: "LEARNER FORMATION", fileCount: 41, date: "Feb 14, 2026", owner: "Jose Dela Cruz" },
    { name: "PLANNING AND RESEARCH", fileCount: 67, date: "Feb 14, 2026", owner: "Hensley Santos" },
    { name: "SCHOOL HEALTH", fileCount: 29, date: "Feb 14, 2026", owner: "Robbi Olazo" },
    { name: "SIME", fileCount: 38, date: "Feb 14, 2026", owner: "John Hekusan Santos" },
    { name: "SMN", fileCount: 22, date: "Feb 14, 2026", owner: "Elena Cruz" },
    { name: "SPORTS", fileCount: 18, date: "Feb 14, 2026", owner: "Miguel Reyes" },
  ],
  "Office of the Schools Division Superintendent": [
    { name: "ADMINISTRATIVE SERVICES", fileCount: 44, date: "Feb 15, 2026", owner: "Hensley Santos" },
    { name: "BUDGET AND FINANCE", fileCount: 61, date: "Feb 15, 2026", owner: "Hensley Santos" },
    { name: "ICT", fileCount: 33, date: "Feb 15, 2026", owner: "Hensley Santos" },
    { name: "LEGAL", fileCount: 27, date: "Feb 15, 2026", owner: "Hensley Santos" },
  ],
  "Curriculum Implementation Division": [
    { name: "DISTRICT INSTRUCTIONAL SUPERVISION", fileCount: 52, date: "Feb 16, 2026", owner: "Juan Paolo" },
    { name: "INCLUSIVE EDUCATION", fileCount: 39, date: "Feb 16, 2026", owner: "Juan Paolo" },
    { name: "LEARNING AREAS", fileCount: 74, date: "Feb 16, 2026", owner: "Juan Paolo" },
    { name: "LRMDS", fileCount: 46, date: "Feb 16, 2026", owner: "Juan Paolo" },
  ],
};

const MOCK_FOLDER_REQUESTS = [
  { id: "fr1", requesterName: "Ana Reyes", requesterRole: "Section Personnel", requesterInitials: "AR", requesterColor: "bg-purple-500", folderName: "PLANNING AND RESEARCH", requestedOn: "Mar 1, 2026", reason: "Need access for annual report compilation.", status: "Pending" },
  { id: "fr2", requesterName: "Marco Dela Cruz", requesterRole: "Teacher III", requesterInitials: "MD", requesterColor: "bg-blue-500", folderName: "HRD", requestedOn: "Mar 2, 2026", reason: "Required for HR compliance audit.", status: "Pending" },
  { id: "fr3", requesterName: "Liza Santos", requesterRole: "School Principal", requesterInitials: "LS", requesterColor: "bg-teal-500", folderName: "SIME", requestedOn: "Mar 2, 2026", reason: "Monitoring and evaluation review.", status: "Pending" },
  { id: "fr4", requesterName: "Ramon Cruz", requesterRole: "Master Teacher I", requesterInitials: "RC", requesterColor: "bg-orange-500", folderName: "DRRM", requestedOn: "Mar 3, 2026", reason: "Disaster risk reduction planning.", status: "Pending" },
];

// ── Create Section Modal ──────────────────────────────────────────────────────
function CreateSectionModal({ isOpen, onClose, onConfirm, divisionName }) {
  const [name, setName] = useState("");

  useEffect(() => { if (!isOpen) setName(""); }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <FolderPlus size={16} className="text-blue-500" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Create New Section</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Adding a new section under <span className="font-semibold text-gray-700">{divisionName}</span>.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Section Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onConfirm(name.trim()); } }}
                placeholder="e.g. Records Management"
                autoFocus
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { if (name.trim()) onConfirm(name.trim()); }}
                disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#3b82f6 0%,#6366f1 100%)" }}
              >
                Create Section
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Division Officer: Folder Requests Bubble + Panel ─────────────────────────
function FolderRequestsPanel({ requests, onApprove, onDeny }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("Pending");
  const [expandedReason, setExpandedReason] = useState(null);

  const pending = requests.filter((r) => r.status === "Pending");
  const displayed = activeTab === "Pending" ? pending : requests;
  const reviewed = requests.filter((r) => r.status !== "Pending").length;
  const progress = requests.length > 0 ? Math.round((reviewed / requests.length) * 100) : 0;

  return (
    <>
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)", boxShadow: "0 8px 24px rgba(16,185,129,0.45), 0 2px 8px rgba(0,0,0,0.15)" }}
          title="Folder Access Requests"
        >
          <FolderOpen size={22} className="text-white" />
          {pending.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
              {pending.length}
            </span>
          )}
        </button>
      )}
      {isExpanded && (
        <div className="fixed top-0 right-0 z-50 h-screen flex flex-col bg-white border-l border-gray-200" style={{ width: "320px", boxShadow: "-4px 0 24px rgba(0,0,0,0.10)", animation: "slideInRight 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
          <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
          <div className="px-4 py-3.5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <FolderOpen size={15} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Folder Requests</span>
              {pending.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={9} />{pending.length}
                </span>
              )}
            </div>
            <button onClick={() => setIsExpanded(false)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"><X size={14} /></button>
          </div>
          <div className="flex border-b border-gray-100 px-4 pt-2 flex-shrink-0">
            <button onClick={() => setActiveTab("Pending")} className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 transition-colors mr-4 ${activeTab === "Pending" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              Pending
              {pending.length > 0 && <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center">{pending.length}</span>}
            </button>
            <button onClick={() => setActiveTab("All")} className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 transition-colors ${activeTab === "All" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>All Requests</button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CheckCircle size={28} className="text-gray-300 mb-2" />
                <p className="text-xs font-medium">All caught up!</p>
                <p className="text-xs mt-0.5">No pending requests</p>
              </div>
            ) : displayed.map((req) => (
              <div key={req.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${req.requesterColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{req.requesterInitials}</div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{req.requesterName}</p>
                      <p className="text-[11px] text-gray-400">{req.requesterRole}</p>
                    </div>
                  </div>
                  {req.status === "Pending" && <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Pending</span>}
                  {req.status === "Approved" && <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Approved</span>}
                  {req.status === "Denied" && <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Denied</span>}
                </div>
                <div className="ml-10 mb-2 flex items-center gap-1.5">
                  <FolderOpen size={11} className="text-teal-400 flex-shrink-0" />
                  <p className="text-[11px] text-gray-700 font-medium leading-tight truncate">{req.folderName}</p>
                </div>
                <div className="ml-10 flex items-center justify-between mb-3">
                  <span className="text-[11px] text-gray-400">{req.requestedOn}</span>
                  <button onClick={() => setExpandedReason(expandedReason === req.id ? null : req.id)} className="text-[11px] text-blue-500 hover:text-blue-700 font-medium">
                    {expandedReason === req.id ? "Hide reason" : "View reason"}
                  </button>
                </div>
                {expandedReason === req.id && (
                  <div className="ml-10 mb-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-gray-600 leading-relaxed italic">"{req.reason}"</p>
                  </div>
                )}
                {req.status === "Pending" && (
                  <div className="ml-10 flex gap-2">
                    <button onClick={() => onApprove(req.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition-colors"><CheckCircle size={12} /> Approve</button>
                    <button onClick={() => onDeny(req.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white hover:bg-red-50 text-red-500 border border-red-200 text-xs font-semibold rounded-lg transition-colors"><X size={14} /> Deny</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-gray-500">{reviewed} of {requests.length} reviewed</span>
              <span className="text-[11px] font-semibold text-gray-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Logout Modal ──────────────────────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel, role }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const roleDisplayMap = { admin: "Administrator", division: "Division Officer", sectionFocal: "Section Focal Officer", personnel: "Section Personnel" };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(4px)" }} onClick={onCancel}>
      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden" style={{ boxShadow: "0 24px 64px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.08)" }} onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-full bg-gradient-to-r from-red-400 via-red-500 to-rose-500" />
        <button onClick={onCancel} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"><X size={15} /></button>
        <div className="px-8 pt-8 pb-7 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut size={28} className="text-red-500" strokeWidth={2} />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center border-2 border-white">
              <AlertTriangle size={13} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign Out?</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">You're about to sign out of your account. Any unsaved changes will be lost.</p>
          <div className="mt-5 mb-6 flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">JD</div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-800 leading-none">Juan Dela Cruz</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{roleDisplayMap[role] || ""}</p>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Stay Logged In</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", boxShadow: "0 4px 14px rgba(239,68,68,0.35)" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(239,68,68,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(239,68,68,0.35)"; e.currentTarget.style.transform = "none"; }}>
              Yes, Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentSubfolder, setCurrentSubfolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");
  const [userSection] = useState(() => localStorage.getItem("userSection") || "");
  const [folderRequests, setFolderRequests] = useState(MOCK_FOLDER_REQUESTS);

  // Extra sections added by admin/division, keyed by division name
  const [extraSections, setExtraSections] = useState({});
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);

  const handleApproveFolderRequest = (id) =>
    setFolderRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "Approved" } : r));
  const handleDenyFolderRequest = (id) =>
    setFolderRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "Denied" } : r));

  const handleCreateSection = (name) => {
    const divName = currentFolder?.name;
    if (!divName) return;
    setExtraSections((prev) => ({
      ...prev,
      [divName]: [
        ...(prev[divName] || []),
        {
          name,
          fileCount: 0,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          owner: "Division Officer",
        },
      ],
    }));
    setShowCreateSectionModal(false);
  };

  const profileRef = useRef(null);
  const navigate = useNavigate();

  const toTitleCase = (str) => {
    const minor = ["and", "of", "the", "in", "a", "an"];
    return str.toLowerCase().split(" ").map((w, i) => i === 0 || !minor.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(" ");
  };
  const sectionLabel = userSection ? toTitleCase(userSection) : "Section";

  const roleDisplayMap = {
    admin: "Administrator",
    division: "School Governance and Operations Division Officer",
    sectionFocal: userSection ? `${sectionLabel} Section Focal Officer` : "Section Focal Officer",
    personnel: userSection ? `${sectionLabel} Section Personnel` : "Section Personnel",
  };
  const roleLabel = roleDisplayMap[role] || "";

  const sidebarRoleMap = {
    admin: "Administrator Dashboard",
    division: "Division Officer Dashboard",
    sectionFocal: userSection ? `${sectionLabel} Officer` : "Section Officer Dashboard",
    personnel: userSection ? `${sectionLabel} Personnel` : "Personnel Dashboard",
  };
  const sidebarLabel = sidebarRoleMap[role] || "Dashboard";

  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "repository", label: "Repository", icon: FolderOpen },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "upload", label: "Upload Files", icon: Upload },
    { id: "audit", label: "Audit Logs", icon: FileText },
  ];

  const getAllowedNavItems = () => {
    if (role === "admin") return allNavItems;
    if (role === "division" || role === "sectionFocal") return allNavItems.filter((i) => ["dashboard", "repository", "upload"].includes(i.id));
    if (role === "personnel") return allNavItems.filter((i) => ["dashboard", "repository"].includes(i.id));
    return [];
  };

  const handleNavigation = (viewId) => {
    setCurrentView(viewId);
    setCurrentFolder(null);
    setCurrentSubfolder(null);
    setBreadcrumbs([]);
  };

  const handleFolderClick = (folder) => {
    const hasSubs = !!DIVISION_SUBFOLDERS[folder.name];
    if (hasSubs) {
      setCurrentFolder(folder);
      setCurrentSubfolder(null);
      setCurrentView("subfolders");
      setBreadcrumbs([
        { label: "Repository", onClick: () => handleNavigation("repository") },
        { label: folder.name },
      ]);
    } else {
      setCurrentFolder(folder);
      setCurrentSubfolder(null);
      setCurrentView("folder-detail");
      setBreadcrumbs([
        { label: "Repository", onClick: () => handleNavigation("repository") },
        { label: folder.name },
      ]);
    }
  };

  const handleLockedFolderClick = (folder) => {
    setCurrentFolder(folder);
    setCurrentSubfolder(null);
    setCurrentView("access-restricted");
    setBreadcrumbs([
      { label: "Repository", onClick: () => handleNavigation("repository") },
      { label: folder.name },
    ]);
  };

  const handleSubfolderClick = (subfolder) => {
    setCurrentSubfolder(subfolder);
    setCurrentView("folder-detail");
    setBreadcrumbs([
      { label: "Repository", onClick: () => handleNavigation("repository") },
      { label: currentFolder.name, onClick: () => handleFolderClick(currentFolder) },
      { label: subfolder.name },
    ]);
  };

  const handleBack = () => {
    if (currentView === "access-restricted") {
      handleNavigation("repository");
      return;
    }
    if (currentView === "folder-detail" && currentSubfolder) {
      setCurrentSubfolder(null);
      setCurrentView("subfolders");
      setBreadcrumbs([
        { label: "Repository", onClick: () => handleNavigation("repository") },
        { label: currentFolder.name },
      ]);
    } else if (currentView === "folder-detail") {
      handleNavigation("repository");
    } else if (currentView === "subfolders") {
      handleNavigation("repository");
    }
  };

  // ── Section cards view — rendered when inside a division folder ─────────────
  const renderSubfoldersView = () => {
    const baseSections = DIVISION_SUBFOLDERS[currentFolder?.name] || [];
    const added = extraSections[currentFolder?.name] || [];
    const allSections = [...baseSections, ...added];
    const canManage = role === "admin" || role === "division";

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="p-8">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
            <ArrowLeft size={18} />
            Back to Repository
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{currentFolder?.name || "Division"}</h1>
            <p className="text-sm text-gray-500 mt-1">Browse sections and documents</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search sections..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort:</span>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Name</option>
                  <option>Date</option>
                  <option>Size</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Showing {allSections.length} sections</p>
          </div>

          {/* ── Grid: section cards + Create Section card ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allSections.map((subfolder) => (
              <div
                key={subfolder.name}
                onClick={() => handleSubfolderClick(subfolder)}
                className="bg-white rounded-xl p-5 hover:shadow-lg transition-all border border-gray-100 cursor-pointer"
              >
                <div className="mb-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                    <FolderOpen className="text-teal-500" size={24} />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm leading-tight">{subfolder.name}</h3>
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>{subfolder.fileCount} files</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>{subfolder.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    <span>{subfolder.owner}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Create Section card — admin and division officer only */}
            {canManage && (
              <button
                onClick={() => setShowCreateSectionModal(true)}
                className="bg-white rounded-xl p-5 border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[200px] group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Plus size={22} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-400 group-hover:text-blue-600 transition-colors">Create Section</p>
                  <p className="text-xs text-gray-300 group-hover:text-blue-400 mt-0.5 transition-colors">Add to this division</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Modal lives here so it has access to currentFolder */}
        <CreateSectionModal
          isOpen={showCreateSectionModal}
          onClose={() => setShowCreateSectionModal(false)}
          onConfirm={handleCreateSection}
          divisionName={currentFolder?.name}
        />
      </div>
    );
  };

  const handleLogoutClick = () => { setIsProfileOpen(false); setShowLogoutModal(true); };
  const handleLogoutConfirm = () => { localStorage.removeItem("role"); localStorage.removeItem("userSection"); setShowLogoutModal(false); navigate("/login"); };

  const showFolderRequestsPanel = role === "division" && ["repository", "subfolders"].includes(currentView);

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard": return <Dashboard />;
      case "repository": return <Repository onFolderClick={handleFolderClick} onLockedFolderClick={handleLockedFolderClick} role={role} />;
      case "subfolders": return renderSubfoldersView();
      case "folder-detail":
        return (
          <div>
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 ml-8 mt-4 font-medium">
              <ArrowLeft size={18} />
              Back
            </button>
            <FolderDetail folder={currentSubfolder || currentFolder} currentUserRole={role} currentUserSection={userSection} />
          </div>
        );
      case "access-restricted": return <AccessRestricted folder={currentFolder} role={role} onBack={() => handleNavigation("repository")} />;
      case "users": return <ManageUsers />;
      case "upload": return <UploadFiles role={role} userSection={userSection} />;
      case "audit": return <AuditLogs />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      {showLogoutModal && <LogoutModal role={role} onConfirm={handleLogoutConfirm} onCancel={() => setShowLogoutModal(false)} />}

      {showFolderRequestsPanel && (
        <FolderRequestsPanel requests={folderRequests} onApprove={handleApproveFolderRequest} onDeny={handleDenyFolderRequest} />
      )}

      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {isSidebarOpen && (
                <div>
                  <h1 className="text-xl font-bold text-gray-900">OneData</h1>
                  <p className="text-xs text-gray-500 mt-1">{sidebarLabel}</p>
                </div>
              )}
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {getAllowedNavItems().map((item) => {
              const Icon = item.icon;
              const isActive =
                item.id === "repository"
                  ? ["repository", "subfolders", "folder-detail", "access-restricted"].includes(currentView)
                  : currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                >
                  <Icon size={20} />
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {breadcrumbs.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
                        {crumb.onClick ? (
                          <button onClick={crumb.onClick} className="text-blue-600 hover:text-blue-700 font-medium">{crumb.label}</button>
                        ) : (
                          <span className="text-gray-600 font-medium">{crumb.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative max-w-2xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search documents, users, files..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 ml-8">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                <div className="relative pl-4 border-l border-gray-200" ref={profileRef}>
                  <button onClick={() => setIsProfileOpen((v) => !v)} className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">Juan Dela Cruz</p>
                      <p className="text-xs text-gray-500">{roleLabel}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">JD</div>
                    <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-gray-100 z-50 overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
                      <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base">JD</div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Juan Dela Cruz</p>
                            <p className="text-xs text-gray-500">{roleLabel}</p>
                            <p className="text-xs text-blue-500 mt-0.5">juan@onedata.gov.ph</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><User size={15} className="text-blue-500" /></div>
                          <span className="font-medium">View Profile</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Settings size={15} className="text-gray-500" /></div>
                          <span className="font-medium">Settings</span>
                        </button>
                      </div>
                      <div className="mx-3 border-t border-gray-100" />
                      <div className="p-2">
                        <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><LogOut size={15} className="text-red-500" /></div>
                          <span className="font-medium">Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">{renderCurrentView()}</div>
        </div>
      </div>
    </>
  );
}