// eslint-disable-next-line no-unused-vars
import { X, FileText, Calendar, FolderOpen, Loader, Tag, Sparkles, FolderPlus, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getUploadableSchoolYears } from "../../utils/schoolYearsApi";



function buildCodedFilename(originalName, code, year) {
  return `${code.toUpperCase()}-${year}-${originalName}`;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  selectedFolder,
  fileName: initialFileName,
  initialFile,
  onUpload,
  subfolders = [],
}) {
   const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState(initialFileName);
  const [schoolYears, setSchoolYears] = useState([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [yearsLoading, setYearsLoading] = useState(true);
  const [yearsError, setYearsError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState(null);
  const [uploadType, setUploadType] = useState("general");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setIsYearOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasSubfolders = subfolders.length > 0;
  const isTwoStep = hasSubfolders;
  const activeCode = selectedSubfolder?.code ?? null;
  const codedName = activeCode && fileName ? buildCodedFilename(fileName, activeCode, schoolYear) : null;

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(1);
    setFileName(initialFileName);
    setSelectedFile(initialFile || null);
    setSelectedSubfolder(null);
    setUploadType("general");
    setIsYearOpen(false);

    let cancelled = false;
    setYearsLoading(true);
    setYearsError(null);

    getUploadableSchoolYears()
      .then((years) => {
        if (cancelled) return;
        setSchoolYears(years);
        // Auto-select "Active" if present, otherwise the newest option (already sorted newest-first)
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
        setUploadProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 5 + 2; 
        });
      }, 600);
    } else {
      setUploadProgress(100);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!fileName || !schoolYear || !selectedFile) return;
    if (isTwoStep) {
      setStep(2);
    } else {
      setIsUploading(true);
      try {
        await onUpload(fileName, schoolYear, uploadType, selectedFile);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFinalUpload = async () => {
    setIsUploading(true);
    const finalName = codedName ?? fileName;
    try {
      await onUpload(finalName, schoolYear, uploadType, selectedFile);
    } finally {
      setIsUploading(false);
      setStep(1);
      setFileName("");
      setSelectedFile(null);
      setSelectedSubfolder(null);
      setUploadType("general");
    }
  };

  const accentStyle = activeCode
    ? "linear-gradient(90deg, #6366f1, #3b82f6)"
    : "linear-gradient(90deg, #3b82f6, #06b6d4)";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Accent bar */}
        <div className="h-1.5 w-full" style={{ background: accentStyle }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Upload File</h2>
            {isTwoStep && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border transition-all ${step === 1
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-teal-500 text-white border-teal-500"
                    }`}>
                    {step > 1 ? <CheckCircle size={12} /> : "1"}
                  </div>
                  <span className={`text-xs font-semibold ${step === 1 ? "text-blue-600" : "text-teal-500"}`}>
                    File Details
                  </span>
                </div>
                <div className="w-6 h-px bg-gray-300" />
                <div className="flex items-center gap-1.5">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border transition-all ${step === 2
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-200 text-gray-400 border-gray-200"
                    }`}>
                    2
                  </div>
                  <span className={`text-xs font-semibold ${step === 2 ? "text-indigo-600" : "text-gray-400"}`}>
                    Category
                  </span>
                </div>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
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
              
              <p className="text-[0.65rem] text-gray-400 mt-4 leading-relaxed">
                Large files may take several minutes. <br/> Please do not close this window.
              </p>
            </div>
          </div>
        ) : (
          <>
        {/* ── STEP 1: File Details ── */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="px-6 py-5 space-y-5">

            {/* Upload to Folder */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Upload to Folder</label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={selectedFolder}
                  readOnly
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Upload Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Upload Type
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
                >
                  <option value="general">General (Store file only)</option>
                  <option value="enrollment">Enrollment Data (Parse & Store Data)</option>
                  <option value="classrooms">Classrooms Inventory (Parse & Store Data)</option>
                  <option value="seats">Seats Inventory (Parse & Store Data)</option>
                  <option value="teachers_inventory">Teachers Inventory (Parse & Store Data)</option>
                  <option value="textbook_inventory">Textbooks Inventory (Parse & Store Data)</option>
                  <option value="cespes">CESPES (Parse & Store Data)</option>
                  <option value="performance_indicators">Performance Indicators (Parse & Store Data)</option>
                  <option value="aip_school">Approved School AIP 2026 (Store file for Dashboard)</option>
                  <option value="aip_sdo">Approved SDO AIP 2026 (Store file for Dashboard)</option>
                  <option value="qbedp">QBEDP (Store file for Dashboard)</option>
                  <option value="accomplishment_report">Accomplishment Report (Store file for Dashboard)</option>
                </select>
              </div>
            </div>

            {/* Choose File */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Choose File <span className="text-red-500">*</span>
              </label>
              <label
                htmlFor="file-upload-input"
                className="flex items-center gap-2 w-full py-2.5 px-3 text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500"
              >
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <span className={`truncate ${selectedFile ? "text-gray-800" : "text-gray-400"}`}>
                  {selectedFile ? selectedFile.name : "Choose file"}
                </span>
                <input
                  id="file-upload-input"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </label>
            </div>

            {/* File Name */}
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

            
            {/* School Year */}
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
                          onClick={() => {
                            setSchoolYear(label);
                            setIsYearOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3.5 py-2 text-sm transition-colors ${
                            isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className={`font-semibold ${isSelected ? "text-blue-700" : "text-gray-700"}`}>
                            {label}
                          </span>
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

            {/* Actions */}
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}
              >
                {isTwoStep ? (
                  <>Next: Choose Category <ArrowRight size={15} /></>
                ) : (
                  "Upload File"
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: Category / Subfolder Selection ── */}
        {step === 2 && (
          <div className="px-6 py-5 space-y-5">

            {/* File summary */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <FileText size={16} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">File</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{fileName}</p>
              </div>
              <div className="ml-auto text-right flex-shrink-0">
                <p className="text-xs text-gray-400 font-medium">School Year</p>
                <p className="text-sm font-semibold text-gray-800">{schoolYear}</p>
              </div>
            </div>

            {/* Category picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Which category does this file belong to?
              </label>
              <p className="text-[11px] text-gray-400 mb-3">
                Select a category to auto-prefix the filename, or choose{" "}
                <span className="font-semibold text-gray-600">None</span> to upload directly into the section folder.
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => setSelectedSubfolder(null)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${selectedSubfolder === null
                      ? "border-gray-800 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedSubfolder === null ? "border-gray-800" : "border-gray-300"
                    }`}>
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

                {/* Subfolder options */}
                {subfolders.map((sf) => {
                  const isSelected = selectedSubfolder?.name === sf.name;
                  const preview = buildCodedFilename(fileName, sf.code, schoolYear);
                  return (
                    <button
                      key={sf.name}
                      type="button"
                      onClick={() => setSelectedSubfolder(isSelected ? null : sf)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${isSelected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-indigo-600" : "border-gray-300"
                        }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </div>
                      <FolderPlus size={16} className={`flex-shrink-0 ${isSelected ? "text-indigo-500" : "text-gray-400"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${isSelected ? "text-indigo-900" : "text-gray-800"}`}>
                            {sf.name}
                          </p>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${isSelected
                              ? "bg-indigo-200 text-indigo-800 border-indigo-300"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
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

            {/* Coded filename preview banner */}
            {codedName && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 overflow-hidden">
                <div className="flex items-center gap-2 px-3.5 py-2 border-b border-indigo-200 bg-indigo-100/60">
                  <Sparkles size={13} className="text-indigo-500" />
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                    Auto-Generated Filename
                  </span>
                </div>
                <div className="px-3.5 py-3">
                  <p className="text-sm font-mono text-indigo-900 break-all leading-relaxed">
                    <span className="bg-indigo-200 text-indigo-800 px-1 py-0.5 rounded font-bold">{activeCode}</span>
                    <span className="text-indigo-400 mx-0.5">-</span>
                    <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded">{schoolYear}</span>
                    <span className="text-indigo-400 mx-0.5">-</span>
                    <span className="text-gray-700">{fileName}</span>
                  </p>
                  <p className="text-[11px] text-indigo-500 mt-2">
                    This is the exact filename that will be saved in the system.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                type="button"
                onClick={handleFinalUpload}
                disabled={!schoolYear}
                className="flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: activeCode
                    ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)"
                    : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                }}
              >
                {activeCode ? "Upload & Apply Code" : "Upload to Section Folder"}
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
