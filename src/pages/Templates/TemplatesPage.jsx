// TemplatesPage.jsx — Templates management page (Administrator + Division Focal)
import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  CheckCircle,
  Search,
  LayoutTemplate,
  Download,
  Save,
  FolderOpen,
  Building2,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { ROLES } from "../../utils/accessControl";
import {
  fetchAllTemplates,
  uploadTemplate,
  updateTemplate,
  replaceTemplateFile,
  deleteTemplate,
  fetchAllSections,
  fetchAllDivisions,
  getTemplateDownloadUrl,
} from "../../utils/templatesApi";
import ModalPortal from "../../components/Modals/ModalPortal";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fileSizeLabel(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExt(fileName = "") {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
}

function suggestNameFromFile(fileName = "") {
  const base = fileName.replace(/\.[^.]+$/, "");
  const spaced = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Access Restricted ─────────────────────────────────────────────────────────
function AccessRestricted() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
          <ShieldAlert className="text-red-500" size={26} />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Access restricted</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Templates can only be managed by administrators and division focal
          persons. Contact your administrator if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ isOpen, onClose, onConfirm, templateName, isDeleting }) {
  if (!isOpen) return null;
  return (
    <ModalPortal>
      <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] overflow-hidden">
          <div className="flex flex-col items-center text-center gap-4 px-8 pt-8 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
              <Trash2 className="text-red-600" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Delete Template?</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                This will permanently remove{" "}
                <span className="font-semibold text-slate-700">"{templateName}"</span>
                {" "}and its file from storage.
                <br />This action cannot be undone.
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
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ── Replace File Modal ─────────────────────────────────────────────────────────
function ReplaceFileModal({ isOpen, onClose, onConfirm, templateName, isReplacing }) {
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { if (!isOpen) setFile(null); }, [isOpen]);

  if (!isOpen) return null;
  return (
    <ModalPortal>
      <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <RefreshCw size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-[1rem] font-bold text-slate-800">Replace File</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {templateName}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <UploadCloud size={28} className="text-slate-300" />
              {file ? (
                <p className="text-sm font-semibold text-blue-600">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-500">Click to choose a new file</p>
                  <p className="text-xs text-slate-400">.xlsx or .xls only</p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={onClose}
              disabled={isReplacing}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => file && onConfirm(file)}
              disabled={!file || isReplacing}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isReplacing ? "Replacing…" : "Replace"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ── Section Picker ────────────────────────────────────────────────────────────
// A searchable, chip-based section picker. Single-select is used both for the
// upload wizard and for inline edits, so every template belongs to exactly
// one section.
function SectionPicker({
  sections,
  divisions,
  groupByDivision,
  value,
  onChange,
  placeholder = "Search sections…",
  autoFocus = false,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const divisionById = useMemo(
    () => Object.fromEntries(divisions.map((d) => [d.id, d])),
    [divisions]
  );

  const q = query.trim().toLowerCase();
  const results = q
    ? sections.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (divisionById[s.division_id]?.name || "").toLowerCase().includes(q)
      )
    : sections;

  const groupedResults = groupByDivision
    ? divisions
        .map((d) => ({ division: d, items: results.filter((s) => s.division_id === d.id) }))
        .filter((g) => g.items.length > 0)
    : null;

  function selectSection(id) {
    onChange(id);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) selectSection(results[0].id);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const selectedSection = value ? sections.find((s) => s.id === value) : null;
  const selectedDivisionLabel =
    selectedSection && groupByDivision ? divisionById[selectedSection.division_id]?.name : null;

  return (
    <div ref={wrapRef} className="relative">
      {!open && selectedSection ? (
        // Chip-style display for the current selection — click to search/change it.
        <button
          type="button"
          onClick={() => { setOpen(true); setQuery(""); setTimeout(() => inputRef.current?.focus(), 0); }}
          className="w-full flex items-center gap-2 pl-3 pr-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-left"
        >
          <FolderOpen size={14} className="text-blue-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-700 truncate">{selectedSection.name}</span>
          {selectedDivisionLabel && (
            <span className="ml-auto shrink-0 max-w-[45%] truncate text-[0.65rem] font-semibold text-slate-400 bg-white border border-slate-200 rounded-full px-2 py-0.5">
              {selectedDivisionLabel}
            </span>
          )}
        </button>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            autoFocus={autoFocus}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          />
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)] py-1.5">
          {groupByDivision ? (
            !groupedResults || groupedResults.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-4 text-center">
                {sections.length === 0 ? "No sections available." : "No matching sections."}
              </p>
            ) : (
              groupedResults.map(({ division, items }) => (
                <div key={division.id} className="px-1.5 pb-1">
                  <p className="px-2 py-1.5 text-[0.62rem] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Building2 size={10} /> {division.name}
                  </p>
                  {items.map((sec) => (
                    <button
                      type="button"
                      key={sec.id}
                      onClick={() => selectSection(sec.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-blue-50 transition-colors ${
                        value === sec.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <FolderOpen size={13} className="text-slate-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-700">{sec.name}</span>
                      {value === sec.id && (
                        <CheckCircle size={13} className="ml-auto text-blue-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )
          ) : results.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 py-4 text-center">
              {sections.length === 0 ? "No sections in your division." : "No matching sections."}
            </p>
          ) : (
            results.map((sec) => (
              <button
                type="button"
                key={sec.id}
                onClick={() => selectSection(sec.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                  value === sec.id ? "bg-blue-50" : ""
                }`}
              >
                <FolderOpen size={13} className="text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{sec.name}</span>
                {value === sec.id && (
                  <CheckCircle size={13} className="ml-auto text-blue-500 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Upload Card (wizard: file first, then name + section assignment) ─────────
function UploadCard({ sections, divisions, groupByDivision, contextLabel, userId, disabled, onUploaded }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [sectionId, setSectionId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  function applyFile(f) {
    if (!f) return;
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      setError("Only .xlsx or .xls files are allowed.");
      return;
    }
    setError("");
    setFile(f);
    if (!nameTouched) setName(suggestNameFromFile(f.name));
  }

  function resetToStepOne() {
    setFile(null);
    setSectionId(null);
    setError("");
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) applyFile(e.dataTransfer.files[0]);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) { setError("Please select an Excel file."); return; }
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!sectionId) {
      setError("Choose the section this template belongs to.");
      return;
    }

    setUploading(true);
    try {
      const section = sections.find((s) => s.id === sectionId);
      await uploadTemplate({ name: name.trim(), sectionId, sectionName: section?.name, file, userId });
      setFile(null);
      setName("");
      setNameTouched(false);
      setSectionId(null);
      onUploaded?.();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] p-6"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <UploadCloud size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-[0.95rem] font-bold text-slate-800">Upload New Template</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {file ? "Name it and choose where it belongs" : "Start by choosing an Excel file"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 my-4">
        <div className={`h-1 flex-1 rounded-full transition-colors ${file ? "bg-blue-500" : "bg-blue-200"}`} />
        <div className={`h-1 flex-1 rounded-full transition-colors ${file ? "bg-blue-500" : "bg-slate-100"}`} />
      </div>

      {disabled ? (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs font-medium text-amber-700 leading-relaxed">
            Your account isn't linked to a division yet, so you can't upload
            templates. Ask an administrator to assign your division.
          </p>
        </div>
      ) : !file ? (
        // ── Step 1: choose a file ──
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => applyFile(e.target.files[0] || null)}
          />
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl px-6 py-10 flex flex-col items-center gap-3 cursor-pointer text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50/60" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <UploadCloud size={26} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Drag & drop your Excel file</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse your computer</p>
            </div>
            <span className="text-[0.65rem] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              .XLSX or .XLS only
            </span>
          </div>
          {error && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-3">
              <X size={12} /> {error}
            </p>
          )}
        </div>
      ) : (
        // ── Step 2: name it, then choose where it belongs ──
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-blue-100 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={16} className="text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{fileSizeLabel(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={resetToStepOne}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0 px-2 py-1 rounded-lg hover:bg-white transition-colors"
            >
              <ArrowLeft size={12} /> Change
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Template Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameTouched(true); }}
                placeholder="e.g. Enrollment Data"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              />
              {!nameTouched && name && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[0.6rem] font-bold text-blue-400">
                  <Sparkles size={11} /> Suggested
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Which section does this belong to?
            </label>
            {contextLabel && (
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                <Building2 size={11} /> {contextLabel}
              </p>
            )}
            <SectionPicker
              sections={sections}
              divisions={divisions}
              groupByDivision={groupByDivision}
              value={sectionId}
              onChange={setSectionId}
              placeholder={groupByDivision ? "Search sections or divisions…" : "Search sections in your division…"}
            />
            <p className="text-[0.7rem] text-slate-400 mt-1.5">
              Each template belongs to exactly one section.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <X size={12} /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            <UploadCloud size={16} />
            {uploading ? "Uploading…" : "Upload Template"}
          </button>
        </div>
      )}
    </form>
  );
}

// ── Template row (view + edit) ────────────────────────────────────────────────
function TemplateActions({ onDownload, onEdit, onReplace, onDelete, isDownloading }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={onDownload}
        disabled={isDownloading}
        title="Download"
        className="p-2 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-40"
      >
        <Download size={14} />
      </button>
      <button
        onClick={onEdit}
        title="Edit"
        className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={onReplace}
        title="Replace file"
        className="p-2 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
      >
        <RefreshCw size={14} />
      </button>
      <button
        onClick={onDelete}
        title="Delete"
        className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function TemplateCard({ t, showBreadcrumb, onDownload, onEdit, onReplace, onDelete, isDownloading }) {
  const divisionName = t.section?.division?.name || t.division?.name;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3 hover:border-slate-200 hover:shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-all">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
        <FileSpreadsheet size={16} className="text-emerald-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 truncate">{t.name}</span>
          <span className="text-[0.6rem] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
            {fileExt(t.file_name)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-xs text-slate-400 truncate max-w-[220px]">{t.file_name}</span>
          <span className="text-slate-300 text-xs">•</span>
          <span className="text-xs text-slate-400">{formatDate(t.created_at)}</span>
          {showBreadcrumb && divisionName && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 text-[0.65rem] font-semibold">
              <Building2 size={9} /> {divisionName}
            </span>
          )}
          {showBreadcrumb && t.section?.name && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[0.65rem] font-semibold">
              <FolderOpen size={9} /> {t.section.name}
            </span>
          )}
        </div>
      </div>
      <TemplateActions
        onDownload={onDownload}
        onEdit={onEdit}
        onReplace={onReplace}
        onDelete={onDelete}
        isDownloading={isDownloading}
      />
    </div>
  );
}

function EditableTemplateCard({ template, sections, divisions, groupByDivision, onSave, onCancel, isSaving }) {
  const [name, setName] = useState(template.name);
  const [sectionId, setSectionId] = useState(template.section_id || null);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 px-3.5 py-3.5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white border border-blue-100 flex items-center justify-center shrink-0">
          <FileSpreadsheet size={16} className="text-emerald-600" />
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 rounded-lg border border-blue-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Template name"
          autoFocus
        />
      </div>
      <div>
        <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block mb-1">Section</label>
        <SectionPicker
          sections={sections}
          divisions={divisions}
          groupByDivision={groupByDivision}
          value={sectionId}
          onChange={setSectionId}
          placeholder="Search for a section…"
        />
      </div>
      <div className="flex items-center gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => sectionId && name.trim() && onSave({ name: name.trim(), sectionId })}
          disabled={isSaving || !sectionId || !name.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save size={12} /> {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Group header ──────────────────────────────────────────────────────────────
function GroupHeader({ icon: Icon, label, count, collapsed, onToggle, tone }) {
  const toneClasses = tone === "division"
    ? "bg-violet-50/60 hover:bg-violet-50 text-violet-700"
    : "bg-slate-50 hover:bg-slate-100 text-slate-600";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${toneClasses}`}
    >
      {collapsed ? <ChevronRight size={13} className="shrink-0" /> : <ChevronDown size={13} className="shrink-0" />}
      <Icon size={13} className="shrink-0" />
      <span className="text-xs font-bold truncate">{label}</span>
      <span className="ml-auto shrink-0 text-[0.65rem] font-bold opacity-60">{count}</span>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const { userProfile } = useUser();

  const isAdmin = userProfile?.role === ROLES.ADMIN;
  const isDivisionFocal = userProfile?.role === ROLES.DIVISION_FOCAL;
  const canAccess = isAdmin || isDivisionFocal;
  const myDivisionId = userProfile?.division_id ?? userProfile?.division?.id ?? null;

  const [templates, setTemplates] = useState([]);
  const [sections, setSections] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [replacingTemplate, setReplacingTemplate] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const [downloadingId, setDownloadingId] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const loadData = useCallback(async () => {
    if (!canAccess) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [tmpl, secs, divs] = await Promise.all([
        fetchAllTemplates(),
        fetchAllSections(),
        fetchAllDivisions(),
      ]);

      if (isAdmin) {
        setTemplates(tmpl);
        setSections(secs);
        setDivisions(divs);
      } else {
        const myDivision = divs.find((d) => d.id === myDivisionId) || null;
        const myDivisionSections = secs.filter((s) => s.division_id === myDivisionId);
        const myDivisionSectionIds = new Set(myDivisionSections.map((s) => s.id));

        setTemplates(
          tmpl.filter(
            (t) =>
              (t.section_id && myDivisionSectionIds.has(t.section_id)) ||
              t.division_id === myDivisionId
          )
        );
        setSections(myDivisionSections);
        setDivisions(myDivision ? [myDivision] : []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canAccess, isAdmin, myDivisionId]);

  useEffect(() => { loadData(); }, [loadData]);

  const searchActive = search.trim().length > 0;

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.file_name.toLowerCase().includes(search.toLowerCase()) ||
    t.section?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.division?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Admins: Division → Section → templates. Focal persons: Section → templates.
  const groupedTree = useMemo(() => {
    if (searchActive) return null;
    if (isAdmin) {
      const byDivision = new Map();
      for (const t of filtered) {
        const divName = t.section?.division?.name || t.division?.name || "Unassigned";
        const secName = t.section?.name || "Unassigned Section";
        if (!byDivision.has(divName)) byDivision.set(divName, new Map());
        const bySection = byDivision.get(divName);
        if (!bySection.has(secName)) bySection.set(secName, []);
        bySection.get(secName).push(t);
      }
      return Array.from(byDivision.entries())
        .map(([divName, bySection]) => [
          divName,
          Array.from(bySection.entries()).sort((a, b) => a[0].localeCompare(b[0])),
        ])
        .sort((a, b) => a[0].localeCompare(b[0]));
    }
    const bySection = new Map();
    for (const t of filtered) {
      const secName = t.section?.name || "Unassigned Section";
      if (!bySection.has(secName)) bySection.set(secName, []);
      bySection.get(secName).push(t);
    }
    return Array.from(bySection.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, isAdmin, searchActive]);

  async function handleSaveEdit(templateId, fields, currentTemplate) {
    setSavingId(templateId);
    try {
      const newSection = sections.find((s) => s.id === fields.sectionId);
      const updated = await updateTemplate(templateId, {
        name: fields.name,
        sectionId: fields.sectionId,
        currentStoragePath: currentTemplate?.storage_path,
        newSectionName: newSection?.name,
      });
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
      setEditingId(null);
      showToast("Template updated.");
    } catch (err) {
      showToast(err.message || "Update failed.", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (!deletingTemplate) return;
    setIsDeleting(true);
    try {
      await deleteTemplate(deletingTemplate.id, deletingTemplate.storage_path);
      setTemplates((prev) => prev.filter((t) => t.id !== deletingTemplate.id));
      setDeletingTemplate(null);
      showToast("Template deleted.");
    } catch (err) {
      showToast(err.message || "Delete failed.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleReplaceFile(file) {
    if (!replacingTemplate) return;
    setIsReplacing(true);
    try {
      const updated = await replaceTemplateFile(replacingTemplate.id, {
        file,
        oldStoragePath: replacingTemplate.storage_path,
        sectionName: replacingTemplate.section?.name,
      });
      setTemplates((prev) => prev.map((t) => (t.id === replacingTemplate.id ? updated : t)));
      setReplacingTemplate(null);
      showToast("File replaced.");
    } catch (err) {
      showToast(err.message || "Replace failed.", "error");
    } finally {
      setIsReplacing(false);
    }
  }

  async function handleDownload(template) {
    setDownloadingId(template.id);
    try {
      const url = await getTemplateDownloadUrl(template.storage_path);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.file_name;
      a.click();
    } catch (err) {
      showToast(err.message || "Download failed.", "error");
    } finally {
      setDownloadingId(null);
    }
  }

  if (!canAccess) return <AccessRestricted />;

  const uploadDisabled = isDivisionFocal && !myDivisionId;

  function renderTemplate(t) {
    return editingId === t.id ? (
      <EditableTemplateCard
        key={t.id}
        template={t}
        sections={sections}
        divisions={divisions}
        groupByDivision={isAdmin}
        isSaving={savingId === t.id}
        onSave={(fields) => handleSaveEdit(t.id, fields, t)}
        onCancel={() => setEditingId(null)}
      />
    ) : (
      <TemplateCard
        key={t.id}
        t={t}
        showBreadcrumb={searchActive}
        isDownloading={downloadingId === t.id}
        onDownload={() => handleDownload(t)}
        onEdit={() => setEditingId(t.id)}
        onReplace={() => setReplacingTemplate(t)}
        onDelete={() => setDeletingTemplate(t)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <LayoutTemplate size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Templates</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isAdmin
                ? "Manage and assign Excel templates to sections"
                : "Manage Excel templates for sections in your division"}
            </p>
          </div>
        </div>
        {isDivisionFocal && divisions[0]?.name && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100">
            <Building2 size={12} /> {divisions[0].name}
          </span>
        )}
      </div>

      {/* ── Layout: Upload card (left) + Browse area (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        <div className="lg:sticky lg:top-6">
          <UploadCard
            sections={sections}
            divisions={divisions}
            groupByDivision={isAdmin}
            contextLabel={isDivisionFocal ? "Only sections in your division are shown" : undefined}
            disabled={uploadDisabled}
            userId={userProfile?.id}
            onUploaded={() => {
              loadData();
              showToast("Template uploaded successfully!");
            }}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <p className="text-[0.9rem] font-bold text-slate-800">
                {isAdmin ? "All Templates" : "Division Templates"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {filtered.length} template{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates…"
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 w-36 sm:w-52"
                />
              </div>
              <button
                onClick={loadData}
                title="Refresh"
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400">
                Loading templates…
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16 text-sm text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileSpreadsheet size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-400 text-center max-w-xs">
                  {search
                    ? "No templates match your search."
                    : isAdmin
                    ? "No templates yet. Upload one to get started."
                    : "No templates for your division yet. Upload one to get started."}
                </p>
              </div>
            ) : searchActive ? (
              // Flat, breadcrumbed results while searching
              <div className="space-y-2">{filtered.map(renderTemplate)}</div>
            ) : isAdmin ? (
              // Division → Section grouped tree
              <div className="space-y-3">
                {groupedTree.map(([divName, sectionEntries]) => {
                  const divKey = `div:${divName}`;
                  const divCollapsed = collapsedGroups.has(divKey);
                  const divCount = sectionEntries.reduce((sum, [, items]) => sum + items.length, 0);
                  return (
                    <div key={divKey}>
                      <GroupHeader
                        icon={Building2}
                        label={divName}
                        count={divCount}
                        collapsed={divCollapsed}
                        onToggle={() => toggleGroup(divKey)}
                        tone="division"
                      />
                      {!divCollapsed && (
                        <div className="mt-2 ml-3 pl-3 border-l-2 border-violet-100 space-y-2">
                          {sectionEntries.map(([secName, items]) => {
                            const secKey = `sec:${divName}|${secName}`;
                            const secCollapsed = collapsedGroups.has(secKey);
                            return (
                              <div key={secKey}>
                                <GroupHeader
                                  icon={FolderOpen}
                                  label={secName}
                                  count={items.length}
                                  collapsed={secCollapsed}
                                  onToggle={() => toggleGroup(secKey)}
                                  tone="section"
                                />
                                {!secCollapsed && (
                                  <div className="mt-2 space-y-2">{items.map(renderTemplate)}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Section grouped list for division focal persons
              <div className="space-y-3">
                {groupedTree.map(([secName, items]) => {
                  const secKey = `sec:${secName}`;
                  const secCollapsed = collapsedGroups.has(secKey);
                  return (
                    <div key={secKey}>
                      <GroupHeader
                        icon={FolderOpen}
                        label={secName}
                        count={items.length}
                        collapsed={secCollapsed}
                        onToggle={() => toggleGroup(secKey)}
                        tone="section"
                      />
                      {!secCollapsed && <div className="mt-2 space-y-2">{items.map(renderTemplate)}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <DeleteConfirmModal
        isOpen={!!deletingTemplate}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={handleDelete}
        templateName={deletingTemplate?.name || ""}
        isDeleting={isDeleting}
      />

      <ReplaceFileModal
        isOpen={!!replacingTemplate}
        onClose={() => setReplacingTemplate(null)}
        onConfirm={handleReplaceFile}
        templateName={replacingTemplate?.name || ""}
        isReplacing={isReplacing}
      />

      {/* ── Toast ── */}
      <div
        className={`fixed bottom-8 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.12)] border transition-all duration-500 ${
          toast
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none"
        } ${
          toast?.type === "error"
            ? "bg-red-50 border-red-100 text-red-700"
            : "bg-white border-slate-100 text-slate-700"
        }`}
      >
        {toast?.type === "error" ? (
          <X size={16} className="text-red-500 shrink-0" />
        ) : (
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
        )}
        <p className="text-sm font-semibold">{toast?.msg}</p>
      </div>
    </div>
  );
}