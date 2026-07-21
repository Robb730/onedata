import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FileText,
  Search,
  Grid3x3,
  List,
  Download,
  Eye,
  MoreHorizontal,
  File,
  FileSpreadsheet,
  Image,
  FileType,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { RepositoryHeader } from "../../components/RepositoryComponents/RepositoryHeader";
import RepositoryBackButton from "../../components/RepositoryComponents/RepositoryBackButton";
import FileEditModal from "../../components/RepositoryComponents/FileEditModal";

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

export default function RepositoryFolderDetailPage() {
  const { folderName } = useParams();
  const navigate = useNavigate();

  const decodedName = decodeURIComponent(folderName || "");

  const [editingFile, setEditingFile] = useState(null);

  

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

  // delete files
  async function handleDeleteFile(file) {
    const confirmed = window.confirm(
      `Delete "${file.name}"? This will permanently remove the file from storage and cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(file.id);

    try {
      // 1. Remove the object from Supabase Storage first
      if (file.path) {
        const { error: storageError } = await supabase.storage
          .from("excel-files") // ← replace with your actual bucket name
          .remove([file.path]);

        if (storageError) {
          throw new Error(`Storage deletion failed: ${storageError.message}`);
        }
      }

      // 2. Remove the row from the files table
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

      // 3. Update local state so the UI reflects the deletion immediately
      setAllFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong while deleting the file.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Fetch section → division → files ──────────────────────────
  

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
    uploader: f.uploaded_by ?? "Unknown",
    status: f.is_dashboard_source ? "Verified" : "For Review",
    path: f.file_path,
    data_category: f.data_category,
    school_year: f.school_year,
  }));

  setAllFiles(mapped);
  setLoading(false);
}
useEffect(() => {
  if(!decodedName) return;
  fetchData();
}, [decodedName]);



  // ── Back target uses real division id ─────────────────────────
  const backTarget = division
    ? `/repository/divisions/${division.id}`
    : "/repository";

  const backLabel = division?.name ?? "Repository";

  // ── Filter + sort files ───────────────────────────────────────
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
              className={`p-2 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "grid"
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
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 border-slate-100 bg-white"
                }`}
              >
                {tab}
                <span
                  className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingFile(file)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Preview"
                    >
                      <Eye size={14} />
                    </button>
                    <button
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
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
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
                        e.stopPropagation(); // prevent the card's own onClick (if you add one later) from firing
                        handleDeleteFile(file);
                      }}
                      disabled={deletingId === file.id}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={12} />
                    </button>

                    
                  </div>
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
          // re-fetch so size/timestamp refresh in the list
          if (decodedName) {
            // simplest option: trigger your existing fetchData by re-running the effect
            // e.g. call a shared fetchFiles() function, or just window.location.reload() for now
          }
        }}
      />
    </div>
  );
}
