// TemplatesPage.jsx — Admin-only Templates management page
import { useState, useRef, useEffect, useCallback } from "react";
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
  Plus,
  Download,
  Save,
  FolderOpen,
  Building2,
} from "lucide-react";
import { useUser } from "../../contexts/UserContext";
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
import { ChevronDown, ChevronRight } from "lucide-react";
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

// ── Upload Card ───────────────────────────────────────────────────────────────
function UploadCard({ sections, divisions, userId, onUploaded }) {
  const [name, setName] = useState("");
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [selectedDivisionIds, setSelectedDivisionIds] = useState([]);
  const [expandedDivisions, setExpandedDivisions] = useState({});
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleDivisionToggle = (divId, isChecked) => {
    const childSections = sections.filter(s => s.division_id === divId).map(s => s.id);
    
    if (isChecked) {
      setSelectedDivisionIds(prev => [...prev.filter(id => id !== divId), divId]);
      setSelectedSectionIds(prev => {
        const set = new Set(prev);
        childSections.forEach(id => set.add(id));
        return Array.from(set);
      });
    } else {
      setSelectedDivisionIds(prev => prev.filter(id => id !== divId));
      setSelectedSectionIds(prev => prev.filter(id => !childSections.includes(id)));
    }
  };

  const handleSectionToggle = (secId, divId, isChecked) => {
    let newSecs;
    if (isChecked) {
      newSecs = [...selectedSectionIds, secId];
    } else {
      newSecs = selectedSectionIds.filter(id => id !== secId);
    }
    setSelectedSectionIds(newSecs);

    const childSections = sections.filter(s => s.division_id === divId).map(s => s.id);
    const allChecked = childSections.every(id => newSecs.includes(id));

    if (allChecked) {
      setSelectedDivisionIds(prev => prev.includes(divId) ? prev : [...prev, divId]);
    } else {
      setSelectedDivisionIds(prev => prev.filter(id => id !== divId));
    }
  };

  const toggleDivisionExpand = (divId, e) => {
    e.stopPropagation();
    setExpandedDivisions(prev => ({ ...prev, [divId]: !prev[divId] }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      // Only accept xlsx/xls
      if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) {
        setFile(droppedFile);
      } else {
        setError("Only .xlsx or .xls files are allowed.");
      }
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!file) { setError("Please select an Excel file."); return; }
    if (selectedSectionIds.length === 0 && selectedDivisionIds.length === 0) {
      setError("Assign this template to at least one division or section."); return;
    }

    setUploading(true);
    try {
      const uploads = [];

      for (const did of selectedDivisionIds) {
        uploads.push(uploadTemplate({ name: name.trim(), sectionId: null, divisionId: did, file, userId }));
      }

      for (const sid of selectedSectionIds) {
        const sec = sections.find(s => s.id === sid);
        if (sec && !selectedDivisionIds.includes(sec.division_id)) {
          uploads.push(uploadTemplate({ name: name.trim(), sectionId: sid, divisionId: null, file, userId }));
        }
      }

      await Promise.all(uploads);
      setName("");
      setSelectedSectionIds([]);
      setSelectedDivisionIds([]);
      setFile(null);
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
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Plus size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-[0.95rem] font-bold text-slate-800">Upload New Template</h2>
          <p className="text-xs text-slate-400 mt-0.5">Add an Excel template and assign it to sections or divisions</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Template Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Enrollment Data"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Excel File
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl px-4 py-4 flex items-center gap-3 cursor-pointer transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50/60" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
            }`}
          >
            <UploadCloud size={22} className={file ? "text-blue-500" : "text-slate-300"} />
            {file ? (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-600 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{fileSizeLabel(file.size)}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-500">Click to choose file</p>
                <p className="text-xs text-slate-400">.xlsx or .xls only</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            <Building2 size={12} className="inline mr-1" />
            Assign to Divisions / Sections
          </label>
          <div className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {divisions.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-2">No divisions found</p>
            ) : (
              divisions.map((div) => {
                const childSections = sections.filter(s => s.division_id === div.id);
                const isExpanded = expandedDivisions[div.id];

                return (
                  <div key={div.id} className="flex flex-col">
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors">
                      {childSections.length > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => toggleDivisionExpand(div.id, e)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      ) : (
                        <div className="w-6" />
                      )}
                      
                      <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDivisionIds.includes(div.id)}
                          onChange={(e) => handleDivisionToggle(div.id, e.target.checked)}
                          className="rounded border-slate-300 accent-blue-600"
                        />
                        <span className="text-sm font-semibold text-slate-700">{div.name}</span>
                      </label>
                    </div>

                    {isExpanded && childSections.length > 0 && (
                      <div className="bg-white pl-10 pr-3 py-1 flex flex-col gap-1 border-t border-slate-100 shadow-inner">
                        {childSections.map(sec => (
                          <label key={sec.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-slate-50 rounded">
                            <input
                              type="checkbox"
                              checked={selectedSectionIds.includes(sec.id)}
                              onChange={(e) => handleSectionToggle(sec.id, div.id, e.target.checked)}
                              className="rounded border-slate-300 accent-blue-600"
                            />
                            <span className="text-xs font-medium text-slate-600">{sec.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
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
    </form>
  );
}

// ── Inline Edit Row ───────────────────────────────────────────────────────────
function EditableRow({ template, sections, divisions, onSave, onCancel, isSaving }) {
  const [name, setName] = useState(template.name);
  const [sectionId, setSectionId] = useState(template.section_id || "");
  const [divisionId, setDivisionId] = useState(template.division_id || "");

  return (
    <tr className="bg-blue-50/40">
      <td className="px-4 py-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Template name"
          autoFocus
        />
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{template.file_name}</td>
      <td className="px-4 py-3">
        <select
          value={sectionId}
          onChange={(e) => {
            setSectionId(e.target.value);
            if (e.target.value) setDivisionId("");
          }}
          className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">— none —</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={divisionId}
          onChange={(e) => {
            setDivisionId(e.target.value);
            if (e.target.value) setSectionId("");
          }}
          className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">— none —</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">—</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSave({ name, sectionId: sectionId || null, divisionId: divisionId || null })}
            disabled={isSaving}
            title="Save"
            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={13} />
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            title="Cancel"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const { userProfile } = useUser();
  const [templates, setTemplates] = useState([]);
  const [sections, setSections] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // Delete state
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Replace file state
  const [replacingTemplate, setReplacingTemplate] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Downloading
  const [downloadingId, setDownloadingId] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tmpl, secs, divs] = await Promise.all([
        fetchAllTemplates(),
        fetchAllSections(),
        fetchAllDivisions(),
      ]);
      setTemplates(tmpl);
      setSections(secs);
      setDivisions(divs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.file_name.toLowerCase().includes(search.toLowerCase()) ||
    t.section?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.division?.name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSaveEdit(templateId, fields) {
    setSavingId(templateId);
    try {
      const updated = await updateTemplate(templateId, fields);
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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <LayoutTemplate size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Templates</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage and assign Excel templates to sections and divisions
            </p>
          </div>
        </div>
      </div>

      {/* ── Layout: Upload card (left) + Table (right) on large screens ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Upload card */}
        <div className="lg:sticky lg:top-6">
          <UploadCard
            sections={sections}
            divisions={divisions}
            userId={userProfile?.id}
            onUploaded={() => {
              loadData();
              showToast("Template uploaded successfully!");
            }}
          />
        </div>

        {/* Templates table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <p className="text-[0.9rem] font-bold text-slate-800">All Templates</p>
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
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 w-48"
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

          {/* Table */}
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
              <p className="text-sm font-medium text-slate-400">
                {search ? "No templates match your search." : "No templates yet. Upload one to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Name</th>
                    <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">File</th>
                    <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Section</th>
                    <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Division</th>
                    <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Uploaded</th>
                    <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) =>
                    editingId === t.id ? (
                      <EditableRow
                        key={t.id}
                        template={t}
                        sections={sections}
                        divisions={divisions}
                        isSaving={savingId === t.id}
                        onSave={(fields) => handleSaveEdit(t.id, fields)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                              <FileSpreadsheet size={15} className="text-emerald-600" />
                            </div>
                            <span className="text-sm font-semibold text-slate-800">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{t.file_name}</td>
                        <td className="px-4 py-3">
                          {t.section?.name ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                              <FolderOpen size={10} /> {t.section.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {t.division?.name ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-100">
                              <Building2 size={10} /> {t.division.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{formatDate(t.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDownload(t)}
                              disabled={downloadingId === t.id}
                              title="Download"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-40"
                            >
                              <Download size={13} />
                            </button>
                            <button
                              onClick={() => setEditingId(t.id)}
                              title="Edit"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setReplacingTemplate(t)}
                              title="Replace file"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            >
                              <RefreshCw size={13} />
                            </button>
                            <button
                              onClick={() => setDeletingTemplate(t)}
                              title="Delete"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
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
