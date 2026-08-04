//REPOSITORY SECTION FOLDER DETAIL PAGE
import { useMemo, useState, useEffect } from "react";
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
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { RepositoryHeader } from "../../components/RepositoryComponents/RepositoryHeader";
import RepositoryBackButton from "../../components/RepositoryComponents/RepositoryBackButton";
import FileEditModal from "../../components/RepositoryComponents/FileEditModal";
import LockedActionButton from "../../components/RepositoryComponents/LockedActionButton";
import { useUser } from "../../contexts/UserContext";
import { getSectionAccessLevel } from "../../utils/accessControl";

const roleDisplayMap = {
  division_focal: "Division Focal Person",
  section_focal: "Section Officer",       // fixed: was "sectionFocal"
  section_personnel: "Section Personnel", // fixed: was "personnel"
  admin: "Administrator",
};
const getRoleDisplay = (role) => roleDisplayMap[role] ?? role;

function getBucket(category) {
  return category === "general" || !category
    ? "repository-files"
    : "excel-files";
}

function getFileIcon(type) {
  switch (type) {
    case "PDF":
      return { Icon: FileType, color: "text-red-500", bg: "bg-red-50" };
    case "Excel":
    case "Spreadsheet":
      return {
        Icon: FileSpreadsheet,
        color: "text-green-600",
        bg: "bg-green-50",
      };
    case "Word":
    case "Document":
      return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-50" };
    case "Image":
      return { Icon: Image, color: "text-purple-500", bg: "bg-purple-50" };
    default:
      return { Icon: File, color: "text-gray-400", bg: "bg-gray-50" };
  }
}

function getStatusStyle(status) {
  if (status === "Approved" || status === "Verified")
    return "bg-green-50 text-green-700 border-green-200";
  if (status === "For Review" || status === "Unverified")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-gray-50 text-gray-500 border-gray-200";
}

const FILE_TYPE_TABS = ["All", "PDF", "Excel", "Word", "Image"];

function inferType(mimeType, fileName) {
  if (!mimeType && !fileName) return "Other";
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (mimeType?.includes("pdf") || ext === "pdf") return "PDF";
  if (mimeType?.includes("sheet") || ["xlsx", "xls", "csv"].includes(ext))
    return "Excel";
  if (mimeType?.includes("word") || ["docx", "doc"].includes(ext))
    return "Word";
  if (
    mimeType?.includes("image") ||
    ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
  )
    return "Image";
  if (ext === "pptx" || ext === "ppt") return "Other";
  return "Other";
}

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

export default function RepositoryFolderDetailPage() {
  const { folderName } = useParams();
  const navigate = useNavigate();

  const decodedName = decodeURIComponent(folderName || "");

  const [editingFile, setEditingFile] = useState(null);

  const { userProfile } = useUser();

  // ── Supabase state ─────────────────────────────────────────────
  const [section, setSection] = useState(null);
  const [division, setDivision] = useState(null);
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Local UI state ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("date");

  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const [fileToDelete, setFileToDelete] = useState(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  // ── Access control ──────────────────────────────────────────────
  const accessLevel = useMemo(
    () => getSectionAccessLevel(userProfile, section),
    [userProfile, section],
  );
  const canEdit = accessLevel === "full";

  useEffect(() => {
    if (!section || !userProfile) return;
    if (getSectionAccessLevel(userProfile, section) === "blocked") {
      navigate(`/repository/restricted/${encodeURIComponent(section.name)}`, {
        replace: true,
      });
    }
  }, [section, userProfile, navigate]);

  async function handleDownloadFile(file) {
    if (!canEdit) return; // defense in depth — button shouldn't be clickable anyway
    if (!file.path) {
      alert("This file has no associated storage path.");
      return;
    }

    setDownloadingId(file.id);

    try {
      const bucket = getBucket(file.data_category);
      const { data: blob, error } = await supabase.storage
        .from(bucket)
        .download(file.path);

      if (error) throw new Error(`Download failed: ${error.message}`);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      await logAuditEvent({
        action: "Download",
        fileName: file.name,
        details: `Downloaded from ${section?.name ?? "unknown section"}`,
        status: "Success",
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong while downloading the file.");

      await logAuditEvent({
        action: "Download",
        fileName: file.name,
        details: err.message,
        status: "Failed",
      });
    } finally {
      setDownloadingId(null);
    }
  }

  const logAuditEvent = async ({
    action,
    fileName,
    details,
    status = "Success",
  }) => {
    const { error } = await supabase.from("audit_logs").insert({
      action,
      file_name: fileName,
      details,
      performed_by: userProfile?.full_name ?? "Unknown",
      role: getRoleDisplay(userProfile?.role) ?? "Unknown",
      status,
    });
    if (error) console.error("Audit log insert failed:", error);
  };

  function handleDeleteFile(file) {
    if (!canEdit) return; // defense in depth
    setFileToDelete(file);
  }

  async function confirmDeleteFile() {
    const file = fileToDelete;
    if (!file) return;

    setDeletingId(file.id);

    try {
      if (file.path) {
        const { error: storageError } = await supabase.storage
          .from("excel-files")
          .remove([file.path]);

        if (storageError) {
          throw new Error(`Storage deletion failed: ${storageError.message}`);
        }
      }

      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

      setAllFiles((prev) => prev.filter((f) => f.id !== file.id));
      await logAuditEvent({
        action: "Delete",
        fileName: file.name,
        details: `Deleted from ${section?.name ?? "unknown section"}`,
        status: "Success",
      });

      setFileToDelete(null);
      setShowDeleteToast(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong while deleting the file.");

      await logAuditEvent({
        action: "Delete",
        fileName: file.name,
        details: err.message,
        status: "Failed",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function fetchData() {
    setLoading(true);
    setError(null);

    const { data: sectionData, error: sectionError } = await supabase
      .from("sections")
      .select("id, name, managed_by, division_id")
      .eq("name", decodedName)
      .single();

    if (sectionError) {
      setError(sectionError.message);
      setLoading(false);
      return;
    }

    setSection(sectionData);

    const { data: divisionData, error: divisionError } = await supabase
      .from("divisions")
      .select("id, name, managed_by")
      .eq("id", sectionData.division_id)
      .single();

    if (!divisionError) setDivision(divisionData);

    const { data: filesData } = await supabase
      .from("files")
      .select("*")
      .eq("section_id", sectionData.id)
      .order("created_at", { ascending: false });

    const uploaderIds = [
      ...new Set((filesData || []).map((f) => f.uploaded_by).filter(Boolean)),
    ];

    let uploaderMap = {};
    if (uploaderIds.length > 0) {
      const { data: uploaderRows, error: uploaderError } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", uploaderIds);

      if (uploaderError) {
        console.error("Failed to resolve uploader names:", uploaderError.message);
      } else {
        uploaderMap = Object.fromEntries(
          uploaderRows.map((u) => [u.id, u.full_name]),
        );
      }
    }

    const mapped = (filesData || []).map((f) => ({
      id: f.id,
      name: f.file_name,
      type: inferType(f.file_type, f.file_name),
      size: f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : "—",
      date: f.created_at
        ? new Date(f.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        : "—",
      uploader: uploaderMap[f.uploaded_by] ?? "Unknown",
      status: f.is_dashboard_source ? "Verified" : "For Review",
      path: f.file_path,
      data_category: f.data_category,
      school_year: f.school_year,
    }));

    setAllFiles(mapped);
    setLoading(false);
  }

  useEffect(() => {
    if (!decodedName) return;
    fetchData();
  }, [decodedName]);

  useEffect(() => {
    if (!showDeleteToast) return;
    const timer = setTimeout(() => setShowDeleteToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showDeleteToast]);

  const backTarget = division
    ? `/repository/divisions/${division.id}`
    : "/repository";

  const backLabel = division?.name ?? "Repository";

  const filtered = useMemo(() => {
    return allFiles
      .filter((file) => {
        const matchesSearch =
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.uploader.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = activeType === "All" || file.type === activeType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "size") return parseFloat(b.size) - parseFloat(a.size);
        return new Date(b.date) - new Date(a.date);
      });
  }, [allFiles, activeType, searchQuery, sortBy]);

  const typeCounts = FILE_TYPE_TABS.reduce((acc, type) => {
    acc[type] =
      type === "All"
        ? allFiles.length
        : allFiles.filter((f) => f.type === type).length;
    return acc;
  }, {});

  return (
    <div className="p-8">
      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <RepositoryBackButton
          onClick={() => navigate(backTarget)}
          label={backLabel}
        />
        <span className="text-slate-400">/</span>
        <span className="text-slate-700 font-medium truncate max-w-100">
          {decodedName}
        </span>
      </div>

      <RepositoryHeader
        title={decodedName}
        subtitle={`${allFiles.length} files · Last modified ${allFiles[0]?.date ?? "—"}`}
      />

      {/* ── Locked-access banner ────────────────────────────────── */}
      {accessLevel === "locked" && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <Lock size={14} className="shrink-0" />
          You can view files in this section, but view, download, edit, and
          delete are limited to your assigned section.
        </div>
      )}

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Managed by
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {loading ? "—" : (section?.managed_by ?? "—")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Division
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {loading ? "—" : (division?.name ?? "—")}
          </p>
        </div>
      </div>

      {/* ── Search / sort / view ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <div className="flex-1 w-full relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search files by name or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="text-slate-400" size={16} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
          </div>

          <div className="flex items-center gap-1 border border-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
            >
              <Grid3x3 size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {FILE_TYPE_TABS.map((tab) => {
            const isActive = activeType === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveType(tab)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all border ${isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 border-slate-100 bg-white"
                  }`}
              >
                {tab}
                <span
                  className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                    }`}
                >
                  {typeCounts[tab]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Showing{" "}
        <span className="font-medium text-slate-700">{filtered.length}</span> of{" "}
        {allFiles.length} files
      </p>

      {/* ── File list / grid ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            No files found
          </h3>
          <p className="text-sm text-slate-400">
            {loading
              ? "Loading…"
              : "No files have been uploaded to this section yet."}
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
            {["File Name", "Type", "Size", "Modified", "Uploaded By", ""].map(
              (h) => (
                <span
                  key={h}
                  className="text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </span>
              ),
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map((file) => {
              const { Icon, color, bg } = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}
                    >
                      <Icon size={16} className={color} />
                    </div>
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {file.name}
                    </span>
                  </div>
                  <span className={`text-[11px] font-medium ${color}`}>
                    {file.type}
                  </span>
                  <span className="text-xs text-slate-500">{file.size}</span>
                  <span className="text-xs text-slate-500">{file.date}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-medium text-white">
                        {file.uploader
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 truncate">
                      {file.uploader}
                    </span>
                  </div>

                  {canEdit ? (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingFile(file)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        disabled={downloadingId === file.id}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file)}
                        disabled={deletingId === file.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <LockedActionButton label="View — outside your section" />
                      <LockedActionButton label="Download — outside your section" />
                      <LockedActionButton label="Delete — outside your section" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((file) => {
            const { Icon, color, bg } = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div
                  className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105`}
                >
                  <Icon size={24} className={color} />
                </div>
                <p className="text-xs font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
                  {file.name}
                </p>
                <p className="text-[11px] text-gray-400">
                  {file.size} · {file.date}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(file.status)}`}
                  >
                    {file.status}
                  </span>

                  {canEdit ? (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                        disabled={downloadingId === file.id}
                        className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFile(file);
                        }}
                        className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file);
                        }}
                        disabled={deletingId === file.id}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <LockedActionButton
                        label="Download — outside your section"
                        size={12}
                      />
                      <LockedActionButton
                        label="View — outside your section"
                        size={12}
                      />
                      <LockedActionButton
                        label="Delete — outside your section"
                        size={12}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <FileEditModal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        file={editingFile}
        uploaderName={editingFile?.uploader}
        onSaved={() => {
          setEditingFile(null);
          if (decodedName) {
            fetchData();
          }
        }}
      />

      <DeleteFileConfirmModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDeleteFile}
        fileName={fileToDelete?.name || ""}
        isDeleting={deletingId === fileToDelete?.id}
      />

      {showDeleteToast && (
        <div
          className="fixed top-6 right-6 z-50 flex bg-white overflow-hidden animate-toast-in"
          style={{
            width: "360px",
            height: "72px",
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <div style={{ width: "6px", backgroundColor: "#43D45B", flexShrink: 0 }} />

          <div
            className="flex items-center flex-1 relative"
            style={{ padding: "0 14px", gap: "12px" }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "#43D45B",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className="flex flex-col justify-center">
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#1F1F2E", lineHeight: 1.2, margin: 0 }}>
                Success
              </p>
              <p style={{ fontSize: "12.5px", fontWeight: 500, color: "#666666", marginTop: "2px", margin: 0 }}>
                File deleted successfully.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteToast(false)}
              className="absolute top-2 right-2.5 cursor-pointer"
              style={{
                color: "#666666",
                background: "none",
                border: "none",
                fontSize: "16px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}