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
  MessageSquare,
  Image,
  FileType,
  SlidersHorizontal,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Upload,
  FileUp,
  Tag,
  Link2,
  User,
  Building2,
  ShieldCheck,
  Shield,
  X,
  CheckCircle,
  Clock,
  Inbox,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import RepositoryBackButton from "../../components/RepositoryComponents/RepositoryBackButton";
import FileEditModal from "../../components/RepositoryComponents/FileEditModal";
import LockedActionButton from "../../components/RepositoryComponents/LockedActionButton";
import { useUser } from "../../contexts/UserContext";
import { getSectionAccessLevel } from "../../utils/accessControl";
import { notifyScope, pushNotification } from "../../utils/notifications";
import FileAccessRequestModal from "../../components/RepositoryComponents/FileAccessRequestModal";
import AccessRequestsSidebar from "../../components/RepositoryComponents/AccessRequestsSidebar";
import FloatingAccessRequestsButton from "../../components/RepositoryComponents/FloatingAccessRequestsButton";
import { RepositorySearchBar } from "../../components/RepositoryComponents";
import FileRequestModal from "../../components/RepositoryComponents/FileRequestModal";
import FileRequestsPanel from "../../components/RepositoryComponents/FileRequestsPanel";
import ModalPortal from "../../components/Modals/ModalPortal";

import FileActionsMenu from "../../components/RepositoryComponents/FileActionsMenu";
import FileFeedbackModal from "../../components/RepositoryComponents/FileFeedbackModal";

import DownloadOptionsMenu from "../../components/RepositoryComponents/DownloadOptionsMenu";

// ── Role map ────────────────────────────────────────────────────
const roleDisplayMap = {
  division_focal: "Division Focal Person",
  section_focal: "Section Officer",
  section_personnel: "Section Personnel",
  admin: "Administrator",
};
const getRoleDisplay = (role) => roleDisplayMap[role] ?? role;

// Must stay in sync with STRUCTURED_UPLOAD_TYPES in UploadFilesPage.jsx.
// Only these categories are stored in "excel-files"; everything else
// (including general) goes to "repository-files".
const EXCEL_BUCKET_TYPES = new Set([
  "enrollment",
  "classrooms",
  "seats",
  "teachers_inventory",
  "textbook_inventory",
  "cespes",
  "performance_indicators",
  // Dashboard file categories — stored in excel-files
  "aip_school",
  "aip_sdo",
  "qbedp",
  "accomplishment_report",
]);

function getBucket(category) {
  return EXCEL_BUCKET_TYPES.has(category) ? "excel-files" : "repository-files";
}

const ALL_FILE_BUCKETS = ["repository-files", "excel-files"];

// ── File icon helper ─────────────────────────────────────────────
function getFileIcon(type) {
  switch (type) {
    case "PDF":
      return { Icon: FileType, color: "text-red-500", bg: "bg-red-50" };
    case "Excel":
    case "Spreadsheet":
      return {
        Icon: FileSpreadsheet,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      };
    case "Word":
    case "Document":
      return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-50" };
    case "Image":
      return { Icon: Image, color: "text-violet-500", bg: "bg-violet-50" };
    default:
      return { Icon: File, color: "text-slate-400", bg: "bg-slate-50" };
  }
}

function LockedFileButton({ Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="relative p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-colors"
    >
      <Icon size={14} />
      <Lock
        size={9}
        className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full text-slate-400"
      />
    </button>
  );
}

function VerifyStatusPill({
  isVerified,
  canVerify,
  isVerifying,
  onVerify,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!canVerify || isVerifying) return;
        onVerify?.();
      }}
      disabled={!canVerify || isVerifying}
      title={
        canVerify
          ? isVerified
            ? "Click to unverify"
            : "Click to verify"
          : undefined
      }
      className={`inline-flex items-center gap-1 rounded-full font-bold border transition-colors ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      } ${
        isVerified
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-500 border-slate-200"
      } ${
        canVerify ? "cursor-pointer hover:brightness-95" : "cursor-default"
      } disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {isVerified ? (
        <>
          <CheckCircle2 size={compact ? 8 : 10} />
          Verified
        </>
      ) : (
        <>
          <XCircle size={compact ? 8 : 10} className="opacity-60" />
          Unverified
        </>
      )}
    </button>
  );
}

function MobileFileActionBtn({
  onClick,
  disabled,
  title,
  children,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      disabled={disabled}
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors disabled:opacity-40 ${
        danger
          ? "border-slate-100 bg-white text-slate-400 hover:border-red-100 hover:bg-red-50 hover:text-red-500"
          : "border-slate-100 bg-white text-slate-400 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {children}
    </button>
  );
}

/** Dense enterprise row for mobile list view */
function MobileFileListCard({
  file,
  canEdit,
  canVerify,
  isVerifying,
  isSelected,
  downloadingId,
  deletingId,
  hasAccess,
  requestStatus,
  canViewFeedback,
  hasUnreadFeedback,
  onSelectOrVerify,
  onVerify,
  onPreview,
  onDownload,
  onDelete,
  onRequestAccess,
  onOpenFeedback,
}) {
  const { Icon, color, bg } = getFileIcon(file.type);
  const uploaded = formatRelativeDate(file.rawCreatedAt);
  const isVerified = file.status === "Verified";

  const actions = canEdit ? (
    <>
      <MobileFileActionBtn title="Preview" onClick={onPreview}>
        <Eye size={15} />
      </MobileFileActionBtn>
      <MobileFileActionBtn
        title="Download"
        onClick={onDownload}
        disabled={downloadingId === file.id}
      >
        <Download size={15} />
      </MobileFileActionBtn>
      <MobileFileActionBtn
        title="Delete"
        onClick={onDelete}
        disabled={deletingId === file.id}
        danger
      >
        <Trash2 size={15} />
      </MobileFileActionBtn>
    </>
  ) : hasAccess ? (
    <>
      <MobileFileActionBtn title="Preview" onClick={onPreview}>
        <Eye size={15} />
      </MobileFileActionBtn>
      <MobileFileActionBtn
        title="Download"
        onClick={onDownload}
        disabled={downloadingId === file.id}
      >
        <Download size={15} />
      </MobileFileActionBtn>
    </>
  ) : requestStatus === "pending" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600 whitespace-nowrap">
      <Clock size={10} />
      Requested
    </span>
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRequestAccess?.();
      }}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-2.5 text-[0.68rem] font-semibold text-blue-700 whitespace-nowrap"
    >
      <Lock size={12} />
      Request
    </button>
  );

  return (
    <article
      className={`rounded-2xl border bg-white/90 backdrop-blur-sm p-3.5 transition-all ${
        isSelected
          ? "border-blue-300 shadow-md ring-1 ring-blue-100"
          : "border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectOrVerify?.(e);
          }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all ${
            isSelected
              ? "border-blue-200 bg-blue-50 text-blue-600"
              : `${bg} border-transparent`
          }`}
          aria-label={isSelected ? "Deselect file" : "Select file"}
        >
          {isSelected ? (
            <CheckCircle2 size={18} />
          ) : (
            <Icon size={18} className={color} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={onPreview}
              className="min-w-0 text-left"
            >
              <p className="text-[0.84rem] font-semibold text-slate-800 leading-snug line-clamp-2 wrap-break-word">
                {file.name}
              </p>
            </button>
            <VerifyStatusPill
              isVerified={isVerified}
              canVerify={canVerify}
              isVerifying={isVerifying}
              onVerify={onVerify}
              compact
            />
          </div>

          <p className="mt-1 text-[0.7rem] font-medium text-slate-400 truncate">
            <span className={color}>{file.type}</span>
            <span className="text-slate-300"> · </span>
            {file.size}
            <span className="text-slate-300"> · </span>
            {uploaded.relative}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-1.5">
        {actions}
        {canViewFeedback && (
          <MobileFileActionBtn title="Feedback" onClick={onOpenFeedback}>
            <span className="relative">
              <MessageSquare size={15} />
              {hasUnreadFeedback && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </span>
          </MobileFileActionBtn>
        )}
      </div>
    </article>
  );
}

/** Compact enterprise tile for mobile/desktop grid */
function MobileFileGridCard({
  file, canEdit, canVerify, isVerifying, isSelected, downloadingId, deletingId,
  hasAccess, requestStatus, canViewFeedback, hasUnreadFeedback,
  onSelectOrVerify, onVerify, onPreview, onDownload, onDelete, onRequestAccess, onOpenFeedback,
}) {
  const { Icon, color, bg } = getFileIcon(file.type);
  const uploaded = formatRelativeDate(file.rawCreatedAt);
  const isVerified = file.status === "Verified";
  const { bg: avatarBg } = getAvatarColor(file.uploader);

  return (
    <article
      className={`group relative flex flex-col rounded-2xl border bg-white p-3 transition-all ${
        isSelected
          ? "border-blue-300 shadow-md ring-1 ring-blue-100"
          : "border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectOrVerify?.(e);
          }}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
            isSelected
              ? "border-blue-200 bg-blue-50 text-blue-600"
              : `${bg} border-transparent`
          }`}
          aria-label={isSelected ? "Deselect file" : "Select file"}
        >
          {isSelected ? (
            <CheckCircle2 size={16} />
          ) : (
            <Icon size={18} className={color} />
          )}
        </button>

        <VerifyStatusPill
          isVerified={isVerified}
          canVerify={canVerify}
          isVerifying={isVerifying}
          onVerify={onVerify}
          compact
        />
      </div>

      <button
        type="button"
        onClick={onPreview}
        className="text-left min-w-0 mb-1"
      >
        <p className="text-[0.78rem] sm:text-[0.8rem] font-semibold text-slate-800 leading-snug line-clamp-2 wrap-break-word min-h-[2.4em]">
          {file.name}
        </p>
      </button>

      <p className="text-[0.65rem] sm:text-[0.7rem] font-medium text-slate-400 mb-2 truncate">
        {file.size}
        <span className="text-slate-300"> · </span>
        {uploaded.relative}
      </p>

      <div className="flex items-center gap-1.5 mb-3 min-w-0">
        <div
          className={`w-5 h-5 ${avatarBg} rounded-full flex items-center justify-center shrink-0`}
        >
          <span className="text-[7px] font-bold text-white">
            {getInitials(file.uploader)}
          </span>
        </div>
        <p className="text-[0.65rem] sm:text-[0.68rem] font-medium text-slate-500 truncate">
          {file.uploader}
        </p>
      </div>

      <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
        {canEdit ? (
          <>
            <MobileFileActionBtn title="Preview" onClick={onPreview}>
              <Eye size={14} />
            </MobileFileActionBtn>
            <MobileFileActionBtn
              title="Download"
              onClick={onDownload}
              disabled={downloadingId === file.id}
            >
              <Download size={14} />
            </MobileFileActionBtn>
            <MobileFileActionBtn
              title="Delete"
              onClick={onDelete}
              disabled={deletingId === file.id}
              danger
            >
              <Trash2 size={14} />
            </MobileFileActionBtn>
          </>
        ) : hasAccess ? (
          <>
            <MobileFileActionBtn title="Preview" onClick={onPreview}>
              <Eye size={14} />
            </MobileFileActionBtn>
            <MobileFileActionBtn
              title="Download"
              onClick={onDownload}
              disabled={downloadingId === file.id}
            >
              <Download size={14} />
            </MobileFileActionBtn>
          </>
        ) : requestStatus === "pending" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 px-1">
            <Clock size={11} />
            Requested
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestAccess?.();
            }}
            className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-blue-100 bg-blue-50 px-2.5 text-[0.68rem] font-semibold text-blue-700"
          >
            <Lock size={11} />
            Request
          </button>
        )}
        {canViewFeedback && (
          <MobileFileActionBtn title="Feedback" onClick={onOpenFeedback}>
            <span className="relative">
              <MessageSquare size={14} />
              {hasUnreadFeedback && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </span>
          </MobileFileActionBtn>
        )}
      </div>
    </article>
  );
}

const FILE_TYPE_TABS = ["All", "PDF", "Excel", "Word", "Image"];

// ── Pagination options ─────────────────────────────────────────
const PAGE_SIZE_OPTIONS_LIST = [10, 25, 50, 100];
const PAGE_SIZE_OPTIONS_GRID = [12, 24, 48, 96];

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
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function getAvatarColor(name) {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
}
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ── Relative date formatter ───────────────────────────────────────
function formatRelativeDate(dateStr) {
  if (!dateStr) return { relative: "—", time: "—", full: "—" };
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  // Clock skew between browser and server (or a timestamp that hasn't
  // "settled" yet right after a save) can make a just-written timestamp
  // look slightly in the future. Never show a negative/garbage day count —
  // treat anything from "now" up through the rest of today as "Today".
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000));
  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const fullStr = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (diffDays === 0)
    return { relative: "Today", time: timeStr, full: fullStr };
  if (diffDays === 1)
    return { relative: "Yesterday", time: timeStr, full: fullStr };
  if (diffDays < 7)
    return { relative: `${diffDays}d ago`, time: timeStr, full: fullStr };
  return { relative: fullStr, time: timeStr, full: fullStr };
}

function formatFileDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} · ${time}`;
}

/** Latest touch timestamp — edits, verification, or record updates. */
function getFileModifiedAt(file) {
  if (!file) return null;
  const candidates = [file.rawUpdatedAt, file.verifiedAt, file.rawCreatedAt].filter(
    Boolean,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((latest, ts) =>
    new Date(ts) > new Date(latest) ? ts : latest,
  );
}

// ─────────────────────────────────────────────────────────────────
// ── PAGINATION CONTROLS ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  rangeStart,
  rangeEnd,
}) {
  if (totalItems === 0) return null;

  // Build a compact list of page numbers with ellipses
  function getPageNumbers() {
    const pages = [];
    const delta = 1;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push("ellipsis-left");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("ellipsis-right");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }

  const pageNumbers = totalPages > 1 ? getPageNumbers() : [1];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
        <span>
          Showing{" "}
          <span className="font-semibold text-slate-600">
            {rangeStart}–{rangeEnd}
          </span>{" "}
          of <span className="font-semibold text-slate-600">{totalItems}</span>
        </span>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-slate-300">·</span>
          <label className="flex items-center gap-1.5">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {pageNumbers.map((p, i) =>
            typeof p === "number" ? (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-7 h-7 px-2 rounded-lg text-[11px] font-bold transition-colors ${
                  p === currentPage
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {p}
              </button>
            ) : (
              <span
                key={p + i}
                className="w-6 text-center text-[11px] text-slate-300 select-none"
              >
                …
              </span>
            ),
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── MODALS ────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────

// Delete confirmation
function DeleteFileConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  isDeleting,
}) {
  if (!isOpen) return null;
  return (
    <ModalPortal>
      <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
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
                <span className="font-semibold text-slate-700">
                  "{fileName}"
                </span>
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
    </ModalPortal>
  );
}

// Verify confirmation modal — matches the reference screenshot exactly
function VerifyConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  file,
  userProfile,
  isVerifying,
}) {
  if (!isOpen || !file) return null;
  const { Icon, color, bg } = getFileIcon(file.type);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const avatarColor = getAvatarColor(userProfile?.full_name ?? "");
  const isVerified = file.status === "Verified";

  return (
    <ModalPortal>
      <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
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
              <div
                className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center shrink-0`}
              >
                <Icon size={18} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {file.type} · {file.size} · Uploaded{" "}
                  {formatRelativeDate(file.rawCreatedAt).full}
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
                <div
                  className={`w-9 h-9 ${avatarColor.bg} rounded-full flex items-center justify-center shrink-0`}
                >
                  <span className="text-xs font-bold text-white">
                    {getInitials(userProfile?.full_name ?? "")}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Recorded Under
                  </p>
                  <p className="text-[12px] font-semibold text-slate-800 leading-tight">
                    {userProfile?.full_name ?? "—"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {getRoleDisplay(userProfile?.role)}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Timestamp
                </p>
                <p className="text-[12px] font-semibold text-slate-800 leading-tight">
                  {dateStr}
                </p>
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
              {isVerifying
                ? "Saving…"
                : isVerified
                  ? "Unverify"
                  : "Confirm Verification"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── POPOVERS (rendered outside table cell to avoid overflow clip) ─
// ─────────────────────────────────────────────────────────────────

// File info card (dark popover — matches reference)
function FileInfoCard({ file, onPreview, onDownload, canEdit }) {
  if (!file) return null;
  const { Icon, color, bg } = getFileIcon(file.type);
  const uploadedAt = file.rawCreatedAt;
  const modifiedAt = getFileModifiedAt(file);

  return (
    <div className="w-64 rounded-2xl bg-white text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-200">
      {/* File header */}
      <div className="flex items-start gap-3 p-4 border-b border-slate-100">
        <div
          className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}
        >
          <Icon size={18} className={color} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-slate-800 leading-tight line-clamp-2">
            {file.name}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className={`font-bold ${color}`}>{file.type}</span>
            {file.status === "Verified" ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-600">
                <CheckCircle2 size={9} /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-amber-500">
                <XCircle size={9} /> Unverified
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-px m-3 rounded-xl overflow-hidden bg-slate-200/50">
        {[
          { label: "TYPE", value: file.type },
          { label: "SIZE", value: file.size },
          { label: "UPLOADED", value: formatFileDateTime(uploadedAt) },
          { label: "MODIFIED", value: formatFileDateTime(modifiedAt) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              {label}
            </p>
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
        <div
          className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center shrink-0`}
        >
          <span className="text-xs font-bold text-white">
            {getInitials(name)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-slate-800 leading-tight">
            {name}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {getRoleDisplay(role)}
          </p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {email && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              EMAIL
            </p>
            <p className="text-[11px] text-slate-700 font-medium break-all">
              {email}
            </p>
          </div>
        )}
        {division && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              DIVISION
            </p>
            <p className="text-[11px] text-slate-700 font-medium">{division}</p>
          </div>
        )}
        {typeof uploadCount === "number" && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              UPLOADS
            </p>
            <p className="text-[11px] text-slate-700 font-medium">
              {uploadCount} files
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Last-modified hover card
function LastModifiedInfoCard({ rawDate, uploaderInfo }) {
  const { bg } = getAvatarColor(uploaderInfo?.name || "");

  // Format full datetime string
  const fullDate = rawDate
    ? new Date(rawDate).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <div className="w-64 rounded-2xl bg-white text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-100">
        <Clock size={13} className="text-slate-400 shrink-0" />
        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
          Last Modified
        </p>
      </div>

      {/* Full datetime */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[12px] font-semibold text-slate-800 leading-snug">
          {fullDate}
        </p>
      </div>

      {/* Modified by */}
      {uploaderInfo && (
        <div className="px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Modified By
          </p>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center shrink-0`}
            >
              <span className="text-[10px] font-bold text-white">
                {getInitials(uploaderInfo.name)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-slate-800 leading-tight truncate">
                {uploaderInfo.name}
              </p>
              <p className="text-[10px] text-blue-500 font-medium mt-0.5">
                {getRoleDisplay(uploaderInfo.role)}
              </p>
            </div>
          </div>
        </div>
      )}
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

  // ── File Request ─────────────────────────────────────────────
  const [showFileRequestModal, setShowFileRequestModal] = useState(false);
  const [isSubmittingFileRequest, setIsSubmittingFileRequest] = useState(false);
  const [myFileRequests, setMyFileRequests] = useState([]);

  const [loadingFileRequests, setLoadingFileRequests] = useState(false); // ← add this
  const [showFileRequestsPanel, setShowFileRequestsPanel] = useState(false);
  const [showFileRequestToast, setShowFileRequestToast] = useState(false);

  // ── Supabase state ─────────────────────────────────────────────
  const [section, setSection] = useState(null);
  const [sectionManagerNames, setSectionManagerNames] = useState([]);
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

  // ── Pagination state ──────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeList, setPageSizeList] = useState(25);
  const [pageSizeGrid, setPageSizeGrid] = useState(24);
  const pageSize = viewMode === "list" ? pageSizeList : pageSizeGrid;

  // ── Selection ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Verify modal ───────────────────────────────────────────────
  const [verifyTarget, setVerifyTarget] = useState(null); // file to verify/unverify
  const [isVerifying, setIsVerifying] = useState(false);

  // ── Hover popovers ─────────────────────────────────────────────
  const [hoveredFileId, setHoveredFileId] = useState(null);
  const [hoveredUploaderId, setHoveredUploaderId] = useState(null);
  const [hoveredModifiedId, setHoveredModifiedId] = useState(null);
  const fileHoverTimer = useRef(null);
  const userHoverTimer = useRef(null);
  const modifiedHoverTimer = useRef(null);

  const [fileAccessMap, setFileAccessMap] = useState({}); // fileId -> "pending" | "approved" | "denied"
  const [requestModalFiles, setRequestModalFiles] = useState(null); // array of files, or null when closed
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [isAccessSidebarOpen, setIsAccessSidebarOpen] = useState(false);
  const [accessRefreshKey, setAccessRefreshKey] = useState(0);

  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");

  const [downloadMenuTarget, setDownloadMenuTarget] = useState(null); // { file, x, y }

  const [actionsMenuTarget, setActionsMenuTarget] = useState(null); // { file, x, y }
  const [feedbackTarget, setFeedbackTarget] = useState(null); // file
  const [feedbackCounts, setFeedbackCounts] = useState({}); // { [fileId]: totalCount }
  const [feedbackUnread, setFeedbackUnread] = useState({}); // { [fileId]: true }

  function hasFileAccess(file) {
    return canEdit || fileAccessMap[file.id] === "approved";
  }
  function fileRequestStatus(file) {
    return fileAccessMap[file.id];
  }

  function openRequestModal(fileOrFiles) {
    setRequestModalFiles(
      Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles],
    );
  }

  async function submitAccessRequest(fileIds, message) {
    const targetFiles = allFiles.filter(
      (f) =>
        fileIds.includes(f.id) &&
        fileAccessMap[f.id] !== "approved" &&
        fileAccessMap[f.id] !== "pending",
    );
    if (targetFiles.length === 0) {
      setRequestModalFiles(null);
      return;
    }
    setIsSubmittingRequest(true);
    try {
      const rows = targetFiles.map((f) => ({
        file_id: f.id,
        section_id: section?.id,
        requested_by: userProfile?.id,
        requested_by_name: userProfile?.full_name ?? "Unknown",
        message: message || null,
        status: "pending",
      }));
      const { error } = await supabase.from("file_access_request").insert(rows);
      if (error) throw new Error(error.message);

      setFileAccessMap((prev) => {
        const next = { ...prev };
        targetFiles.forEach((f) => (next[f.id] = "pending"));
        return next;
      });

      await Promise.all(
        targetFiles.map((f) =>
          logAudit(
            "Access Request",
            f.name,
            `Requested access in ${section?.name}`,
            "Success",
          ),
        ),
      );

      await notifyScope({
        sectionId: section?.id,
        divisionId: section?.division_id,
        excludeUserId: userProfile?.id,
        type: "file_access_request",
        title: "File access request",
        content: `${userProfile?.full_name} requested access to ${targetFiles.length} file(s) in ${section?.name}`,
        meta: { section_id: section?.id, division_id: section?.division_id },
      });

      setRequestModalFiles(null);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  // ── Access control ─────────────────────────────────────────────
  const [accessLevel, setAccessLevel] = useState("blocked");

  useEffect(() => {
    if (!section?.id || !userProfile?.id) return;

    const channel = supabase
      .channel(`section-feedback-${section.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "file_feedback",
          filter: `section_id=eq.${section.id}`,
        },
        (payload) => {
          const row = payload.new;
          setFeedbackCounts((prev) => ({
            ...prev,
            [row.file_id]: (prev[row.file_id] || 0) + 1,
          }));
          if (row.created_by !== userProfile.id) {
            setFeedbackUnread((prev) => ({ ...prev, [row.file_id]: true }));
          }
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [section?.id, userProfile?.id]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("school_years")
      .select("label, status")
      .order("label", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setSchoolYears(data);
        const active = data.find((y) => y.status === "active");
        setSelectedSchoolYear(
          (prev) => prev || active?.label || data[0]?.label || "",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!section || !userProfile) return;
    let cancelled = false;

    (async () => {
      const level = await getSectionAccessLevel(userProfile, section);
      if (cancelled) return;
      setAccessLevel(level);
      if (level === "blocked") {
        navigate(`/repository/restricted/${encodeURIComponent(section.name)}`, {
          replace: true,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [section, userProfile, navigate]);

  const canEdit = accessLevel === "full";
  // Verification is a separate permission from general edit access — only
  // these three roles may verify/unverify a file, and even then only within
  // the scope they actually own:
  //   - admin: any section, anywhere
  //   - division_focal: any section that belongs to their own division
  //     (section.division_id === their division_id) — this covers every
  //     section folder under the divisions they handle, not just one
  //   - section_focal: only their own assigned section
  //     (section.id === their section_id)
  // Section personnel can never verify, even if they have "full" edit
  // access to this section.
  const canRequestFile =
    userProfile?.role === "administrator" ||
    (userProfile?.role === "division_focal" &&
      !!section &&
      userProfile?.division_id === section.division_id);

  const canVerify =
    userProfile?.role === "administrator" ||
    (userProfile?.role === "division_focal" &&
      !!section &&
      userProfile?.division_id === section.division_id) ||
    (userProfile?.role === "section_focal" &&
      !!section &&
      userProfile?.section_id === section.id);

  function canViewFeedback(file) {
    if (!userProfile || !file || !section) return false;
    if (userProfile.role === "administrator") return true;
    if (userProfile.role === "division_focal")
      return userProfile.division_id === section.division_id;
    if (userProfile.role === "section_focal")
      return userProfile.section_id === section.id;
    // section_personnel — chat access follows section membership, not
    // per-file access grants. Someone who was granted download/view
    // access to a file in a *different* section (via file_access_request)
    // can still open/download it, but never sees that section's feedback
    // thread — only files that live in their own assigned section.
    if (userProfile.role === "section_personnel")
      return userProfile.section_id === section.id;
    return false;
  }

  useEffect(() => {
    if (!section || !userProfile) return;
    if (getSectionAccessLevel(userProfile, section) === "blocked") {
      navigate(`/repository/restricted/${encodeURIComponent(section.name)}`, {
        replace: true,
      });
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

    if (sectionError) {
      setError(sectionError.message);
      setLoading(false);
      return;
    }
    setSection(sectionData);

    const { data: focalUsers, error: focalError } = await supabase
      .from("users")
      .select("full_name")
      .eq("section_id", sectionData.id)
      .eq("role", "section_focal");

    if (!focalError && focalUsers?.length > 0) {
      setSectionManagerNames(
        focalUsers.map((u) => u.full_name).filter(Boolean),
      );
    } else {
      setSectionManagerNames([]);
    }

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

    function formatFileSize(bytes) {
      if (!bytes) return "—";
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    const mapped = (filesData || []).map((f) => ({
      id: f.id,
      name: f.file_name,
      type: inferType(f.file_type, f.file_name),
      size: formatFileSize(f.file_size),
      rawSize: f.file_size || 0,
      rawCreatedAt: f.created_at,
      rawUpdatedAt: f.updated_at,
      uploader: uploaderMap[f.uploaded_by] ?? f.uploaded_by_name ?? "Unknown",
      uploaderId: f.uploaded_by,
      status: f.status ?? "Error",
      isDashboardSource: !!f.is_dashboard_source,
      path: f.file_path,
      data_category: f.data_category,
      school_year: f.school_year,
      verifiedPdfPath: f.verified_pdf_path ?? null, // new
      verifiedByName: f.verified_by_name ?? null, // new
      verifiedAt: f.verified_at ?? null, // new
    }));

    setAllFiles(mapped);
    if (mapped.length > 0) {
      const fileIds = mapped.map((f) => f.id);

      const { data: fbRows } = await supabase
        .from("file_feedback")
        .select("file_id, created_at, created_by")
        .in("file_id", fileIds);

      const counts = {};
      const latestByFile = {};
      (fbRows || []).forEach((r) => {
        counts[r.file_id] = (counts[r.file_id] || 0) + 1;
        if (
          !latestByFile[r.file_id] ||
          new Date(r.created_at) > new Date(latestByFile[r.file_id].created_at)
        ) {
          latestByFile[r.file_id] = r;
        }
      });
      setFeedbackCounts(counts);

      const { data: readRows } = await supabase
        .from("file_feedback_reads")
        .select("file_id, last_read_at")
        .eq("user_id", userProfile.id)
        .in("file_id", fileIds);

      const readMap = {};
      (readRows || []).forEach((r) => {
        readMap[r.file_id] = r.last_read_at;
      });

      const unread = {};
      Object.entries(latestByFile).forEach(([fileId, latest]) => {
        if (latest.created_by === userProfile.id) return; // your own message isn't "unread"
        const lastRead = readMap[fileId];
        if (!lastRead || new Date(latest.created_at) > new Date(lastRead)) {
          unread[fileId] = true;
        }
      });
      setFeedbackUnread(unread);
    }
    setUploaderDetails(uploaderDetailMap);

    if (mapped.length > 0) {
      const fileIds = mapped.map((f) => f.id);
      const { data: requestRows, error: reqErr } = await supabase
        .from("file_access_request")
        .select("file_id, status")
        .eq("requested_by", userProfile.id)
        .in("file_id", fileIds);

      if (reqErr)
        console.error("Access-request check failed:", reqErr.message, reqErr);
      console.log("requestRows:", requestRows);

      const map = {};
      (requestRows || []).forEach((r) => {
        if (!map[r.file_id] || r.status === "approved") {
          map[r.file_id] = r.status;
        }
      });
      setFileAccessMap(map);
    } else {
      setFileAccessMap({});
    }
    setLoading(false);
  }

  async function fetchMyFileRequests() {
    if (!section?.id) return;
    setLoadingFileRequests(true); // ← add
    const { data, error } = await supabase
      .from("file_requests")
      .select(
        `
      id, file_name, description, deadline, status, created_at,
      requested_by,
      users:requested_by ( full_name, role )
    `,
      )
      .eq("section_id", section.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch file requests:", error); // if this fires, it's RLS or a bad join — check the console
      setLoadingFileRequests(false); // ← add
      return;
    }

    const today = new Date();
    setMyFileRequests(
      (data || []).map((r) => {
        const isOverdue =
          r.status === "pending" && r.deadline && new Date(r.deadline) < today;
        return {
          id: r.id,
          fileName: r.file_name,
          message: r.description,
          requestedOn: r.created_at,
          dueDate: r.deadline
            ? new Date(r.deadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—",
          requestedBy: r.users?.full_name ?? "Unknown",
          requesterRole: getRoleDisplay(r.users?.role) ?? "",
          isOwnRequest: r.requested_by === userProfile?.id,
          status:
            r.status === "completed"
              ? "Completed"
              : isOverdue
                ? "Overdue"
                : "Pending",
        };
      }),
    );
    setLoadingFileRequests(false); // ← add
  }

  useEffect(() => {
    if (section?.id) fetchMyFileRequests();
  }, [section?.id]);

  async function submitFileRequest({ fileName, deadline, message }) {
    setIsSubmittingFileRequest(true);
    try {
      const { error } = await supabase.from("file_requests").insert({
        file_name: fileName,
        description: message,
        deadline,
        status: "pending",
        requested_by: userProfile?.id,
        section_id: section?.id,
        division_id: section?.division_id,
      });
      if (error) throw new Error(error.message);

      await logAudit(
        "File Request",
        fileName,
        `Requested in ${section?.name}`,
        "Success",
      );

      setShowFileRequestModal(false);
      setShowFileRequestToast(true);
      fetchMyFileRequests();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSubmittingFileRequest(false);
    }
  }

  useEffect(() => {
    if (decodedName && userProfile?.id) fetchData();
  }, [decodedName, userProfile?.id]);

  useEffect(() => {
    if (!showDeleteToast) return;
    const t = setTimeout(() => setShowDeleteToast(false), 5000);
    return () => clearTimeout(t);
  }, [showDeleteToast]);

  useEffect(() => {
    if (!showFileRequestToast) return;
    const t = setTimeout(() => setShowFileRequestToast(false), 5000);
    return () => clearTimeout(t);
  }, [showFileRequestToast]);

  // ── Handlers ────────────────────────────────────────────────────
  async function handleDownloadFile(file) {
    if (!hasFileAccess(file) || !file.path) return;
    setDownloadingId(file.id);
    try {
      const bucket = getBucket(file.data_category);
      const { data: blob, error } = await supabase.storage
        .from(bucket)
        .download(file.path);
      if (error) throw new Error(error.message);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      await logAudit(
        "Download",
        file.name,
        `Downloaded from ${section?.name}`,
        "Success",
      );
    } catch (err) {
      console.error(err);
      await logAudit("Download", file.name, err.message, "Failed");
    } finally {
      setDownloadingId(null);
    }
  }

  const logAudit = async (action, fileName, details, status = "Success") => {
    const { error } = await supabase.from("audit_logs").insert({
      action,
      file_name: fileName,
      details,
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
      let storageRemoved = true;

      if (file.path) {
        const bucket = getBucket(file.data_category);
        const { data: removedData, error: storageErr } = await supabase.storage
          .from(bucket)
          .remove([file.path]);

        if (storageErr) throw new Error(storageErr.message);

        // Supabase does NOT error when the path/bucket doesn't match an
        // existing object — it just returns an empty array. Treat that as
        // a real failure instead of silently deleting the DB row anyway.
        if (!removedData || removedData.length === 0) {
          storageRemoved = false;
          console.error(
            `Storage delete no-op: bucket="${bucket}" path="${file.path}" — no matching object found.`,
          );
        }
      }

      if (file.verifiedPdfPath) {
        const { data: removedVerified, error: verifiedErr } =
          await supabase.storage
            .from("verified-pdfs")
            .remove([file.verifiedPdfPath]);
        if (verifiedErr) {
          console.error("Failed to remove verified PDF:", verifiedErr);
        } else if (!removedVerified || removedVerified.length === 0) {
          console.error(
            `Verified PDF delete no-op: path="${file.verifiedPdfPath}" — no matching object found.`,
          );
        }
      }

      const { error: dbErr } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);
      if (dbErr) throw new Error(dbErr.message);

      setAllFiles((prev) => prev.filter((f) => f.id !== file.id));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(file.id);
        return n;
      });

      await logAudit(
        "Delete",
        file.name,
        storageRemoved
          ? `Deleted from ${section?.name}`
          : `Deleted from ${section?.name} (storage object was not found — possible orphaned file)`,
        "Success",
      );
      setFileToDelete(null);
      setShowDeleteToast(true);

      if (!storageRemoved) {
        alert(
          "The database record was deleted, but the stored file could not be located in storage (it may already be orphaned). Check the console/audit log for the bucket and path used.",
        );
      }

      await notifyScope({
        sectionId: section?.id,
        divisionId: section?.division_id,
        excludeUserId: userProfile?.id,
        type: "file_deleted",
        title: "File deleted",
        content: `${userProfile?.full_name} deleted ${file.name} from ${section?.name}`,
        meta: {
          section_id: section?.id,
          division_id: section?.division_id,
          uploaded_by: file.uploaderId,
        },
      });
      if (file.uploaderId && file.uploaderId !== userProfile?.id) {
        await pushNotification({
          recipientIds: [file.uploaderId],
          type: "file_deleted",
          title: "Your file was deleted",
          content: `${file.name} was deleted from ${section?.name}`,
        });
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
      await logAudit("Delete", file.name, err.message, "Failed");
    } finally {
      setDeletingId(null);
    }
  }

  // Verify/unverify toggle
  async function confirmVerify() {
    const file = verifyTarget;
    if (!file || isVerifying) return; // guard: one verification in flight per click, no double-submit
    setIsVerifying(true);
    try {
      const isCurrentlyVerified = file.status === "Verified";
      const newStatus = isCurrentlyVerified ? "Unverified" : "Verified";
      const now = new Date().toISOString();

      const updatePayload = { status: newStatus, updated_at: now };
      if (newStatus === "Verified") {
        updatePayload.verified_by_name = userProfile?.full_name ?? null;
        updatePayload.verified_at = now;
      } else {
        updatePayload.verified_pdf_path = null;
        updatePayload.verified_by_name = null;
        updatePayload.verified_at = null;
      }

      const { error } = await supabase
        .from("files")
        .update(updatePayload)
        .eq("id", file.id);

      if (error) throw new Error(error.message);

      if (isCurrentlyVerified && file.verifiedPdfPath) {
        const { error: removeErr } = await supabase.storage
          .from("verified-pdfs")
          .remove([file.verifiedPdfPath]);
        if (removeErr)
          console.error("Failed to remove old verified PDF:", removeErr);
      }

      let verifiedPdfPath = null;
      let pdfGenerationFailed = false;

      if (newStatus === "Verified") {
        try {
          const resp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-verified-pdf`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ id: file.id }),
            },
          );
          const json = await resp.json();
          if (resp.ok && json.success && json.path) {
            verifiedPdfPath = json.path;
          } else {
            pdfGenerationFailed = true;
            console.error("Verified PDF generation failed:", json.error);
          }
        } catch (genErr) {
          pdfGenerationFailed = true;
          console.error("Verified PDF generation request failed:", genErr);
        }
      }

      setAllFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: newStatus,
                rawUpdatedAt: now,
                verifiedPdfPath:
                  newStatus === "Verified" ? verifiedPdfPath : null,
                verifiedByName:
                  newStatus === "Verified"
                    ? updatePayload.verified_by_name
                    : null,
                verifiedAt:
                  newStatus === "Verified" ? updatePayload.verified_at : null,
              }
            : f,
        ),
      );

      // Unselect the file once its verification state has been changed
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(file.id);
        return n;
      });

      const action = newStatus === "Verified" ? "Verify" : "Unverify";
      await logAudit(
        action,
        file.name,
        pdfGenerationFailed
          ? `${action}d in ${section?.name} (verified PDF generation failed)`
          : `${action}d in ${section?.name}`,
        "Success",
      );

      if (pdfGenerationFailed) {
        alert(
          "File verified, but the stamped PDF couldn't be generated. You can retry by unverifying and verifying again.",
        );
      }

      setVerifyTarget(null);
      await notifyScope({
        sectionId: section?.id,
        divisionId: section?.division_id,
        excludeUserId: userProfile?.id,
        type: newStatus === "Verified" ? "file_verified" : "file_unverified",
        title:
          newStatus === "Verified"
            ? "Verification complete"
            : "File unverified",
        content: `${userProfile?.full_name} ${newStatus === "Verified" ? "verified" : "unverified"} ${file.name} in ${section?.name}`,
        meta: {
          related_file_id: file.id,
          section_id: section?.id,
          division_id: section?.division_id,
        },
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleDownloadVerifiedPdf(file) {
    if (!file.verifiedPdfPath) return;
    setDownloadingId(file.id);
    try {
      const baseName = file.name.replace(/\.[^./]+$/, "");
      const { data, error } = await supabase.storage
        .from("verified-pdfs")
        .createSignedUrl(file.verifiedPdfPath, 60, {
          download: `${baseName} (Verified).pdf`,
        });
      if (error) throw new Error(error.message);

      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = `${baseName} (Verified).pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      await logAudit(
        "Download",
        file.name,
        `Downloaded verified PDF from ${section?.name}`,
        "Success",
      );
    } catch (err) {
      console.error(err);
      await logAudit("Download", file.name, err.message, "Failed");
    } finally {
      setDownloadingId(null);
    }
  }

  function handleDownloadClick(e, file) {
    if (file.status === "Verified" && file.verifiedPdfPath) {
      e.stopPropagation();
      setDownloadMenuTarget({ file, x: e.clientX, y: e.clientY });
    } else {
      handleDownloadFile(file);
    }
  }

  // ── Selection helpers ──────────────────────────────────────────
  const allFilteredSelected =
    filtered_local()?.length > 0 &&
    filtered_local()?.every((f) => selectedIds.has(f.id));
  const someSelected = selectedIds.size > 0;
  function toggleSelectAll() {
    const f = filtered_local() ?? [];
    if (f.every((x) => selectedIds.has(x.id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(f.map((x) => x.id)));
  }
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  // ── Filter + sort ──────────────────────────────────────────────
  function filtered_local() {
    return allFiles
      .filter((file) => {
        const matchSearch =
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.uploader.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = activeType === "All" || file.type === activeType;
        const matchYear =
          !selectedSchoolYear || file.school_year === selectedSchoolYear;
        return matchSearch && matchType && matchYear;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "size") return b.rawSize - a.rawSize;
        return new Date(b.rawCreatedAt) - new Date(a.rawCreatedAt);
      });
  }
  const filtered = useMemo(filtered_local, [
    allFiles,
    activeType,
    searchQuery,
    sortBy,
    selectedSchoolYear,
  ]);

  const yearFilteredFiles = selectedSchoolYear
    ? allFiles.filter((f) => f.school_year === selectedSchoolYear)
    : allFiles;

  const typeCounts = FILE_TYPE_TABS.reduce((acc, type) => {
    acc[type] =
      type === "All"
        ? yearFilteredFiles.length
        : yearFilteredFiles.filter((f) => f.type === type).length;
    return acc;
  }, {});

  const verifiedCount = yearFilteredFiles.filter(
    (f) => f.status === "Verified",
  ).length;
  const backTarget = division
    ? `/repository/divisions/${division.id}`
    : "/repository";
  const backLabel = division?.name ?? "Repository";

  // ── Pagination derived state ────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Clamp current page whenever the filtered set, page size, or view
  // mode changes (e.g. a search narrows the results below the current page).
  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
      return prev > maxPage ? maxPage : prev;
    });
  }, [filtered.length, pageSize]);

  // Reset to page 1 whenever the active filters/search/sort change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeType, sortBy, selectedSchoolYear, viewMode]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const rangeStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filtered.length);

  function handlePageChange(page) {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);
    // Scroll the file list back into view so pagination is legible after
    // jumping from the bottom of a long list.
    const el = document.getElementById("repo-file-list-anchor");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handlePageSizeChange(size) {
    if (viewMode === "list") setPageSizeList(size);
    else setPageSizeGrid(size);
    setCurrentPage(1);
  }

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
    userHoverTimer.current = setTimeout(
      () => setHoveredUploaderId(uploaderId),
      400,
    );
  }
  function handleUserMouseLeave() {
    clearTimeout(userHoverTimer.current);
    setHoveredUploaderId(null);
  }
  function handleModifiedMouseEnter(fileId) {
    clearTimeout(modifiedHoverTimer.current);
    modifiedHoverTimer.current = setTimeout(
      () => setHoveredModifiedId(fileId),
      400,
    );
  }
  function handleModifiedMouseLeave() {
    clearTimeout(modifiedHoverTimer.current);
    setHoveredModifiedId(null);
  }

  // ─────────────────────────────────────────────────────────────
  // ── RENDER ───────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/40 pb-20">
      <div className="mx-auto max-w-375 px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-4 sm:mb-5 font-medium overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => navigate("/repository")}
            className="hover:text-slate-600 transition-colors"
          >
            Repository
          </button>
          {division && (
            <>
              <ChevronRight size={12} />
              <button
                onClick={() => navigate(backTarget)}
                className="hover:text-slate-600 transition-colors truncate max-w-45"
              >
                {backLabel}
              </button>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-slate-700 font-semibold truncate max-w-55">
            {decodedName}
          </span>
        </nav>

        {/* ── Page Header ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-[1.35rem] sm:text-[1.65rem] font-black text-slate-800 tracking-[-0.02em] leading-tight">
              {decodedName}
            </h1>
            <p className="hidden lg:block text-[0.78rem] text-slate-400 font-medium mt-1">
              {loading
                ? "Loading…"
                : `${yearFilteredFiles.length} files · ${verifiedCount} verified`}
            </p>
          </div>
          {canRequestFile && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setShowFileRequestsPanel(true);
                  fetchMyFileRequests();
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all"
              >
                <Inbox size={15} />
                <span className="hidden sm:inline">Files Requested</span>
                <span className="sm:hidden">Requested</span>
                {myFileRequests.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {myFileRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowFileRequestModal(true)}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-[10px] bg-blue-500 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,0.28)] hover:bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer"
              >
                <FileUp size={15} />
                Request File
              </button>
            </div>
          )}
        </div>

        {/* ── Locked-access banner ──────────────────────────── */}
        {accessLevel === "locked" && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <Lock size={14} className="shrink-0" />
            You can view files in this section, but download, edit, and delete
            are limited to your assigned section.
          </div>
        )}

        {/* ── Stats row ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <User size={11} className="text-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Managed By
              </p>
            </div>
            {loading ? (
              <p className="text-[0.88rem] font-semibold text-slate-800">—</p>
            ) : sectionManagerNames.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {sectionManagerNames.map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[0.8rem] font-semibold text-slate-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[0.88rem] font-semibold text-slate-800">
                {section?.managed_by ?? "—"}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <Building2 size={11} className="text-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Division
              </p>
            </div>
            <p className="text-[0.88rem] font-semibold text-slate-800">
              {loading ? "—" : (division?.name ?? "—")}
            </p>
          </div>
        </div>

        {/* ── Search / Sort / View Toggle ────────────────── */}
        <div className="mb-5 sm:mb-6 rounded-2xl sm:rounded-[28px] border border-white/70 bg-white/85 p-3 sm:p-5 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <RepositorySearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
            placeholder="Search files by name or uploader..."
            schoolYears={schoolYears}
            selectedYear={selectedSchoolYear}
            onYearChange={setSelectedSchoolYear}
          />

          {/* Type filter pills */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILE_TYPE_TABS.map((tab) => {
                const isActive = activeType === tab;

                let activeColors =
                  "bg-blue-600 text-white border-blue-600 shadow-sm";
                if (isActive) {
                  if (tab === "PDF")
                    activeColors =
                      "bg-red-500 text-white border-red-500 shadow-sm";
                  else if (tab === "Excel")
                    activeColors =
                      "bg-emerald-500 text-white border-emerald-500 shadow-sm";
                }

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveType(tab)}
                    className={`shrink-0 px-3.5 py-1.5 text-[11px] font-semibold rounded-full transition-all border ${
                      isActive
                        ? activeColors
                        : "text-slate-500 hover:bg-slate-50 border-slate-200 bg-white"
                    }`}
                  >
                    {tab}
                    <span
                      className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {typeCounts[tab]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bulk bar anchor + audit note ─────────────────────────── */}
        <div
          id="repo-file-list-anchor"
          className="flex items-center justify-end mb-3 scroll-mt-6"
        >
          {allFiles.length > 0 && (
            <p className="text-[11px] text-slate-400">
              ○ All actions are audit-logged
            </p>
          )}
        </div>

        {/* ── Bulk action bar (Verify/Unverify only) ─────────── */}

        {someSelected && !canEdit && (
          <div className="mb-3 flex items-center gap-3 px-4 py-3 rounded-2xl border border-blue-200 bg-blue-50">
            <span className="text-[13px] font-semibold text-blue-700">
              {selectedIds.size} file{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => {
                const files = filtered.filter(
                  (f) =>
                    selectedIds.has(f.id) &&
                    !hasFileAccess(f) &&
                    fileRequestStatus(f) !== "pending",
                );
                if (files.length > 0) openRequestModal(files);
                else
                  alert(
                    "The selected files are already granted or have a pending request.",
                  );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors"
            >
              <Lock size={12} /> Request Access
            </button>
            <button
              onClick={clearSelection}
              className="ml-auto p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Pagination (Moved to Top) ─────────────────────── */}
        {!loading && filtered.length > 0 && (
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={viewMode === "list" ? pageSizeList : pageSizeGrid}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={
              viewMode === "list"
                ? PAGE_SIZE_OPTIONS_LIST
                : PAGE_SIZE_OPTIONS_GRID
            }
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
          />
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
            <FileText
              className="mx-auto text-slate-300 opacity-60 mb-3"
              size={40}
              strokeWidth={1.5}
            />
            <h3 className="text-[0.95rem] font-bold text-slate-700 mb-1">
              No files found
            </h3>
            <p className="text-[0.78rem] font-medium text-slate-400">
              {searchQuery
                ? `No files matching "${searchQuery}"`
                : "No files have been uploaded to this section yet."}
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* ── LIST VIEW ───────────────────────────────────── */
          <>
            {/* Mobile / tablet — dense enterprise cards (no cramped table) */}
            <div className="lg:hidden space-y-2.5">
              {paginated.map((file) => (
                <MobileFileListCard
                  key={file.id}
                  file={file}
                  canEdit={canEdit}
                  canVerify={canVerify}
                  isVerifying={isVerifying}
                  isSelected={selectedIds.has(file.id)}
                  downloadingId={downloadingId}
                  deletingId={deletingId}
                  hasAccess={hasFileAccess(file)}
                  requestStatus={fileRequestStatus(file)}
                  canViewFeedback={canViewFeedback(file)}
                  hasUnreadFeedback={!!feedbackUnread[file.id]}
                  onSelectOrVerify={() => {
  if (canVerify) {
    if (isVerifying) return;
    setVerifyTarget(file);
  } else {
    toggleSelect(file.id);
  }
}}
                  onVerify={() => setVerifyTarget(file)}
                  onPreview={() => setEditingFile(file)}
                  onDownload={(e) => handleDownloadClick(e, file)}
                  onDelete={() => handleDeleteFile(file)}
                  onRequestAccess={() => openRequestModal(file)}
                  onOpenFeedback={() => {
                    setFeedbackTarget(file);
                    setFeedbackUnread((prev) => ({
                      ...prev,
                      [file.id]: false,
                    }));
                  }}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm relative">
              {/* TABLE using real <table> for perfect alignment */}
              <table className="w-full min-w-160 border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/80 rounded-tl-[15px]">
                      File
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-32 bg-slate-50/80">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-24 bg-slate-50/80">
                      Size
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-44 hidden md:table-cell bg-slate-50/80">
                      Uploaded By
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-32 hidden sm:table-cell bg-slate-50/80">
                      Date Uploaded
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-32 bg-slate-50/80">
                      Last Modified
                    </th>
                    <th className="px-3 py-3 pr-4 w-40 bg-slate-50/80 rounded-tr-[15px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((file, index) => {
                    const isNearBottom =
                      index >= Math.ceil(paginated.length / 2) &&
                      paginated.length > 2;
                    const verticalPos = isNearBottom
                      ? "bottom-[-10px]"
                      : "top-[-10px]";
                    const { Icon, color, bg } = getFileIcon(file.type);
                    const isSelected = selectedIds.has(file.id);
                    const isVerified = file.status === "Verified";
                    const uploaded = formatRelativeDate(file.rawCreatedAt);
                    const modified = formatRelativeDate(getFileModifiedAt(file));
                    const uploaderInfo = uploaderDetails[file.uploaderId];
                    const { bg: avatarBg } = getAvatarColor(file.uploader);
                    const isFileHovered = hoveredFileId === file.id;
                    const isUserHovered =
                      hoveredUploaderId === file.uploaderId && file.uploaderId;

                    return (
                      <tr
                        key={file.id}
                        className={`group relative transition-colors ${
                          isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* File cell — with hover popover */}
                        <td className="px-3 py-3.5 min-w-55">
                          <div
                            className="relative block w-full"
                            onMouseEnter={() => handleFileMouseEnter(file.id)}
                            onMouseLeave={handleFileMouseLeave}
                          >
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canVerify) {
                                    if (isVerifying) return;
                                    setVerifyTarget(file);
                                  } else {
                                    toggleSelect(file.id);
                                  }
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? "bg-blue-50 border border-blue-200 text-blue-600"
                                    : `border border-transparent group-hover:bg-slate-100 group-hover:border-slate-200 group-hover:text-slate-400 ${bg}`
                                }`}
                              >
                                {isSelected ? (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                  >
                                    <path
                                      d="M2 6l3 3 5-5"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <div className="relative flex items-center justify-center w-full h-full">
                                    <Icon
                                      size={14}
                                      className={`absolute transition-opacity duration-200 ${color} group-hover:opacity-0`}
                                    />
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 12 12"
                                      fill="none"
                                      className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    >
                                      <path
                                        d="M2 6l3 3 5-5"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-slate-800 truncate w-full leading-tight">
                                  {file.name}
                                </p>
                                <p
                                  className={`text-[10px] font-semibold ${color} leading-none mt-0.5`}
                                >
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
                                onPreview={() => {
                                  setHoveredFileId(null);
                                  setEditingFile(file);
                                }}
                                onDownload={() => {
                                  setHoveredFileId(null);
                                  handleDownloadFile(file);
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status badge — clickable to open verify modal (verify-eligible roles only) */}
                        <td className="px-3 py-3.5 w-32">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!canVerify || isVerifying) return;
                              setVerifyTarget(file);
                            }}
                            disabled={!canVerify || isVerifying}
                            title={
                              canVerify
                                ? isVerified
                                  ? "Click to unverify"
                                  : "Click to verify"
                                : undefined
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                              isVerified
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            } ${
                              canVerify
                                ? "cursor-pointer hover:brightness-95"
                                : "cursor-default"
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {isVerified ? (
                              <>
                                <CheckCircle2 size={10} /> Verified ✓
                              </>
                            ) : (
                              <>
                                <XCircle size={10} className="opacity-60" />{" "}
                                Unverified
                              </>
                            )}
                          </button>
                        </td>

                        {/* Size */}
                        <td className="px-3 py-3.5 w-24">
                          <span className="text-[12px] text-slate-500 font-medium">
                            {file.size}
                          </span>
                        </td>

                        {/* Uploaded By — with user popover */}
                        <td className="px-3 py-3.5 w-44 hidden md:table-cell">
                          <div
                            className="relative block w-full"
                            onMouseEnter={() =>
                              file.uploaderId &&
                              handleUserMouseEnter(file.uploaderId)
                            }
                            onMouseLeave={handleUserMouseLeave}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 ${avatarBg} rounded-full flex items-center justify-center shrink-0`}
                              >
                                <span className="text-[9px] font-bold text-white">
                                  {getInitials(file.uploader)}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-slate-700 truncate w-full leading-tight">
                                  {file.uploader}
                                </p>
                                {uploaderInfo?.role && (
                                  <p className="text-[10px] text-slate-400 leading-none mt-0.5 truncate w-full">
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
                        <td className="px-3 py-3.5 w-32 hidden sm:table-cell">
                          <p className="text-[12px] font-semibold text-slate-700 leading-tight">
                            {uploaded.relative}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {uploaded.time}
                          </p>
                        </td>

                        {/* Last Modified — with hover popover */}
                        <td className="px-3 py-3.5 w-32 hidden xl:table-cell">
                          <div
                            className="relative inline-block"
                            onMouseEnter={() =>
                              handleModifiedMouseEnter(file.id)
                            }
                            onMouseLeave={handleModifiedMouseLeave}
                          >
                            <div>
                              <p className="text-[12px] font-semibold text-slate-700 leading-tight">
                                {modified.relative}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {modified.time}
                              </p>
                            </div>
                            {/* Last Modified hover popover */}
                            <div
                              className={`absolute z-50 right-[calc(100%+20px)] ${verticalPos} transition-all duration-200 ease-out origin-right ${
                                hoveredModifiedId === file.id
                                  ? "opacity-100 visible scale-100 pointer-events-auto"
                                  : "opacity-0 invisible scale-95 pointer-events-none"
                              }`}
                            >
                              <LastModifiedInfoCard
                                rawDate={getFileModifiedAt(file)}
                                uploaderInfo={uploaderInfo}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3.5 pr-4 w-40">
                          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-150">
                            {canEdit ? (
                              <>
                                <button
                                  onClick={() => setEditingFile(file)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-colors"
                                  title="Preview"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleDownloadClick(e, file)}
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
                              </>
                            ) : hasFileAccess(file) ? (
                              <>
                                <button
                                  onClick={() => setEditingFile(file)}
                                  title="Preview"
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-colors"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleDownloadClick(e, file)}
                                  disabled={downloadingId === file.id}
                                  title="Download"
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-colors disabled:opacity-40"
                                >
                                  <Download size={14} />
                                </button>
                              </>
                            ) : fileRequestStatus(file) === "pending" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-semibold border border-amber-200">
                                <Clock size={10} /> Requested
                              </span>
                            ) : (
                              <>
                                <LockedFileButton
                                  Icon={Eye}
                                  label="View — request access"
                                  onClick={() => openRequestModal(file)}
                                />
                                <LockedFileButton
                                  Icon={Download}
                                  label="Download — request access"
                                  onClick={() => openRequestModal(file)}
                                />
                              </>
                            )}

                            {canViewFeedback(file) && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      setFeedbackTarget(file);
      setFeedbackUnread((prev) => ({ ...prev, [file.id]: false }));
    }}
    className="relative p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-colors"
    title="Feedback"
  >
    <MessageSquare size={14} />
    {feedbackUnread[file.id] && (
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500" />
    )}
  </button>
)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* ── GRID VIEW ───────────────────────────────────── */
          <div className="rounded-2xl sm:rounded-[28px] border border-white/70 bg-white/85 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 p-2.5 sm:p-4">
              {paginated.map((file) => (
                <MobileFileGridCard
                 key={file.id}
  file={file}
  canEdit={canEdit}
  canVerify={canVerify}
  isVerifying={isVerifying}
  isSelected={selectedIds.has(file.id)}
  downloadingId={downloadingId}
  deletingId={deletingId}
  hasAccess={hasFileAccess(file)}
  requestStatus={fileRequestStatus(file)}
  canViewFeedback={canViewFeedback(file)}
  hasUnreadFeedback={!!feedbackUnread[file.id]}
  onSelectOrVerify={() => {
    if (canVerify) {
      if (isVerifying) return;
      setVerifyTarget(file);
    } else {
      toggleSelect(file.id);
    }
  }}
  onVerify={() => setVerifyTarget(file)}
  onPreview={() => setEditingFile(file)}
  onDownload={(e) => handleDownloadClick(e, file)}
  onDelete={() => handleDeleteFile(file)}
  onRequestAccess={() => openRequestModal(file)}
  onOpenFeedback={() => {
    setFeedbackTarget(file);
    setFeedbackUnread((prev) => ({ ...prev, [file.id]: false }));
  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      {/* end max-w container */}

      {/* ── Modals ──────────────────────────────────────────── */}
      <FileEditModal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        file={editingFile}
        uploaderName={editingFile?.uploader}
        canEdit={canEdit}
        onSaved={() => {
          setEditingFile(null);
          if (decodedName) fetchData();
        }}
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

      <FileRequestModal
        isOpen={showFileRequestModal}
        onClose={() => setShowFileRequestModal(false)}
        onSubmit={submitFileRequest}
        isSubmitting={isSubmittingFileRequest}
      />

      <FileRequestsPanel
        isOpen={showFileRequestsPanel}
        onClose={() => setShowFileRequestsPanel(false)}
        requests={myFileRequests}
        isLoading={loadingFileRequests}
      />

      <FileAccessRequestModal
        isOpen={!!requestModalFiles}
        onClose={() => setRequestModalFiles(null)}
        files={requestModalFiles || []}
        availableFiles={allFiles.filter(
          (f) =>
            !requestModalFiles?.some((rf) => rf.id === f.id) &&
            !hasFileAccess(f) &&
            fileRequestStatus(f) !== "pending",
        )}
        sectionName={section?.name}
        onSubmit={submitAccessRequest}
        isSubmitting={isSubmittingRequest}
      />

      {downloadMenuTarget && (
        <DownloadOptionsMenu
          x={downloadMenuTarget.x}
          y={downloadMenuTarget.y}
          onDownloadRaw={() => handleDownloadFile(downloadMenuTarget.file)}
          onDownloadVerified={() =>
            handleDownloadVerifiedPdf(downloadMenuTarget.file)
          }
          onClose={() => setDownloadMenuTarget(null)}
        />
      )}

      {actionsMenuTarget && (
        <FileActionsMenu
          x={actionsMenuTarget.x}
          y={actionsMenuTarget.y}
          feedbackCount={feedbackCounts[actionsMenuTarget.file.id] || 0}
          onFeedback={() => {
            setFeedbackTarget(actionsMenuTarget.file);
            setFeedbackUnread((prev) => ({
              ...prev,
              [actionsMenuTarget.file.id]: false,
            }));
          }}
          onClose={() => setActionsMenuTarget(null)}
        />
      )}

      <FileFeedbackModal
        isOpen={!!feedbackTarget}
        onClose={() => setFeedbackTarget(null)}
        file={feedbackTarget}
        section={section}
        userProfile={userProfile}
        onRead={(fileId) =>
          setFeedbackUnread((prev) => ({ ...prev, [fileId]: false }))
        }
      />

      {canEdit && (
        <>
          <FloatingAccessRequestsButton
            userProfile={userProfile}
            refreshKey={accessRefreshKey}
            onClick={() => setIsAccessSidebarOpen(true)}
          />

          <AccessRequestsSidebar
            isOpen={isAccessSidebarOpen}
            onClose={() => {
              setIsAccessSidebarOpen(false);
              setAccessRefreshKey((k) => k + 1);
            }}
            userProfile={userProfile}
          />
        </>
      )}

      {/* ── Success toast ──────────────────────────────────── */}
      <div
        className={`fixed bottom-8 right-8 z-50 flex flex-col bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${
          showDeleteToast
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-[120%] opacity-0 pointer-events-none"
        }`}
        style={{
          width: "380px",
          minHeight: "76px",
          borderRadius: "16px",
          boxShadow: showDeleteToast
            ? "0 4px 24px rgba(16, 185, 129, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
            : "0 12px 30px rgba(0,0,0,0)",
          fontFamily: "Poppins, sans-serif",
          border: "1px solid rgba(241, 245, 249, 1)",
        }}
      >
        <div className="absolute top-0 left-0 bottom-0 w-32 pointer-events-none bg-linear-to-r from-emerald-100/60 to-transparent" />

        <div
          className="flex items-center relative z-10 py-4 flex-1"
          style={{
            padding: "0 20px",
            gap: "16px",
            minHeight: "76px",
          }}
        >
          <div
            className="flex items-center justify-center shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)]"
            style={{
              width: "42px",
              height: "42px",
            }}
          >
            <CheckCircle
              size={22}
              className="text-emerald-500"
              strokeWidth={2.5}
            />
          </div>

          <div className="flex flex-col justify-center flex-1">
            <p
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Success
            </p>

            <p
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#64748B",
                marginTop: "3px",
                margin: 0,
              }}
            >
              File deleted successfully.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteToast(false)}
            className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
            aria-label="Close notification"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {showFileRequestToast && (
        <div
          className="fixed top-6 right-6 z-50 flex bg-white overflow-hidden"
          style={{
            width: 360,
            height: 72,
            borderRadius: 12,
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <div
            style={{ width: 6, backgroundColor: "#43D45B", flexShrink: 0 }}
          />
          <div
            className="flex items-center flex-1 relative"
            style={{ padding: "0 14px", gap: 12 }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: "#43D45B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1F1F2E",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Success
              </p>
              <p
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "#666",
                  marginTop: 2,
                  margin: 0,
                }}
              >
                File request submitted.
              </p>
            </div>
            <button
              onClick={() => setShowFileRequestToast(false)}
              className="absolute top-2 right-2.5"
              style={{
                color: "#666",
                background: "none",
                border: "none",
                fontSize: 16,
                lineHeight: 1,
                cursor: "pointer",
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
