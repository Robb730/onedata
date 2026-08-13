// eslint-disable-next-line no-unused-vars
import {
  X,
  FileText,
  Calendar,
  FolderOpen,
  Loader,
  Sparkles,
  FolderPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Link2,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  FileJson,
  FileSpreadsheet,
  FileArchive,
  FileType,
  File,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useRef, Fragment } from "react";
import { getUploadableSchoolYears } from "../../utils/schoolYearsApi";
import { supabase } from "../../lib/supabaseClient";

function buildCodedFilename(originalName, code, year) {
  return `${code.toUpperCase()}-${year}-${originalName}`;
}

const getFileIconAndColor = (filename) => {
  if (!filename) return { icon: File, color: "text-slate-500", bg: "bg-slate-100" };
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "webp":
      return { icon: ImageIcon, color: "text-blue-500", bg: "bg-blue-50" };
    case "mp4":
    case "mov":
    case "avi":
    case "webm":
      return { icon: Video, color: "text-violet-500", bg: "bg-violet-50" };
    case "mp3":
    case "wav":
    case "ogg":
      return { icon: Music, color: "text-rose-500", bg: "bg-rose-50" };
    case "pdf":
      return { icon: FileText, color: "text-red-500", bg: "bg-red-50" };
    case "doc":
    case "docx":
      return { icon: FileType, color: "text-blue-600", bg: "bg-blue-50" };
    case "xls":
    case "xlsx":
    case "csv":
      return { icon: FileSpreadsheet, color: "text-emerald-500", bg: "bg-emerald-50" };
    case "json":
    case "txt":
    case "md":
      return { icon: FileJson, color: "text-amber-500", bg: "bg-amber-50" };
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return { icon: FileArchive, color: "text-amber-600", bg: "bg-amber-50" };
    default:
      return { icon: File, color: "text-slate-500", bg: "bg-slate-100" };
  }
};

const STEP_LABELS = {
  details: "File Details",
  category: "Category",
  request: "Link Request",
};

const UPLOAD_OPTIONS = [
  { value: "general", label: "General (Store file only)" },
  { value: "enrollment", label: "Enrollment Data (Parse & Store Data)" },
  { value: "classrooms", label: "Classrooms Inventory (Parse & Store Data)" },
  { value: "seats", label: "Seats Inventory (Parse & Store Data)" },
  { value: "teachers_inventory", label: "Teachers Inventory (Parse & Store Data)" },
  { value: "textbook_inventory", label: "Textbooks Inventory (Parse & Store Data)" },
  { value: "cespes", label: "CESPES (Parse & Store Data)" },
  { value: "performance_indicators", label: "Performance Indicators (Parse & Store Data)" },
  { value: "aip_school", label: "Approved School AIP 2026 (Store file for Dashboard)" },
  { value: "aip_sdo", label: "Approved SDO AIP 2026 (Store file for Dashboard)" },
  { value: "qbedp", label: "QBEDP (Store file for Dashboard)" },
  { value: "accomplishment_report", label: "Accomplishment Report (Store file for Dashboard)" },
];

const fieldClass =
  "w-full pl-9 pr-3 py-2.5 min-h-[44px] border border-slate-200 rounded-xl text-sm bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors";
const labelClass = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5";
const primaryBtnClass =
  "flex-1 flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
const secondaryBtnClass =
  "flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-semibold transition-colors";

export default function FileUploadModal({
  isOpen,
  onClose,
  selectedFolder,
  fileName: initialFileName,
  initialFile,
  onUpload,
  subfolders = [],
  pendingRequests = [],
  isRequestFulfillment = false,
  sectionId = null,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [fileName, setFileName] = useState(initialFileName);
  const [schoolYears, setSchoolYears] = useState([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [yearsLoading, setYearsLoading] = useState(true);
  const [yearsError, setYearsError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedSubfolder, setSelectedSubfolder] = useState(null);
  const [linkedRequestId, setLinkedRequestId] = useState(null);
  const [uploadType, setUploadType] = useState("general");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [parseTypeWarning, setParseTypeWarning] = useState(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef(null);
  const [isUploadTypeOpen, setIsUploadTypeOpen] = useState(false);
  const uploadTypeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setIsYearOpen(false);
      }
      if (uploadTypeRef.current && !uploadTypeRef.current.contains(e.target)) {
        setIsUploadTypeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasSubfolders = subfolders.length > 0;
  const canLinkRequest = !isRequestFulfillment && pendingRequests.length > 0;

  const steps = ["details"];
  if (hasSubfolders) steps.push("category");
  if (canLinkRequest) steps.push("request");
  const isMultiStep = steps.length > 1;
  const isLastStep = stepIndex === steps.length - 1;
  const currentStep = steps[stepIndex];

  const activeCode = selectedSubfolder?.code ?? null;
  const codedName =
    activeCode && fileName ? buildCodedFilename(fileName, activeCode, schoolYear) : null;
  const linkedRequest = pendingRequests.find((r) => r.id === linkedRequestId) ?? null;

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStepIndex(0);
    const initFiles = initialFile
      ? Array.isArray(initialFile)
        ? initialFile
        : [initialFile]
      : [];
    setSelectedFiles(initFiles);
    setFileName(initFiles.length > 1 ? "Multiple files selected" : initialFileName);
    setSelectedSubfolder(null);
    setLinkedRequestId(null);
    setUploadType("general");
    setIsYearOpen(false);
    setIsUploadTypeOpen(false);
    setDuplicateWarning(null);

    let cancelled = false;
    setYearsLoading(true);
    setYearsError(null);

    getUploadableSchoolYears()
      .then((years) => {
        if (cancelled) return;
        setSchoolYears(years);
        const active = years.find((y) => y.tag === "Active");
        setSchoolYear(active?.label ?? years[0]?.label ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load school years:", err);
        setYearsError(err.message);
        setSchoolYears([]);
        setSchoolYear("");
      })
      .finally(() => {
        if (!cancelled) setYearsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, initialFileName]);

  useEffect(() => {
    let interval;
    if (isUploading) {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 95 ? prev : prev + Math.random() * 5 + 2));
      }, 600);
    } else {
      setUploadProgress(100);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      if (filesArray.length === 1) {
        setFileName(filesArray[0].name);
      } else {
        setFileName(`${filesArray.length} files selected`);
      }
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 0) {
        setFileName("");
      } else if (updated.length === 1) {
        setFileName(updated[0].name);
      } else {
        setFileName(`${updated.length} files selected`);
      }
      return updated;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const executeUpload = async (modifiedName = null, modifiedFiles = null, replaceFileIds = null) => {
    setIsUploading(true);
    const finalName = modifiedName || (codedName ?? fileName);
    const filesToUpload = modifiedFiles || selectedFiles;
    
    try {
      await onUpload(finalName, schoolYear, uploadType, filesToUpload, linkedRequestId, replaceFileIds);
    } finally {
      setIsUploading(false);
      setStepIndex(0);
      setFileName("");
      setSelectedFiles([]);
      setSelectedSubfolder(null);
      setLinkedRequestId(null);
      setUploadType("general");
      setDuplicateWarning(null);
      setParseTypeWarning(null);
    }
  };

  const submitUpload = async () => {
    setIsCheckingDuplicates(true);
    try {
      const finalName = codedName ?? fileName;
      
      if (uploadType === "general") {
        // Auto-rename General files
        const { data: existingFiles } = await supabase
          .from("files")
          .select("file_name")
          .eq("data_category", "general")
          .eq("school_year", schoolYear)
          .eq("section_id", sectionId || null);

        const existingNames = new Set(existingFiles?.map((f) => f.file_name) || []);
        const getUniqueName = (name) => {
          if (!existingNames.has(name)) return name;
          const match = name.match(/^(.*?)(\.[^.]+)?$/);
          const base = match[1];
          const ext = match[2] || "";
          let counter = 1;
          while (existingNames.has(`${base} (${counter})${ext}`)) {
            counter++;
          }
          return `${base} (${counter})${ext}`;
        };

        let modifiedSelectedFiles = selectedFiles.map((f) => {
          const newName = getUniqueName(f.name);
          if (newName !== f.name) {
            existingNames.add(newName);
            return new File([f], newName, { type: f.type });
          }
          return f;
        });

        const modifiedFileName = modifiedSelectedFiles.length === 1
          ? modifiedSelectedFiles[0].name
          : `${modifiedSelectedFiles.length} files selected`;

        setIsCheckingDuplicates(false);
        await executeUpload(modifiedFileName, modifiedSelectedFiles);
        return;
      } else {
        // Parse Type - Check if data already exists
        const { data: existingDataFiles, error } = await supabase
          .from("files")
          .select("id, file_name, school_year")
          .eq("data_category", uploadType)
          .eq("school_year", schoolYear);

        if (!error && existingDataFiles && existingDataFiles.length > 0) {
          setParseTypeWarning({
            existingFiles: existingDataFiles,
          });
          setIsCheckingDuplicates(false);
          return; // Pause for user confirmation
        }
      }
    } catch (err) {
      console.error("Failed checking for duplicate/existing files:", err);
    }
    setIsCheckingDuplicates(false);
    await executeUpload();
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !schoolYear) return;
    if (selectedFiles.length === 1 && !fileName) return;
    if (isMultiStep) goNext();
    else await submitUpload();
  };

  const canSubmitDetails =
    selectedFiles.length > 0 &&
    !!schoolYear &&
    !yearsLoading &&
    !yearsError &&
    (selectedFiles.length > 1 || !!fileName);

  const renderSelectedFiles = () => {
    if (selectedFiles.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} selected
          </p>
          {uploadType !== "general" && selectedFiles.length > 1 && (
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-semibold border border-amber-100">
              Only first file parsed
            </span>
          )}
        </div>
        {selectedFiles.map((file, idx) => {
          const { icon: FileIcon, color, bg } = getFileIconAndColor(file.name);
          return (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color}`}
              >
                <FileIcon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                  {file.name.split(".").pop().toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(idx)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                aria-label={`Remove ${file.name}`}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMobileFooter = ({ onPrimary, primaryLabel, primaryDisabled, showBack }) => (
    <div className="lg:hidden shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 px-4 sm:px-5 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] border-t border-slate-100 bg-white">
      {showBack ? (
        <button type="button" onClick={goBack} className={`${secondaryBtnClass} sm:flex-none`}>
          <ArrowLeft size={15} /> Back
        </button>
      ) : (
        <button type="button" onClick={onClose} className={`${secondaryBtnClass} sm:flex-1`}>
          Cancel
        </button>
      )}
      <button
        type={onPrimary ? "button" : "submit"}
        onClick={onPrimary}
        disabled={primaryDisabled || isCheckingDuplicates}
        className={primaryBtnClass}
      >
        {isCheckingDuplicates ? <Loader className="animate-spin" size={15} /> : primaryLabel}
      </button>
    </div>
  );

  const renderDesktopActions = ({ onPrimary, primaryLabel, primaryDisabled, showBack, submitType = "button" }) => (
    <div className="hidden lg:flex items-center gap-3 px-6 pb-5 pt-2">
      {showBack ? (
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      )}
      <button
        type={submitType}
        onClick={onPrimary}
        disabled={primaryDisabled || isCheckingDuplicates}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCheckingDuplicates ? <Loader className="animate-spin" size={15} /> : primaryLabel}
      </button>
    </div>
  );

  const renderPreviewPane = () => (
    <div className="hidden lg:flex lg:w-1/2 bg-slate-50 p-6 flex-col overflow-y-auto max-h-[75vh]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">File Preview</h3>
        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={handleClearAllFiles}
            className="text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {selectedFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center select-none py-10 border-2 border-dashed border-slate-200 rounded-xl">
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4">
            <FileText size={22} className="text-slate-300" />
          </div>
          <h4 className="text-sm font-semibold text-slate-600">No files selected</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
            Choose one or more files to see their details here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-slate-800 text-white text-[10px] font-bold">
                {selectedFiles.length}
              </span>
              {selectedFiles.length === 1 ? "File" : "Files"} Staged
            </span>
            {uploadType !== "general" && selectedFiles.length > 1 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold">
                Only first file parsed
              </span>
            )}
          </div>
          {selectedFiles.map((file, idx) => {
            const { icon: FileIcon, color, bg } = getFileIconAndColor(file.name);
            return (
              <div
                key={`${file.name}-${idx}`}
                className="group relative flex flex-col p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color}`}>
                    <FileIcon size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <p className="text-sm font-semibold text-slate-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span className="inline-flex items-center text-xs font-medium text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold">
                        {file.name.split(".").pop().toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-0 lg:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full lg:max-w-5xl lg:mx-4 max-h-[90dvh] lg:max-h-[90vh] flex flex-col overflow-hidden rounded-t-2xl lg:rounded-2xl border border-slate-200 border-b-0 lg:border-b bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] lg:shadow-2xl ring-0 lg:ring-1 lg:ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="lg:hidden flex justify-center pt-2.5 pb-0 shrink-0">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        {/* Mobile header */}
        <div className="lg:hidden flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shrink-0">
              <Upload size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[0.95rem] sm:text-base font-bold text-slate-800 leading-tight">
                Upload File
              </h2>
              <div className="mt-1 flex items-center gap-1.5 min-w-0">
                <FolderOpen size={12} className="text-slate-400 shrink-0" />
                <p className="text-[0.72rem] text-slate-400 font-medium truncate">
                  {selectedFolder || "No section selected"}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mobile step indicator */}
        {isMultiStep && !isUploading && (
          <div className="lg:hidden px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <Fragment key={s}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                        i < stepIndex
                          ? "bg-teal-500 text-white"
                          : i === stepIndex
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {i < stepIndex ? <CheckCircle size={11} /> : i + 1}
                    </div>
                    <span
                      className={`text-[11px] font-semibold truncate ${
                        i === stepIndex
                          ? "text-slate-800"
                          : i < stepIndex
                            ? "text-teal-600"
                            : "text-slate-400"
                      }`}
                    >
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-px bg-slate-200 min-w-[12px]" />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Desktop header */}
        <div className="hidden lg:flex items-start justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Upload File</h2>
            {isMultiStep ? (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {steps.map((s, i) => (
                  <Fragment key={s}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border transition-all ${
                          i < stepIndex
                            ? "bg-teal-500 text-white border-teal-500"
                            : i === stepIndex
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-200 text-slate-400 border-slate-200"
                        }`}
                      >
                        {i < stepIndex ? <CheckCircle size={12} /> : i + 1}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          i === stepIndex
                            ? "text-blue-600"
                            : i < stepIndex
                              ? "text-teal-500"
                              : "text-slate-400"
                        }`}
                      >
                        {STEP_LABELS[s]}
                      </span>
                    </div>
                    {i < steps.length - 1 && <div className="w-5 h-px bg-slate-300" />}
                  </Fragment>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Add a file to{" "}
                <span className="font-medium text-slate-500">{selectedFolder}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 -mr-1.5 -mt-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {parseTypeWarning ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 min-h-[300px]">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
              <FileSpreadsheet className="text-blue-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Existing Data Found</h3>
            <p className="text-sm text-slate-500 text-center mb-6 max-w-sm">
              Data already exists for this parse type. Would you like to replace the existing file?
            </p>
            <div className="flex gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={() => setParseTypeWarning(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const replaceFileIds = parseTypeWarning.existingFiles.map(f => f.id);
                  setParseTypeWarning(null);
                  executeUpload(null, null, replaceFileIds);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Replace
              </button>
            </div>
          </div>
        ) : duplicateWarning ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 min-h-[400px]">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100">
              <AlertTriangle className="text-amber-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Files Already Uploaded</h3>
            <p className="text-sm text-slate-500 text-center mb-6 max-w-sm">
              The following files have already been uploaded previously.
            </p>
            <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto mb-6 p-1">
              {duplicateWarning.map((dup, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{dup.file_name}</p>
                    <p className="text-[11px] text-slate-400">
                      Uploaded in: <span className="font-medium text-slate-600">{dup.sections?.name || "General"}</span> 
                      {dup.data_category !== "general" ? ` (${dup.data_category})` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarning(null);
                  executeUpload();
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors shadow-sm"
              >
                Upload Anyway
              </button>
            </div>
          </div>
        ) : isUploading ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-14 h-14 border-[3px] border-slate-100 rounded-full" />
              <div className="w-14 h-14 border-[3px] border-blue-600 rounded-full animate-spin absolute border-t-transparent" />
            </div>
            <h3 className="text-slate-900 font-bold mb-1">Uploading</h3>
            <p className="text-sm text-slate-500 mb-5 truncate max-w-full px-4 text-center">
              {fileName}
            </p>
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-2">
              {Math.round(uploadProgress)}%
            </p>
            {linkedRequest && (
              <p className="text-[11px] text-teal-600 font-medium mt-4 flex items-center gap-1.5 text-center">
                <Link2 size={12} /> Completing &ldquo;{linkedRequest.fileName}&rdquo;
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-5 text-center leading-relaxed">
              Large files may take a few minutes.
              <br />
              Please keep this window open.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden lg:min-h-[500px] lg:divide-x divide-slate-200">
            <div className="flex flex-col flex-1 lg:w-1/2 min-h-0 overflow-hidden">
          <>
            {/* ── STEP: Details ── */}
            {currentStep === "details" && (
              <form
                onSubmit={handleStep1Submit}
                className="flex flex-col min-h-0 flex-1 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 lg:px-6 py-4 lg:py-5 space-y-4 lg:space-y-5 lg:max-h-[75vh]">
                  <div className="hidden lg:block">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Upload to Folder
                    </label>
                    <div className="relative">
                      <FolderOpen
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                        size={16}
                      />
                      <input
                        type="text"
                        value={selectedFolder}
                        readOnly
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-medium text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`${labelClass} lg:normal-case lg:tracking-normal lg:text-xs lg:font-semibold lg:text-slate-700`}>
                      Upload Type
                    </label>
                    <div ref={uploadTypeRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsUploadTypeOpen((v) => !v)}
                        className={`${fieldClass} flex items-center gap-2 text-left`}
                      >
                        <FileText
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <span className="font-medium text-slate-800 truncate">
                          {UPLOAD_OPTIONS.find((opt) => opt.value === uploadType)?.label ??
                            "Select type"}
                        </span>
                        <svg
                          className={`h-3.5 w-3.5 text-slate-400 ml-auto shrink-0 transition-transform ${isUploadTypeOpen ? "rotate-180" : ""}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {isUploadTypeOpen && (
                        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-[0_8px_30px_rgba(15,23,42,0.12)] py-1.5 z-50 max-h-48 overflow-y-auto">
                          {UPLOAD_OPTIONS.map(({ value, label }) => {
                            const isSelected = uploadType === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  setUploadType(value);
                                  setIsUploadTypeOpen(false);
                                  if (value !== "general" && selectedFiles.length > 1) {
                                    setSelectedFiles([selectedFiles[0]]);
                                    setFileName(selectedFiles[0].name);
                                  }
                                }}
                                className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                              >
                                <span
                                  className={`truncate ${isSelected ? "text-blue-700 font-semibold" : "text-slate-700"}`}
                                >
                                  {label}
                                </span>
                                {isSelected && (
                                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`${labelClass} lg:normal-case lg:tracking-normal lg:text-xs lg:font-semibold lg:text-slate-700`}>
                      <span className="lg:hidden">Files </span>
                      <span className="hidden lg:inline">Choose File </span>
                      <span className="text-red-500 normal-case tracking-normal">*</span>
                    </label>

                    {/* Mobile file picker */}
                    <label
                      htmlFor="file-upload-input"
                      className={`lg:hidden flex flex-col items-center justify-center gap-2 w-full py-6 px-4 text-sm border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        selectedFiles.length > 0
                          ? "border-blue-200 bg-blue-50/40"
                          : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedFiles.length > 0
                            ? "bg-blue-100 text-blue-600"
                            : "bg-white border border-slate-200 text-slate-400"
                        }`}
                      >
                        <Upload size={18} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedFiles.length > 0 ? "Change files" : "Tap to browse files"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          PDF, DOCX, XLSX, images · Max 1GB
                        </p>
                      </div>
                    </label>

                    {/* Desktop file picker */}
                    <label
                      htmlFor="file-upload-input"
                      className={`hidden lg:flex items-center gap-2.5 w-full py-2.5 px-3 text-sm border rounded-lg cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${
                        selectedFiles.length > 0
                          ? "border-blue-200 bg-blue-50/60 hover:bg-blue-50"
                          : "border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
                      }`}
                    >
                      <FileText
                        size={16}
                        className={`flex-shrink-0 ${selectedFiles.length > 0 ? "text-blue-500" : "text-slate-400"}`}
                      />
                      <span
                        className={`truncate ${selectedFiles.length > 0 ? "text-slate-800 font-medium" : "text-slate-400"}`}
                      >
                        {selectedFiles.length === 0
                          ? "Click to browse or drop a file"
                          : selectedFiles.length === 1
                            ? selectedFiles[0].name
                            : `${selectedFiles.length} files selected`}
                      </span>
                      {selectedFiles.length > 0 && (
                        <span className="ml-auto text-[11px] font-semibold text-blue-600 shrink-0">
                          Change
                        </span>
                      )}
                    </label>

                    <input
                      id="file-upload-input"
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      multiple={uploadType === "general"}
                      required={selectedFiles.length === 0}
                    />
                  </div>

                  <div className="lg:hidden">{renderSelectedFiles()}</div>

                  {selectedFiles.length === 1 && (
                    <div>
                      <label className={labelClass}>
                        File Name{" "}
                        <span className="text-red-500 normal-case tracking-normal">*</span>
                      </label>
                      <div className="relative">
                        <FileText
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="Enter file name"
                          className={fieldClass}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>
                      School Year{" "}
                      <span className="text-red-500 normal-case tracking-normal">*</span>
                    </label>
                    <div ref={yearRef} className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          !yearsLoading &&
                          !yearsError &&
                          schoolYears.length > 0 &&
                          setIsYearOpen((v) => !v)
                        }
                        disabled={yearsLoading || !!yearsError || schoolYears.length === 0}
                        className={`${fieldClass} flex items-center gap-2 text-left disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
                      >
                        <Calendar
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        {yearsLoading ? (
                          <span className="flex items-center gap-2 text-slate-400">
                            <Loader size={13} className="animate-spin" />
                            Loading…
                          </span>
                        ) : yearsError ? (
                          <span className="text-red-400">Failed to load</span>
                        ) : schoolYears.length === 0 ? (
                          <span className="text-slate-400">No school year available</span>
                        ) : (
                          <>
                            <span className="font-semibold text-slate-800">{schoolYear}</span>
                            {(() => {
                              const current = schoolYears.find((y) => y.label === schoolYear);
                              if (!current) return null;
                              const isActive = current.tag === "Active";
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isActive
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                      : "bg-amber-50 text-amber-600 border border-amber-200"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-amber-500"}`}
                                  />
                                  {current.tag}
                                </span>
                              );
                            })()}
                          </>
                        )}
                        <svg
                          className={`h-3.5 w-3.5 text-slate-400 ml-auto shrink-0 transition-transform ${isYearOpen ? "rotate-180" : ""}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {isYearOpen && !yearsLoading && !yearsError && schoolYears.length > 0 && (
                        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-[0_8px_30px_rgba(15,23,42,0.12)] py-1.5 z-50 max-h-48 overflow-y-auto">
                          {schoolYears.map(({ label, tag }) => {
                            const isSelected = schoolYear === label;
                            const isActive = tag === "Active";
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => {
                                  setSchoolYear(label);
                                  setIsYearOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                              >
                                <span
                                  className={`font-semibold ${isSelected ? "text-blue-700" : "text-slate-700"}`}
                                >
                                  {label}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isActive
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                      : "bg-amber-50 text-amber-600 border border-amber-200"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-amber-500"}`}
                                  />
                                  {tag}
                                </span>
                                {isSelected && (
                                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {!yearsLoading && yearsError && (
                      <p className="text-[11px] text-red-500 mt-1">{yearsError}</p>
                    )}
                  </div>
                </div>

                {renderMobileFooter({
                  primaryLabel: isMultiStep ? (
                    <>
                      Continue <ArrowRight size={15} />
                    </>
                  ) : (
                    "Upload File"
                  ),
                  primaryDisabled: !canSubmitDetails,
                })}
                {renderDesktopActions({
                  submitType: "submit",
                  primaryLabel: isMultiStep ? (
                    <>
                      Next: {STEP_LABELS[steps[1]]} <ArrowRight size={15} />
                    </>
                  ) : (
                    "Upload File"
                  ),
                  primaryDisabled: !canSubmitDetails,
                })}
              </form>
            )}

            {/* ── STEP: Category ── */}
            {currentStep === "category" && (
              <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                    <p className="text-[11px] text-slate-400 font-medium">Uploading</p>
                    <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                      {selectedFiles.length > 1
                        ? `${selectedFiles.length} files`
                        : fileName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">SY {schoolYear}</p>
                  </div>

                  <div>
                    <label className={labelClass}>Category</label>
                    <p className="text-[11px] text-slate-400 mb-3 -mt-1">
                      Optional prefix for the filename, or None for the section folder.
                    </p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubfolder(null)}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                          selectedSubfolder === null
                            ? "border-slate-800 bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedSubfolder === null ? "border-slate-800" : "border-slate-300"
                          }`}
                        >
                          {selectedSubfolder === null && (
                            <div className="w-2 h-2 rounded-full bg-slate-800" />
                          )}
                        </div>
                        <FolderOpen size={16} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">None</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            Directly into {selectedFolder}
                          </p>
                        </div>
                      </button>

                      {subfolders.map((sf) => {
                        const isSelected = selectedSubfolder?.name === sf.name;
                        const preview = buildCodedFilename(fileName, sf.code, schoolYear);
                        return (
                          <button
                            key={sf.name}
                            type="button"
                            onClick={() => setSelectedSubfolder(isSelected ? null : sf)}
                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? "border-blue-600" : "border-slate-300"
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                            </div>
                            <FolderPlus
                              size={16}
                              className={`shrink-0 ${isSelected ? "text-blue-500" : "text-slate-400"}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-sm font-semibold ${isSelected ? "text-blue-900" : "text-slate-800"}`}
                                >
                                  {sf.name}
                                </p>
                                <span
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                    isSelected
                                      ? "bg-blue-100 text-blue-800 border-blue-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {sf.code}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                → {preview}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {codedName && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-slate-200">
                        <Sparkles size={13} className="text-blue-500" />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                          Filename preview
                        </span>
                      </div>
                      <p className="px-3.5 py-3 text-sm font-mono text-slate-800 break-all">
                        {codedName}
                      </p>
                    </div>
                  )}
                </div>

                {renderMobileFooter({
                  showBack: true,
                  onPrimary: isLastStep ? submitUpload : goNext,
                  primaryLabel: isLastStep ? (
                    activeCode ? (
                      "Upload & Apply Code"
                    ) : (
                      "Upload File"
                    )
                  ) : (
                    <>
                      Continue <ArrowRight size={15} />
                    </>
                  ),
                  primaryDisabled: !schoolYear,
                })}
                {renderDesktopActions({
                  showBack: true,
                  onPrimary: isLastStep ? submitUpload : goNext,
                  primaryLabel: isLastStep ? (
                    activeCode ? (
                      "Upload & Apply Code"
                    ) : (
                      "Upload to Section Folder"
                    )
                  ) : (
                    <>
                      Next: {STEP_LABELS[steps[stepIndex + 1]]} <ArrowRight size={15} />
                    </>
                  ),
                  primaryDisabled: !schoolYear,
                })}
              </div>
            )}

            {/* ── STEP: Link Request ── */}
            {currentStep === "request" && (
              <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                      <Link2 size={12} className="text-blue-500" /> Link to request
                    </label>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Completing a request marks it done after upload. Choose None if unrelated.
                    </p>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setLinkedRequestId(null)}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                          linkedRequestId === null
                            ? "border-slate-800 bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            linkedRequestId === null ? "border-slate-800" : "border-slate-300"
                          }`}
                        >
                          {linkedRequestId === null && (
                            <div className="w-2 h-2 rounded-full bg-slate-800" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">None</p>
                          <p className="text-[11px] text-slate-400">Not linked to a request</p>
                        </div>
                      </button>

                      {pendingRequests.map((req) => {
                        const isSelected = linkedRequestId === req.id;
                        const isOverdue = req.status === "Overdue";
                        return (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => setLinkedRequestId(isSelected ? null : req.id)}
                            className={`w-full flex items-start gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? "border-blue-600" : "border-slate-300"
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className={`text-sm font-semibold truncate ${isSelected ? "text-blue-900" : "text-slate-800"}`}
                                >
                                  {req.fileName}
                                </p>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                    isOverdue
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {req.requestedBy} · Due {req.dueDate}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {linkedRequest && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-3 flex items-start gap-2">
                      <CheckCircle size={14} className="text-teal-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-teal-700 leading-relaxed">
                        &ldquo;{linkedRequest.fileName}&rdquo; will be marked completed after
                        upload.
                      </p>
                    </div>
                  )}
                </div>

                {renderMobileFooter({
                  showBack: true,
                  onPrimary: submitUpload,
                  primaryLabel: linkedRequestId
                    ? "Upload & Complete Request"
                    : "Upload File",
                  primaryDisabled: !schoolYear,
                })}
                {renderDesktopActions({
                  showBack: true,
                  onPrimary: submitUpload,
                  primaryLabel: linkedRequestId
                    ? "Upload & Complete Request"
                    : "Upload File",
                  primaryDisabled: !schoolYear,
                })}
              </div>
            )}
          </>
            </div>
            {renderPreviewPane()}
          </div>
        )}
      </div>
    </div>
  );
}
