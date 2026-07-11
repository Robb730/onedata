import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  FolderOpen,
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
} from "lucide-react";

import RepositoryBackButton from "../../components/RepositoryComponents/RepositoryBackButton";
import { REPOSITORY_TOP_LEVEL_FILES_BY_NAME } from "../../constants/repositoryFolders";
import FileEditModal from "../../components/RepositoryComponents/FileEditModal";

// ── Helpers ───────────────────────────────────────────────────────
function getFileIcon(type) {
  switch (type) {
    case "PDF":
      return { Icon: FileType, color: "text-red-500", bg: "bg-red-50" };
    case "Excel":
      return {
        Icon: FileSpreadsheet,
        color: "text-green-600",
        bg: "bg-green-50",
      };
    case "Spreadsheet":
      return {
        Icon: FileSpreadsheet,
        color: "text-green-600",
        bg: "bg-green-50",
      };
    case "Word":
      return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-50" };
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
  data_category: f.data_category, // ← add
  school_year: f.school_year, // ← add
}));

// ── FolderDetailPage ──────────────────────────────────────────────
export default function FolderDetailPage() {
  const { folderName } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(folderName);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("date");

  const allFiles = REPOSITORY_TOP_LEVEL_FILES_BY_NAME[decodedName] || [];

  const [editingFile, setEditingFile] = useState(null);

  // ── Filter + sort ────────────────────────────────────────────
  const filtered = allFiles
    .filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.uploader.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeType === "All" || f.type === activeType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return parseFloat(b.size) - parseFloat(a.size);
      return new Date(b.date) - new Date(a.date); // default: date desc
    });

  const typeCounts = FILE_TYPE_TABS.reduce((acc, t) => {
    acc[t] =
      t === "All"
        ? allFiles.length
        : allFiles.filter((f) => f.type === t).length;
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <RepositoryBackButton to="/repository" />
        <span>/</span>
        <span className="text-slate-700 font-semibold truncate max-w-100">
          {decodedName}
        </span>
      </div>

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <FolderOpen className="text-blue-500" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
                {decodedName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {allFiles.length} files · Last modified{" "}
                {allFiles[0]?.date ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search / sort / view ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 w-full relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search files by name or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="text-gray-400" size={16} />
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

          {/* View toggle */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
            >
              <Grid3x3 size={16} />
            </button>
          </div>
        </div>

        {/* Type filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILE_TYPE_TABS.map((tab) => {
            const isActive = activeType === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveType(tab)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 border-gray-200 bg-white"
                }`}
              >
                {tab}
                <span
                  className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {typeCounts[tab]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── File count ───────────────────────────────────────── */}
      <p className="text-sm text-gray-500 mb-4">
        Showing{" "}
        <span className="font-semibold text-gray-700">{filtered.length}</span>{" "}
        of {allFiles.length} files
      </p>

      {/* ── File list / grid ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No files found
          </h3>
          <p className="text-sm text-gray-400">
            Try adjusting your search or filter
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* ── LIST VIEW ── */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
            {["File Name", "Type", "Size", "Modified", "Uploaded By", ""].map(
              (h) => (
                <span
                  key={h}
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
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
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}
                    >
                      <Icon size={16} className={color} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </span>
                  </div>

                  {/* Type */}
                  <span
                    className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getFileIcon(file.type).color} bg-opacity-10`}
                    style={{ backgroundColor: undefined }}
                  >
                    <span
                      className={`text-[11px] font-bold ${getFileIcon(file.type).color}`}
                    >
                      {file.type}
                    </span>
                  </span>

                  {/* Size */}
                  <span className="text-xs text-gray-500">{file.size}</span>

                  {/* Date */}
                  <span className="text-xs text-gray-500">{file.date}</span>

                  {/* Uploader */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-white">
                        {file.uploader
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 truncate">
                      {file.uploader}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingFile(file)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Preview"
                    >
                      <Eye size={14} />
                    </button>
                    <FileEditModal
                      isOpen={!!editingFile}
                      onClose={() => setEditingFile(null)}
                      file={editingFile}
                      uploaderName={editingFile?.uploader}
                      onSaved={() => {
                        // re-fetch files so the list reflects new size/timestamp
                        setEditingFile(null);
                        // trigger your existing fetchData() again, or just reload allFiles
                      }}
                    />
                    <button
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      title="More"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── GRID VIEW ── */
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
