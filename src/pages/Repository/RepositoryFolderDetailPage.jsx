//REPOSITORY SECTION FOLDER DETAIL PAGE
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FileText,
  Search,
  Grid3x3,
  List,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  Image,
  FileType,
  SlidersHorizontal,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ChevronRight,
  Upload,
  Tag,
  Link2,
  User,
  Building2,
  ShieldCheck,
  Shield,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import RepositoryBackButton from "../../components/RepositoryComponents/RepositoryBackButton";
import FileEditModal from "../../components/RepositoryComponents/FileEditModal";
import LockedActionButton from "../../components/RepositoryComponents/LockedActionButton";
import { useUser } from "../../contexts/UserContext";
import { getSectionAccessLevel } from "../../utils/accessControl";

// ── Role map ────────────────────────────────────────────────────
const roleDisplayMap = {
  division_focal: "Division Focal Person",
  section_focal: "Section Officer",
  section_personnel: "Section Personnel",
  admin: "Administrator",
};
const getRoleDisplay = (role) => roleDisplayMap[role] ?? role;

function getBucket(category) {
  return category === "general" || !category ? "repository-files" : "excel-files";
}

// ── File icon helper ─────────────────────────────────────────────
function getFileIcon(type) {
  switch (type) {
    case "PDF":
      return { Icon: FileType, color: "text-red-500", bg: "bg-red-50" };
    case "Excel":
    case "Spreadsheet":
      return { Icon: FileSpreadsheet, color: "text-emerald-600", bg: "bg-emerald-50" };
    case "Word":
    case "Document":
      return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-50" };
    case "Image":
      return { Icon: Image, color: "text-violet-500", bg: "bg-violet-50" };
    default:
      return { Icon: File, color: "text-slate-400", bg: "bg-slate-50" };
  }
}

const FILE_TYPE_TABS = ["All", "PDF", "Excel", "Word", "Image"];

function inferType(mimeType, fileName) {
  if (!mimeType && !fileName) return "Other";
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (mimeType?.includes("pdf") || ext === "pdf") return "PDF";
  if (mimeType?.includes("sheet") || ["xlsx", "xls", "csv"].includes(ext)) return "Excel";
  if (mimeType?.includes("word") || ["docx", "doc"].includes(ext)) return "Word";
  if (mimeType?.includes("image") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "Image";
  return "Other";
}

// ── Avatar helpers ────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "bg-violet-500" },
  { bg: "bg-blue-500" },
  { bg: "bg-emerald-500" },
  { bg: "bg-amber-500" },
  { bg: "bg-rose-500" },
  { bg: "bg-cyan-500" },
  { bg: "bg-indigo-500" },
  { bg: "bg-pink-500" },
];

function hashStr(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function getAvatarColor(name) {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
}
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ── Relative date formatter ───────────────────────────────────────
function formatRelativeDate(dateStr) {
  if (!dateStr) return { relative: "—", time: "—", full: "—" };
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const fullStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (diffDays === 0) return { relative: "Today", time: timeStr, full: fullStr };
  if (diffDays === 1) return { relative: "Yesterday", time: timeStr, full: fullStr };
  if (diffDays < 7) return { relative: `${diffDays}d ago`, time: timeStr, full: fullStr };
  return { relative: fullStr, time: timeStr, full: fullStr };
}

// ─────────────────────────────────────────────────────────────────
// ── MODALS ────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────

// Delete confirmation
function DeleteFileConfirmModal({ isOpen, onClose, onConfirm, fileName, isDeleting }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col items-center text-center gap-4 px-8 pt-8 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
            <Trash2 className="text-red-600" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Delete file?</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              This will permanently remove
              <br />
              <span className="font-semibold text-slate-700">"{fileName}"</span>
              <br />
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-8 pb-8 pt-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Verify confirmation modal — matches the reference screenshot exactly
function VerifyConfirmModal({ isOpen, onClose, onConfirm, file, userProfile, isVerifying }) {
  if (!isOpen || !file) return null;
  const { Icon, color, bg } = getFileIcon(file.type);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const avatarColor = getAvatarColor(userProfile?.full_name ?? "");
  const isVerified = file.status === "Verified";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.22)] border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[1.05rem] font-black text-slate-800 tracking-[-0.02em]">
              {isVerified ? "Unverify File?" : "Confirm Verification"}
            </h2>
            <p className="text-[0.73rem] text-slate-400 font-medium mt-0.5">
              This action will be permanently recorded
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* File preview card */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{file.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {file.type} · {file.size} · Uploaded {formatRelativeDate(file.rawCreatedAt).full}
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="px-6 pt-4">
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-[12px] text-blue-700 leading-relaxed">
              {isVerified
                ? "By confirming, you are revoking the verified status of this document. It will be marked as unverified and may require re-review."
                : "By confirming, you certify that this document has been thoroughly reviewed and meets the required standards for official use. This verification will be permanently logged under your administrator account."}
            </p>
          </div>
        </div>

        {/* Recorded under */}
        <div className="px-6 pt-4 pb-5">
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 ${avatarColor.bg} rounded-full flex items-center justify-center shrink-0`}>
                <span className="text-xs font-bold text-white">{getInitials(userProfile?.full_name ?? "")}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Recorded Under</p>
                <p className="text-[12px] font-semibold text-slate-800 leading-tight">{userProfile?.full_name ?? "—"}</p>
                <p className="text-[10px] text-slate-400">{getRoleDisplay(userProfile?.role)}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Timestamp</p>
              <p className="text-[12px] font-semibold text-slate-800 leading-tight">{dateStr}</p>
              <p className="text-[10px] text-slate-400">{timeStr}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isVerifying}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isVerifying}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            <ShieldCheck size={15} />
            {isVerifying ? "Saving…" : isVerified ? "Unverify" : "Confirm Verification"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── POPOVERS (rendered outside table cell to avoid overflow clip) ─
// ─────────────────────────────────────────────────────────────────

// File info card (dark popover — matches reference)
function FileInfoCard({ file, onPreview, onDownload, canEdit }) {
  if (!file) return null;
  const { Icon, color, bg } = getFileIcon(file.type);
  const uploaded = formatRelativeDate(file.rawCreatedAt);
  const modified = formatRelativeDate(file.rawUpdatedAt || file.rawCreatedAt);

  return (
    <div className="w-64 rounded-2xl bg-white text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-200">
      {/* File header */}
      <div className="flex items-start gap-3 p-4 border-b border-slate-100">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon size={18} className={color} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-slate-800 leading-tight line-clamp-2">{file.name}</p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className={`font-bold ${color}`}>{file.type}</span>
            {file.status === "Verified"
              ? <span className="inline-flex items-center gap-0.5 text-emerald-600"><CheckCircle2 size={9} /> Verified</span>
              : <span className="inline-flex items-center gap-0.5 text-amber-500"><XCircle size={9} /> Not Verified</span>}
          </p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-px m-3 rounded-xl overflow-hidden bg-slate-200/50">
        {[
          { label: "TYPE", value: file.type },
          { label: "SIZE", value: file.size },
          { label: "UPLOADED", value: uploaded.full },
          { label: "MODIFIED", value: modified.full },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
            <p className="text-[11px] font-semibold text-slate-700">{value}</p>
          </div>
        ))}
      </div>

      {/* Tags */}
      {(file.school_year || file.data_category) && (
        <div className="flex items-center gap-2 px-3 mb-3 flex-wrap">
          <Tag size={10} className="text-slate-400 shrink-0" />
          {file.school_year && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100">
              {file.school_year}
            </span>
          )}
          {file.data_category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
              {file.data_category}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// User hover card
function UserInfoCard({ info }) {
  if (!info) return null;
  const { name = "", role, email, division, uploadCount } = info;
  const { bg } = getAvatarColor(name);

  return (
    <div className="w-56 rounded-2xl bg-white text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-200">
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <div className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center shrink-0`}>
          <span className="text-xs font-bold text-white">{getInitials(name)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-slate-800 leading-tight">{name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{getRoleDisplay(role)}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {email && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">EMAIL</p>
            <p className="text-[11px] text-slate-700 font-medium break-all">{email}</p>
          </div>
        )}
        {division && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">DIVISION</p>
            <p className="text-[11px] text-slate-700 font-medium">{division}</p>
          </div>
        )}
        {typeof uploadCount === "number" && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">UPLOADS</p>
            <p className="text-[11px] text-slate-700 font-medium">{uploadCount} files</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── MAIN PAGE COMPONENT ───────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
export default function RepositoryFolderDetailPage() {
  const { folderName } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(folderName || "");
  const { userProfile } = useUser();

  // ── Supabase state ─────────────────────────────────────────────
  const [section, setSection] = useState(null);
  const [division, setDivision] = useState(null);
  const [allFiles, setAllFiles] = useState([]);
  const [uploaderDetails, setUploaderDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── UI state ───────────────────────────────────────────────────
  const [editingFile, setEditingFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("date");
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  // ── Selection ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Verify modal ───────────────────────────────────────────────
  const [verifyTarget, setVerifyTarget] = useState(null); // file to verify/unverify
  const [isVerifying, setIsVerifying] = useState(false);

  // ── Hover popovers ─────────────────────────────────────────────
  const [hoveredFileId, setHoveredFileId] = useState(null);
  const [hoveredUploaderId, setHoveredUploaderId] = useState(null);
  const fileHoverTimer = useRef(null);
  const userHoverTimer = useRef(null);

  // ── Access control ─────────────────────────────────────────────
  const accessLevel = useMemo(
    () => getSectionAccessLevel(userProfile, section),
    [userProfile, section],
  );
  const canEdit = accessLevel === "full";

  useEffect(() => {
    if (!section || !userProfile) return;
    if (getSectionAccessLevel(userProfile, section) === "blocked") {
      navigate(`/repository/restricted/${encodeURIComponent(section.name)}`, { replace: true });
    }
  }, [section, userProfile, navigate]);

  // ── Data fetch ─────────────────────────────────────────────────
  async function fetchData() {
    setLoading(true);
    setError(null);

    const { data: sectionData, error: sectionError } = await supabase
      .from("sections")
      .select("id, name, managed_by, division_id")
      .eq("name", decodedName)
      .single();

    if (sectionError) { setError(sectionError.message); setLoading(false); return; }
    setSection(sectionData);

    const { data: divisionData, error: divisionError } = await supabase
      .from("divisions").select("id, name, managed_by").eq("id", sectionData.division_id).single();
    if (!divisionError) setDivision(divisionData);

    const { data: filesData } = await supabase
      .from("files").select("*").eq("section_id", sectionData.id).order("created_at", { ascending: false });

    const uploaderIds = [...new Set((filesData || []).map((f) => f.uploaded_by).filter(Boolean))];
    let uploaderMap = {};
    let uploaderDetailMap = {};

    if (uploaderIds.length > 0) {
      const { data: uploaderRows, error: uploaderError } = await supabase
        .from("users")
        .select("id, full_name, role, email, division_id, divisions(name)")
        .in("id", uploaderIds);

      if (!uploaderError && uploaderRows) {
        uploaderRows.forEach((u) => {
          uploaderMap[u.id] = u.full_name;
          uploaderDetailMap[u.id] = {
            name: u.full_name,
            role: u.role,
            email: u.email,
            division: u.divisions?.name ?? null,
            uploadCount: 0,
          };
        });
        (filesData || []).forEach((f) => {
          if (f.uploaded_by && uploaderDetailMap[f.uploaded_by]) {
            uploaderDetailMap[f.uploaded_by].uploadCount++;
          }
        });
      }
    }

    const mapped = (filesData || []).map((f) => ({
      id: f.id,
      name: f.file_name,
      type: inferType(f.file_type, f.file_name),
      size: f.file_size ? `${(f.file_size / 1024 / 1024).toFixed(1)} MB` : "—",
      rawSize: f.file_size || 0,
      rawCreatedAt: f.created_at,
      rawUpdatedAt: f.updated_at,
      uploader: uploaderMap[f.uploaded_by] ?? "Unknown",
      uploaderId: f.uploaded_by,
      status: f.is_dashboard_source ? "Verified" : "For Review",
      isDashboardSource: !!f.is_dashboard_source,
      path: f.file_path,
      data_category: f.data_category,
      school_year: f.school_year,
    }));

    setAllFiles(mapped);
    setUploaderDetails(uploaderDetailMap);
    setLoading(false);
  }

  useEffect(() => { if (decodedName) fetchData(); }, [decodedName]);
  useEffect(() => {
    if (!showDeleteToast) return;
    const t = setTimeout(() => setShowDeleteToast(false), 5000);
    return () => clearTimeout(t);
  }, [showDeleteToast]);

  // ── Handlers ────────────────────────────────────────────────────
  async function handleDownloadFile(file) {
    if (!canEdit || !file.path) return;
    setDownloadingId(file.id);
    try {
      const bucket = getBucket(file.data_category);
      const { data: blob, error } = await supabase.storage.from(bucket).download(file.path);
      if (error) throw new Error(error.message);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      await logAudit("Download", file.name, `Downloaded from ${section?.name}`, "Success");
    } catch (err) {
      console.error(err);
      await logAudit("Download", file.name, err.message, "Failed");
    } finally { setDownloadingId(null); }
  }

  const logAudit = async (action, fileName, details, status = "Success") => {
    const { error } = await supabase.from("audit_logs").insert({
      action, file_name: fileName, details,
      performed_by: userProfile?.full_name ?? "Unknown",
      role: getRoleDisplay(userProfile?.role) ?? "Unknown",
      status,
    });
    if (error) console.error("Audit log failed:", error);
  };

  function handleDeleteFile(file) {
    if (!canEdit) return;
    setFileToDelete(file);
  }

  async function confirmDeleteFile() {
    const file = fileToDelete;
    if (!file) return;
    setDeletingId(file.id);
    try {
      if (file.path) {
        const { error: storageErr } = await supabase.storage.from("excel-files").remove([file.path]);
        if (storageErr) throw new Error(storageErr.message);
      }
      const { error: dbErr } = await supabase.from("files").delete().eq("id", file.id);
      if (dbErr) throw new Error(dbErr.message);
      setAllFiles((prev) => prev.filter((f) => f.id !== file.id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(file.id); return n; });
      await logAudit("Delete", file.name, `Deleted from ${section?.name}`, "Success");
      setFileToDelete(null);
      setShowDeleteToast(true);
    } catch (err) {
      console.error(err);
      alert(err.message);
      await logAudit("Delete", file.name, err.message, "Failed");
    } finally { setDeletingId(null); }
  }

  // Verify/unverify toggle
  async function confirmVerify() {
    const file = verifyTarget;
    if (!file) return;
    setIsVerifying(true);
    try {
      const newValue = !file.isDashboardSource;
      const { error } = await supabase
        .from("files")
        .update({ is_dashboard_source: newValue })
        .eq("id", file.id);
      if (error) throw new Error(error.message);
      setAllFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, isDashboardSource: newValue, status: newValue ? "Verified" : "For Review" }
            : f
        )
      );
      const action = newValue ? "Verify" : "Unverify";
      await logAudit(action, file.name, `${action}d in ${section?.name}`, "Success");
      setVerifyTarget(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally { setIsVerifying(false); }
  }

  // ── Selection helpers ──────────────────────────────────────────
  const allFilteredSelected = filtered_local()?.length > 0 && filtered_local()?.every((f) => selectedIds.has(f.id));
  const someSelected = selectedIds.size > 0;
  function toggleSelectAll() {
    const f = filtered_local() ?? [];
    if (f.every((x) => selectedIds.has(x.id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(f.map((x) => x.id)));
  }
  function toggleSelect(id) {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function clearSelection() { setSelectedIds(new Set()); }

  // ── Filter + sort ──────────────────────────────────────────────
  function filtered_local() {
    return allFiles
      .filter((file) => {
        const matchSearch =
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.uploader.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = activeType === "All" || file.type === activeType;
        return matchSearch && matchType;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "size") return b.rawSize - a.rawSize;
        return new Date(b.rawCreatedAt) - new Date(a.rawCreatedAt);
      });
  }
  const filtered = useMemo(filtered_local, [allFiles, activeType, searchQuery, sortBy]);

  const typeCounts = FILE_TYPE_TABS.reduce((acc, type) => {
    acc[type] = type === "All" ? allFiles.length : allFiles.filter((f) => f.type === type).length;
    return acc;
  }, {});

  const verifiedCount = allFiles.filter((f) => f.status === "Verified").length;
  const backTarget = division ? `/repository/divisions/${division.id}` : "/repository";
  const backLabel = division?.name ?? "Repository";

  // ── Popover helpers ────────────────────────────────────────────
  function handleFileMouseEnter(fileId) {
    clearTimeout(fileHoverTimer.current);
    fileHoverTimer.current = setTimeout(() => setHoveredFileId(fileId), 400);
  }
  function handleFileMouseLeave() {
    clearTimeout(fileHoverTimer.current);
    setHoveredFileId(null);
  }
  function handleUserMouseEnter(uploaderId) {
    clearTimeout(userHoverTimer.current);
    userHoverTimer.current = setTimeout(() => setHoveredUploaderId(uploaderId), 400);
  }
  function handleUserMouseLeave() {
    clearTimeout(userHoverTimer.current);
    setHoveredUploaderId(null);
  }

  // ─────────────────────────────────────────────────────────────
  // ── RENDER ───────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="mx-auto max-w-[1200px] px-6 py-8">

        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-5 font-medium">
          <button onClick={() => navigate("/repository")} className="hover:text-slate-600 transition-colors">
            Repository
          </button>
          {division && (
            <>
              <ChevronRight size={12} />
              <button onClick={() => navigate(backTarget)} className="hover:text-slate-600 transition-colors truncate max-w-[180px]">
                {backLabel}
              </button>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-slate-700 font-semibold truncate max-w-[220px]">{decodedName}</span>
        </nav>

        {/* ── Page Header ────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[1.65rem] font-black text-slate-800 tracking-[-0.02em] leading-tight">
              {decodedName}
            </h1>
            <p className="text-[0.78rem] text-slate-400 font-medium mt-1">
              {loading ? "Loading…" : `${allFiles.length} files · ${verifiedCount} verified`}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => navigate("/upload-files")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all shrink-0"
            >
              <Upload size={15} />
              Upload File
            </button>
          )}
        </div>

        {/* ── Locked-access banner ──────────────────────────── */}
        {accessLevel === "locked" && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <Lock size={14} className="shrink-0" />
            You can view files in this section, but download, edit, and delete are limited to your assigned section.
          </div>
        )}

        {/* ── Stats row ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <User size={11} className="text-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Managed By</p>
            </div>
            <p className="text-[0.88rem] font-semibold text-slate-800">
              {loading ? "—" : (section?.managed_by ?? "—")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <Building2 size={11} className="text-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Division</p>
            </div>
            <p className="text-[0.88rem] font-semibold text-slate-800">
              {loading ? "—" : (division?.name ?? "—")}
            </p>
          </div>
        </div>

        {/* ── Search + Filter bar ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
            {/* Search */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search files by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-colors"
              />
            </div>

            {/* Sort + view toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                <SlidersHorizontal className="text-slate-400 shrink-0" size={13} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-[13px] text-slate-600 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="date">Sort: Date</option>
                  <option value="name">Sort: Name</option>
                  <option value="size">Sort: Size</option>
                </select>
              </div>
              <div className="flex items-center gap-0.5 border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                >
                  <Grid3x3 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Type filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILE_TYPE_TABS.map((tab) => {
              const isActive = activeType === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveType(tab)}
                  className={`px-3.5 py-1.5 text-[11px] font-semibold rounded-full transition-all border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 border-slate-200 bg-white"
                  }`}
                >
                  {tab}
                  <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {typeCounts[tab]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── File count + bulk bar ─────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {allFiles.length} files
          </p>
          {allFiles.length > 0 && (
            <p className="text-[11px] text-slate-400">○ All actions are audit-logged</p>
          )}
        </div>

        {/* ── Bulk action bar (Verify/Unverify only) ─────────── */}
        {someSelected && canEdit && (
          <div className="mb-3 flex items-center gap-3 px-4 py-3 rounded-2xl border border-blue-200 bg-blue-50">
            <span className="text-[13px] font-semibold text-blue-700">
              {selectedIds.size} file{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2 ml-1">
              {/* Determine if all selected are verified */}
              {(() => {
                const selectedFiles = filtered.filter((f) => selectedIds.has(f.id));
                const allVerified = selectedFiles.every((f) => f.status === "Verified");
                const anyUnverified = selectedFiles.some((f) => f.status !== "Verified");
                return (
                  <>
                    {anyUnverified && (
                      <button
                        onClick={() => {
                          const first = filtered.find((f) => selectedIds.has(f.id) && f.status !== "Verified");
                          if (first) setVerifyTarget(first);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors"
                      >
                        <ShieldCheck size={12} /> Verify Selected
                      </button>
                    )}
                    {allVerified && (
                      <button
                        onClick={() => {
                          const first = filtered.find((f) => selectedIds.has(f.id) && f.status === "Verified");
                          if (first) setVerifyTarget(first);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                      >
                        <XCircle size={12} /> Unverify
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
            <button
              onClick={clearSelection}
              className="ml-auto p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── File list / grid ──────────────────────────────── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
            <div className="inline-flex items-center gap-2 text-sm text-slate-400">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Loading files…
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
            <FileText className="mx-auto text-slate-300 opacity-60 mb-3" size={40} strokeWidth={1.5} />
            <h3 className="text-[0.95rem] font-bold text-slate-700 mb-1">No files found</h3>
            <p className="text-[0.78rem] font-medium text-slate-400">
              {searchQuery ? `No files matching "${searchQuery}"` : "No files have been uploaded to this section yet."}
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* ── LIST VIEW ───────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-100 overflow-visible shadow-sm">
            {/* TABLE using real <table> for perfect alignment */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {/* Checkbox */}
                  <th className="w-10 pl-4 pr-2 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center w-5 h-5 rounded border border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors bg-white"
                    >
                      {allFilteredSelected ? (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : null}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 min-w-[220px]">File</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-36">Status</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-24">Size</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-44">Uploaded By</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-36">Date Uploaded</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-36">Last Modified</th>
                  <th className="px-3 py-3 pr-4 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((file, index) => {
                  const isNearBottom = index >= Math.ceil(filtered.length / 2) && filtered.length > 2;
                  const verticalPos = isNearBottom ? "bottom-[-10px]" : "top-[-10px]";
                  const { Icon, color, bg } = getFileIcon(file.type);
                  const isSelected = selectedIds.has(file.id);
                  const isVerified = file.status === "Verified";
                  const uploaded = formatRelativeDate(file.rawCreatedAt);
                  const modified = formatRelativeDate(file.rawUpdatedAt || file.rawCreatedAt);
                  const uploaderInfo = uploaderDetails[file.uploaderId];
                  const { bg: avatarBg } = getAvatarColor(file.uploader);
                  const isFileHovered = hoveredFileId === file.id;
                  const isUserHovered = hoveredUploaderId === file.uploaderId && file.uploaderId;

                  return (
                    <tr
                      key={file.id}
                      className={`group relative transition-colors ${
                        isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="pl-4 pr-2 py-3.5 w-10">
                        <button
                          onClick={() => toggleSelect(file.id)}
                          className="flex items-center justify-center w-5 h-5 rounded border text-slate-400 hover:border-blue-400 transition-colors bg-white"
                          style={{
                            borderColor: isSelected ? "#3b82f6" : undefined,
                            backgroundColor: isSelected ? "#3b82f6" : undefined,
                            color: isSelected ? "#fff" : undefined,
                          }}
                        >
                          {isSelected && (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </td>

                      {/* File cell — with hover popover */}
                      <td className="px-3 py-3.5 min-w-[220px]">
                        <div
                          className="relative inline-block"
                          onMouseEnter={() => handleFileMouseEnter(file.id)}
                          onMouseLeave={handleFileMouseLeave}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                              <Icon size={14} className={color} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-800 truncate max-w-[200px] leading-tight">
                                {file.name}
                              </p>
                              <p className={`text-[10px] font-semibold ${color} leading-none mt-0.5`}>
                                {file.type}
                              </p>
                            </div>
                          </div>
                          {/* File hover popover */}
                          <div
                            className={`absolute z-50 left-[calc(100%+20px)] ${verticalPos} transition-all duration-200 ease-out origin-left ${
                              isFileHovered
                                ? "opacity-100 visible scale-100 pointer-events-auto"
                                : "opacity-0 invisible scale-95 pointer-events-none"
                            }`}
                          >
                            <FileInfoCard
                              file={file}
                              canEdit={canEdit}
                              onPreview={() => { setHoveredFileId(null); setEditingFile(file); }}
                              onDownload={() => { setHoveredFileId(null); handleDownloadFile(file); }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status badge — clickable to open verify modal */}
                      <td className="px-3 py-3.5 w-36">
                        <button
                          onClick={() => canEdit && setVerifyTarget(file)}
                          disabled={!canEdit}
                          title={canEdit ? (isVerified ? "Click to unverify" : "Click to verify") : ""}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            isVerified
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {isVerified
                            ? <><CheckCircle2 size={10} /> Verified ✓</>
                            : <><XCircle size={10} className="opacity-60" /> Not Verified</>}
                        </button>
                      </td>

                      {/* Size */}
                      <td className="px-3 py-3.5 w-24">
                        <span className="text-[12px] text-slate-500 font-medium">{file.size}</span>
                      </td>

                      {/* Uploaded By — with user popover */}
                      <td className="px-3 py-3.5 w-44">
                        <div
                          className="relative inline-block"
                          onMouseEnter={() => file.uploaderId && handleUserMouseEnter(file.uploaderId)}
                          onMouseLeave={handleUserMouseLeave}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 ${avatarBg} rounded-full flex items-center justify-center shrink-0`}>
                              <span className="text-[9px] font-bold text-white">{getInitials(file.uploader)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-slate-700 truncate max-w-[110px] leading-tight">{file.uploader}</p>
                              {uploaderInfo?.role && (
                                <p className="text-[10px] text-slate-400 leading-none mt-0.5 truncate max-w-[110px]">
                                  {getRoleDisplay(uploaderInfo.role)}
                                </p>
                              )}
                            </div>
                          </div>
                          {/* User hover popover */}
                          {uploaderInfo && (
                            <div
                              className={`absolute z-50 left-[calc(100%+20px)] ${verticalPos} transition-all duration-200 ease-out origin-left ${
                                isUserHovered
                                  ? "opacity-100 visible scale-100 pointer-events-auto"
                                  : "opacity-0 invisible scale-95 pointer-events-none"
                              }`}
                            >
                              <UserInfoCard info={uploaderInfo} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date Uploaded */}
                      <td className="px-3 py-3.5 w-36">
                        <p className="text-[12px] font-semibold text-slate-700 leading-tight">{uploaded.relative}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{uploaded.time}</p>
                      </td>

                      {/* Last Modified */}
                      <td className="px-3 py-3.5 w-36">
                        <p className="text-[12px] font-semibold text-slate-700 leading-tight">{modified.relative}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{modified.time}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5 pr-4 w-28">
                        {canEdit ? (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
                            <button
                              onClick={() => setEditingFile(file)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-colors"
                              title="Preview"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDownloadFile(file)}
                              disabled={downloadingId === file.id}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-colors disabled:opacity-40"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file)}
                              disabled={deletingId === file.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors"
                              title="More"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <LockedActionButton label="View — outside your section" />
                            <LockedActionButton label="Download — outside your section" />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <p className="text-[11px] text-slate-400">
                {allFiles.length} file{allFiles.length !== 1 ? "s" : ""} · Click status badge to verify or unverify
              </p>
              <p className="text-[11px] text-slate-400">○ All actions are audit-logged</p>
            </div>
          </div>
        ) : (
          /* ── GRID VIEW ───────────────────────────────────── */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((file) => {
              const { Icon, color, bg } = getFileIcon(file.type);
              const isSelected = selectedIds.has(file.id);
              const isVerified = file.status === "Verified";
              const uploaded = formatRelativeDate(file.rawCreatedAt);

              return (
                <div
                  key={file.id}
                  className={`relative bg-white rounded-2xl border p-4 transition-all cursor-pointer group ${
                    isSelected
                      ? "border-blue-300 shadow-md ring-1 ring-blue-100"
                      : "border-slate-100 hover:shadow-md hover:border-slate-200 shadow-sm"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(file.id)}
                    className={`absolute top-3 left-3 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white opacity-100"
                        : "bg-white border-slate-300 text-transparent opacity-0 group-hover:opacity-100 hover:border-blue-400"
                    }`}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {/* Status + verify */}
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={() => canEdit && setVerifyTarget(file)}
                      disabled={!canEdit}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all ${
                        isVerified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                    >
                      {isVerified ? <><CheckCircle2 size={8} /> Verified</> : <><XCircle size={8} /> Not Verified</>}
                    </button>
                  </div>

                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105`}>
                    <Icon size={22} className={color} />
                  </div>
                  <p className="text-[12px] font-semibold text-slate-800 leading-tight mb-1 line-clamp-2">{file.name}</p>
                  <p className="text-[10px] text-slate-400 mb-3">{file.size} · {uploaded.relative}</p>

                  {canEdit && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadFile(file); }}
                        disabled={downloadingId === file.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-medium"
                      >
                        <Download size={11} /> Download
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingFile(file); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-medium"
                      >
                        <Eye size={11} /> Preview
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}
                        disabled={deletingId === file.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors text-[10px] font-medium disabled:opacity-40"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>{/* end max-w container */}

      {/* ── Modals ──────────────────────────────────────────── */}
      <FileEditModal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        file={editingFile}
        uploaderName={editingFile?.uploader}
        onSaved={() => { setEditingFile(null); if (decodedName) fetchData(); }}
      />

      <DeleteFileConfirmModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDeleteFile}
        fileName={fileToDelete?.name || ""}
        isDeleting={deletingId === fileToDelete?.id}
      />

      <VerifyConfirmModal
        isOpen={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        onConfirm={confirmVerify}
        file={verifyTarget}
        userProfile={userProfile}
        isVerifying={isVerifying}
      />

      {/* ── Success toast ──────────────────────────────────── */}
      {showDeleteToast && (
        <div
          className="fixed top-6 right-6 z-50 flex bg-white overflow-hidden"
          style={{ width: 360, height: 72, borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,0.12)", fontFamily: "Poppins, sans-serif" }}
        >
          <div style={{ width: 6, backgroundColor: "#43D45B", flexShrink: 0 }} />
          <div className="flex items-center flex-1 relative" style={{ padding: "0 14px", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "#43D45B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1F1F2E", lineHeight: 1.2, margin: 0 }}>Success</p>
              <p style={{ fontSize: 12.5, fontWeight: 500, color: "#666", marginTop: 2, margin: 0 }}>File deleted successfully.</p>
            </div>
            <button onClick={() => setShowDeleteToast(false)} className="absolute top-2 right-2.5" style={{ color: "#666", background: "none", border: "none", fontSize: 16, lineHeight: 1, cursor: "pointer" }}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}