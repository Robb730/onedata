// eslint-disable-next-line no-unused-vars
import { X, FileText, Calendar, FolderOpen, Loader, Tag, Sparkles, FolderPlus, ArrowRight, ArrowLeft, CheckCircle, Link2, Image as ImageIcon, Video, Music, FileJson, FileSpreadsheet, FileArchive, FileType, File } from "lucide-react";
import { useState, useEffect, useRef, Fragment } from "react";
import { getUploadableSchoolYears } from "../../utils/schoolYearsApi";

function buildCodedFilename(originalName, code, year) {
  return `${code.toUpperCase()}-${year}-${originalName}`;
}

const getFileIconAndColor = (filename) => {
  if (!filename) return { icon: File, color: "text-gray-500", bg: "bg-gray-100" };
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "jpg": case "jpeg": case "png": case "gif": case "svg": case "webp":
      return { icon: ImageIcon, color: "text-blue-500", bg: "bg-blue-50" };
    case "mp4": case "mov": case "avi": case "webm":
      return { icon: Video, color: "text-purple-500", bg: "bg-purple-50" };
    case "mp3": case "wav": case "ogg":
      return { icon: Music, color: "text-pink-500", bg: "bg-pink-50" };
    case "pdf":
      return { icon: FileText, color: "text-red-500", bg: "bg-red-50" };
    case "doc": case "docx":
      return { icon: FileType, color: "text-blue-600", bg: "bg-blue-50" };
    case "xls": case "xlsx": case "csv":
      return { icon: FileSpreadsheet, color: "text-emerald-500", bg: "bg-emerald-50" };
    case "json": case "txt": case "md":
      return { icon: FileJson, color: "text-amber-500", bg: "bg-amber-50" };
    case "zip": case "rar": case "7z": case "tar": case "gz":
      return { icon: FileArchive, color: "text-amber-600", bg: "bg-amber-50" };
    default:
      return { icon: File, color: "text-gray-500", bg: "bg-gray-100" };
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

export default function FileUploadModal({
  isOpen,
  onClose,
  selectedFolder,
  fileName: initialFileName,
  initialFile,
  onUpload,
  subfolders = [],
  pendingRequests = [],          // open (Pending/Overdue) requests for this section
  isRequestFulfillment = false,  // true when opened via a request card's "Upload File"
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

  // ── Dynamic step sequence ──────────────────────────────────────
  const steps = ["details"];
  if (hasSubfolders) steps.push("category");
  if (canLinkRequest) steps.push("request");
  const isMultiStep = steps.length > 1;
  const isLastStep = stepIndex === steps.length - 1;
  const currentStep = steps[stepIndex];

  const activeCode = selectedSubfolder?.code ?? null;
  const codedName = activeCode && fileName ? buildCodedFilename(fileName, activeCode, schoolYear) : null;
  const linkedRequest = pendingRequests.find((r) => r.id === linkedRequestId) ?? null;

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStepIndex(0);
    const initFiles = initialFile ? (Array.isArray(initialFile) ? initialFile : [initialFile]) : [];
    setSelectedFiles(initFiles);
    setFileName(initFiles.length > 1 ? "Multiple files selected" : initialFileName);
    setSelectedSubfolder(null);
    setLinkedRequestId(null);
    setUploadType("general");
    setIsYearOpen(false);
    setIsUploadTypeOpen(false);

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

    return () => { cancelled = true; };
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

  const submitUpload = async () => {
    setIsUploading(true);
    const finalName = codedName ?? fileName;
    try {
      await onUpload(finalName, schoolYear, uploadType, selectedFiles, linkedRequestId);
    } finally {
      setIsUploading(false);
      setStepIndex(0);
      setFileName("");
      setSelectedFiles([]);
      setSelectedSubfolder(null);
      setLinkedRequestId(null);
      setUploadType("general");
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !schoolYear) return;
    if (selectedFiles.length === 1 && !fileName) return;
    if (isMultiStep) goNext();
    else await submitUpload();
  };

  const accentStyle = activeCode
    ? "linear-gradient(90deg, #6366f1, #3b82f6)"
    : linkedRequestId
    ? "linear-gradient(90deg, #0ea5e9, #06b6d4)"
    : "linear-gradient(90deg, #3b82f6, #06b6d4)";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-5xl mx-4 overflow-hidden">

        <div className="h-1.5 w-full" style={{ background: accentStyle }} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Upload File</h2>
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
                            : "bg-gray-200 text-gray-400 border-gray-200"
                        }`}
                      >
                        {i < stepIndex ? <CheckCircle size={12} /> : i + 1}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          i === stepIndex ? "text-blue-600" : i < stepIndex ? "text-teal-500" : "text-gray-400"
                        }`}
                      >
                        {STEP_LABELS[s]}
                      </span>
                    </div>
                    {i < steps.length - 1 && <div className="w-5 h-px bg-gray-300" />}
                  </Fragment>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                Add a file to <span className="font-medium text-gray-500">{selectedFolder}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 -mr-1.5 -mt-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {isUploading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin absolute border-t-transparent"></div>
              <FileText size={20} className="text-blue-600 absolute animate-pulse" />
            </div>
            <div className="w-full max-w-xs text-center">
              <h3 className="text-gray-900 font-bold mb-1">Uploading File</h3>
              <p className="text-sm text-gray-500 mb-4 truncate">{fileName}</p>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-600 font-medium mt-2">{Math.round(uploadProgress)}%</p>
              {linkedRequest && (
                <p className="text-[11px] text-teal-600 font-medium mt-3 flex items-center justify-center gap-1.5">
                  <Link2 size={12} /> Will complete "{linkedRequest.fileName}" request
                </p>
              )}
              <p className="text-[0.65rem] text-gray-400 mt-4 leading-relaxed">
                Large files may take several minutes. <br /> Please do not close this window.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 min-h-[500px]">
            <div className="w-full md:w-[50%] flex flex-col bg-white overflow-y-auto max-h-[75vh]">
            {/* ── STEP: File Details ── */}
            {currentStep === "details" && (
              <form onSubmit={handleStep1Submit} className="px-6 py-5 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Upload to Folder</label>
                  <div className="relative">
                    <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                    <input
                      type="text"
                      value={selectedFolder}
                      readOnly
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-medium text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Upload Type</label>
                  <div ref={uploadTypeRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsUploadTypeOpen((v) => !v)}
                      className="w-full flex items-center gap-2 pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left"
                    >
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <span className="font-medium text-gray-800 truncate">
                        {UPLOAD_OPTIONS.find((opt) => opt.value === uploadType)?.label ?? "Select type"}
                      </span>
                      <svg
                        className={`h-3.5 w-3.5 text-gray-400 ml-auto shrink-0 transition-transform duration-200 ${isUploadTypeOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {isUploadTypeOpen && (
                      <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-[0_8px_30px_rgba(15,23,42,0.12)] py-1.5 z-50 max-h-56 overflow-y-auto">
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
                              className={`w-full flex items-center gap-2 px-3.5 py-2 text-sm transition-colors text-left ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                            >
                              <span className={`truncate ${isSelected ? "text-blue-700 font-semibold" : "text-gray-700"}`}>{label}</span>
                              {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Choose File <span className="text-red-500">*</span>
                  </label>
                  <label
                    htmlFor="file-upload-input"
                    className={`flex items-center gap-2.5 w-full py-2.5 px-3 text-sm border rounded-lg cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${
                      selectedFiles.length > 0
                        ? "border-blue-200 bg-blue-50/60 hover:bg-blue-50"
                        : "border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                    }`}
                  >
                    <FileText size={16} className={`flex-shrink-0 ${selectedFiles.length > 0 ? "text-blue-500" : "text-gray-400"}`} />
                    <span className={`truncate ${selectedFiles.length > 0 ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                      {selectedFiles.length === 0 ? "Click to browse or drop a file" : selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`}
                    </span>
                    {selectedFiles.length > 0 && (
                      <span className="ml-auto text-[11px] font-semibold text-blue-600 shrink-0">Change</span>
                    )}
                    <input
                      id="file-upload-input"
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      multiple={uploadType === "general"}
                      required={selectedFiles.length === 0}
                    />
                  </label>
                </div>

                {selectedFiles.length <= 1 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    File Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Enter file name"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    School Year <span className="text-red-500">*</span>
                  </label>
                  <div ref={yearRef} className="relative">
                    <button
                      type="button"
                      onClick={() => !yearsLoading && !yearsError && schoolYears.length > 0 && setIsYearOpen((v) => !v)}
                      disabled={yearsLoading || !!yearsError || schoolYears.length === 0}
                      className="w-full flex items-center gap-2 pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                    >
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      {yearsLoading ? (
                        <span className="flex items-center gap-2 text-gray-400">
                          <Loader size={13} className="animate-spin" />
                          Loading school years…
                        </span>
                      ) : yearsError ? (
                        <span className="text-red-400">Failed to load school years</span>
                      ) : schoolYears.length === 0 ? (
                        <span className="text-gray-400">No school year available</span>
                      ) : (
                        <>
                          <span className="font-semibold text-gray-800">{schoolYear}</span>
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
                                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                                {current.tag}
                              </span>
                            );
                          })()}
                        </>
                      )}
                      <svg
                        className={`h-3.5 w-3.5 text-gray-400 ml-auto shrink-0 transition-transform duration-200 ${isYearOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {isYearOpen && !yearsLoading && !yearsError && schoolYears.length > 0 && (
                      <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-[0_8px_30px_rgba(15,23,42,0.12)] py-1.5 z-50 max-h-56 overflow-y-auto">
                        {schoolYears.map(({ label, tag }) => {
                          const isSelected = schoolYear === label;
                          const isActive = tag === "Active";
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => { setSchoolYear(label); setIsYearOpen(false); }}
                              className={`w-full flex items-center gap-2 px-3.5 py-2 text-sm transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                            >
                              <span className={`font-semibold ${isSelected ? "text-blue-700" : "text-gray-700"}`}>{label}</span>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : "bg-amber-50 text-amber-600 border border-amber-200"
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                                {tag}
                              </span>
                              {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {!yearsLoading && yearsError && <p className="text-[11px] text-red-500 mt-1">{yearsError}</p>}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={yearsLoading || !!yearsError || !schoolYear}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    style={{ background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}
                  >
                    {isMultiStep ? (
                      <>Next: {STEP_LABELS[steps[1]]} <ArrowRight size={15} /></>
                    ) : (
                      "Upload File"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP: Category / Subfolder Selection ── */}
            {currentStep === "category" && (
              <div className="px-6 py-5 space-y-5">
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">File</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{selectedFiles.length > 1 ? `${selectedFiles.length} files selected` : fileName}</p>
                  </div>
                  <div className="ml-auto text-right flex-shrink-0">
                    <p className="text-xs text-gray-400 font-medium">School Year</p>
                    <p className="text-sm font-semibold text-gray-800">{schoolYear}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Which category does this file belong to?
                  </label>
                  <p className="text-[11px] text-gray-400 mb-3">
                    Select a category to auto-prefix the filename, or choose{" "}
                    <span className="font-semibold text-gray-600">None</span> to upload directly into the section folder.
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setSelectedSubfolder(null)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        selectedSubfolder === null ? "border-gray-800 bg-gray-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedSubfolder === null ? "border-gray-800" : "border-gray-300"}`}>
                        {selectedSubfolder === null && <div className="w-2 h-2 rounded-full bg-gray-800" />}
                      </div>
                      <FolderOpen size={16} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">None</p>
                        <p className="text-[11px] text-gray-400">
                          Upload directly into <span className="font-medium">{selectedFolder}</span>
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
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                            isSelected ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-indigo-600" : "border-gray-300"}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                          </div>
                          <FolderPlus size={16} className={`flex-shrink-0 ${isSelected ? "text-indigo-500" : "text-gray-400"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-semibold ${isSelected ? "text-indigo-900" : "text-gray-800"}`}>{sf.name}</p>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${isSelected ? "bg-indigo-200 text-indigo-800 border-indigo-300" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {sf.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">→ {preview}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {codedName && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3.5 py-2 border-b border-indigo-200 bg-indigo-100/60">
                      <Sparkles size={13} className="text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Auto-Generated Filename</span>
                    </div>
                    <div className="px-3.5 py-3">
                      <p className="text-sm font-mono text-indigo-900 break-all leading-relaxed">
                        <span className="bg-indigo-200 text-indigo-800 px-1 py-0.5 rounded font-bold">{activeCode}</span>
                        <span className="text-indigo-400 mx-0.5">-</span>
                        <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded">{schoolYear}</span>
                        <span className="text-indigo-400 mx-0.5">-</span>
                        <span className="text-gray-700">{fileName}</span>
                      </p>
                      <p className="text-[11px] text-indigo-500 mt-2">This is the exact filename that will be saved in the system.</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={isLastStep ? submitUpload : goNext}
                    disabled={!schoolYear}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: activeCode ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}
                  >
                    {isLastStep ? (
                      activeCode ? "Upload & Apply Code" : "Upload to Section Folder"
                    ) : (
                      <>Next: {STEP_LABELS[steps[stepIndex + 1]]} <ArrowRight size={15} /></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: Link Request ── */}
            {currentStep === "request" && (
              <div className="px-6 py-5 space-y-5">
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">File</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{selectedFiles.length > 1 ? `${selectedFiles.length} files selected` : (codedName ?? fileName)}</p>
                  </div>
                  <div className="ml-auto text-right flex-shrink-0">
                    <p className="text-xs text-gray-400 font-medium">School Year</p>
                    <p className="text-sm font-semibold text-gray-800">{schoolYear}</p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                    <Link2 size={13} className="text-blue-500" /> Does this file fulfill an open request?
                  </label>
                  <p className="text-[11px] text-gray-400 mb-3">
                    Linking a request marks it completed as soon as this upload finishes. Choose{" "}
                    <span className="font-semibold text-gray-600">None</span> if it isn't related to any request.
                  </p>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setLinkedRequestId(null)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        linkedRequestId === null ? "border-gray-800 bg-gray-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${linkedRequestId === null ? "border-gray-800" : "border-gray-300"}`}>
                        {linkedRequestId === null && <div className="w-2 h-2 rounded-full bg-gray-800" />}
                      </div>
                      <X size={16} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">None</p>
                        <p className="text-[11px] text-gray-400">Not related to any open request</p>
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
                          className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                            isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"
                          }`}
                        >
                          <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-blue-600" : "border-gray-300"}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                          </div>
                          <FileText size={16} className={`flex-shrink-0 mt-0.5 ${isSelected ? "text-blue-500" : "text-gray-400"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-semibold truncate ${isSelected ? "text-blue-900" : "text-gray-800"}`}>{req.fileName}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                {req.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">Requested by {req.requestedBy} · Due {req.dueDate}</p>
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
                      "{linkedRequest.fileName}" from {linkedRequest.requestedBy} will be marked{" "}
                      <span className="font-semibold">completed</span> once this file finishes uploading.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={submitUpload}
                    disabled={!schoolYear}
                    className="flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: linkedRequestId ? "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)" : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}
                  >
                    {linkedRequestId ? "Upload & Complete Request" : "Upload File"}
                  </button>
                </div>
              </div>
            )}
            </div>
            
            {/* Right Pane: Preview */}
            <div className="w-full md:w-[50%] bg-gray-50 p-6 flex flex-col overflow-y-auto max-h-[75vh]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">File Preview</h3>
                {selectedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFiles}
                    className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {selectedFiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center select-none py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-4">
                    <FileText size={22} className="text-gray-300" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-600">No files selected</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-[220px] leading-relaxed">
                    Choose one or more files to see their details here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-gray-800 text-white text-[10px] font-bold">
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
                    <div key={idx} className="group relative flex flex-col p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color}`}>
                          <FileIcon size={20} />
                        </div>
                        <div className="min-w-0 flex-1 pr-6">
                          <p className="text-sm font-semibold text-gray-900 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            <span className="inline-flex items-center text-xs font-medium text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono font-bold">
                              {file.name.split('.').pop().toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="absolute top-3 right-3 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          aria-label={`Remove ${file.name}`}
                          title="Remove file"
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
          </div>
        )}
      </div>
    </div>
  );
}