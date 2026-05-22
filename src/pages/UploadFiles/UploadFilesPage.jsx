import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Search,
  Folder,
  CheckCircle,
  Clock,
  User,
  Tag,
} from "lucide-react";
import FolderSelectionModal from "../../components/UploadFilesComponents/FolderSelectionModal";
import FileUploadModal from "../../components/UploadFilesComponents/FileUploadModal";
import { supabase } from "../../lib/supabaseClient";
import { runImport } from "../../utils/ExcelParsers";

// ── Folder data scoped by division ───────────────────────────────────────────
const ALL_FOLDERS = [
  "Curriculum Implementation Division",
  "Office of the Schools Division Superintendent",
  "School Governance and Operations Division",
  "DRRM",
  "Education Facilities",
  "HRD",
  "Learner Formation",
  "Planning and Research",
  "School Health",
  "SIME",
  "SMN",
  "Sports",
];

const DIVISION_FOLDERS = {
  "School Governance and Operations Division": [
    "DRRM",
    "Education Facilities",
    "HRD",
    "Learner Formation",
    "Planning and Research",
    "School Health",
    "SIME",
    "SMN",
    "Sports",
  ],
  "Office of the Schools Division Superintendent": [
    "Administrative Services",
    "Budget and Finance",
    "ICT",
    "Legal",
  ],
  "Curriculum Implementation Division": [
    "District Instructional Supervision",
    "Inclusive Education",
    "Learning Areas",
    "LRMDS",
  ],
};

// ── Subfolder registry ────────────────────────────────────────────────────────
const SUBFOLDER_CODE_REGISTRY = {
  // DRRM — has subfolders, triggers 2-step upload flow
  "DRRM/Contingency Plans":   "CP",
  "DRRM/Incident Reports":    "IR",
  "DRRM/Hazard Assessments":  "HA",
  // HRD — has subfolders
  "HRD/Training":             "TR",
  "HRD/Leave":                "LV",
};

// Build a subfolders array for a given section folder
function getSubfoldersForSection(sectionFolder) {
  if (!sectionFolder) return [];
  return Object.keys(SUBFOLDER_CODE_REGISTRY)
    .filter((k) => k.startsWith(sectionFolder + "/"))
    .map((k) => ({
      name: k.replace(sectionFolder + "/", ""),
      code: SUBFOLDER_CODE_REGISTRY[k],
    }));
}

// ── Mock file requests ────────────────────────────────────────────────────────
const INITIAL_FILE_REQUESTS = [
  {
    id: "1",
    fileName: "Budget Report 2025",
    requestedBy: "Hensley Santos",
    requesterRole: "Division Officer",
    dueDate: "Mar 15, 2026",
    priority: "HIGH",
    status: "Pending",
  },
  {
    id: "2",
    fileName: "Annual Performance Review",
    requestedBy: "Anna Reyes",
    requesterRole: "Section Focal Officer",
    dueDate: "Mar 20, 2026",
    priority: "NORMAL",
    status: "Pending",
  },
  {
    id: "3",
    fileName: "Q1 Enrollment Summary",
    requestedBy: "Maria Santos",
    requesterRole: "School Principal",
    dueDate: "Mar 10, 2026",
    priority: "HIGH",
    status: "Overdue",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusColor(status) {
  switch (status) {
    case "Completed": return "text-teal-600 bg-teal-50 border-teal-200";
    case "Pending":   return "text-orange-600 bg-orange-50 border-orange-200";
    case "Uploading": return "text-blue-600 bg-blue-50 border-blue-200";
    default:          return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "Completed": return <CheckCircle size={13} />;
    case "Pending":   return <Clock size={13} />;
    case "Uploading": return <Clock size={13} className="animate-spin" />;
    default:          return null;
  }
}

function getRequestStatusStyle(status) {
  if (status === "Overdue")           return "text-red-600 bg-red-50 border border-red-200";
  if (status === "Completed Overdue") return "text-purple-600 bg-purple-50 border border-purple-200";
  if (status === "Completed")         return "text-teal-600 bg-teal-50 border border-teal-200";
  return "text-orange-600 bg-orange-50 border border-orange-200";
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UploadFilesPage({ role = "personnel", userSection = "" }) {
  const isAdmin        = role === "admin";
  const isDivision     = role === "division";
  const isSectionFocal = role === "sectionFocal";
  const isPersonnel    = role === "personnel" || isSectionFocal;

  const preAssignedFolder = isPersonnel && userSection ? userSection : null;

  const [selectedFolder, setSelectedFolder]       = useState(preAssignedFolder);
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [isDragging, setIsDragging]               = useState(false);
  const [showFolderModal, setShowFolderModal]     = useState(false);
  const [showUploadModal, setShowUploadModal]     = useState(false);
  const [pendingFile, setPendingFile]             = useState(null);
  const [fileRequestFilter, setFileRequestFilter] = useState("All");
  const [uploadedFiles, setUploadedFiles]         = useState([
    { id: "1", name: "Student Enrollment Data Q1", folder: "Planning and Research", schoolYear: "2024-2025", status: "Completed", uploadedBy: "Juan Dela Cruz", uploadedOn: "Feb 20, 2026" },
    { id: "2", name: "Teacher Performance Report", folder: "HRD",                  schoolYear: "2024-2025", status: "Completed", uploadedBy: "Maria Santos",   uploadedOn: "Feb 19, 2026" },
  ]);
  const [fileRequests, setFileRequests]                 = useState(INITIAL_FILE_REQUESTS);
  const [pendingRequestUpload, setPendingRequestUpload] = useState(null);

  const availableFolders = isAdmin
    ? ALL_FOLDERS
    : isDivision
    ? DIVISION_FOLDERS[userSection] || Object.values(DIVISION_FOLDERS).flat()
    : [];

  const filteredFolders = availableFolders.filter((f) =>
    f.toLowerCase().includes(folderSearchQuery.toLowerCase())
  );

  const showFolderPanel      = isAdmin || isDivision;
  const showFileRequestPanel = !isAdmin && !isDivision;

  // Subfolders for the currently active section
  const activeSubfolders = getSubfoldersForSection(selectedFolder || preAssignedFolder);

  // ── Event handlers ────────────────────────────────────────────────────────
  const triggerUpload = (fileName) => {
    if (!showFolderPanel) {
      setPendingFile({ name: fileName });
      setShowUploadModal(true);
    } else if (!selectedFolder) {
      setPendingFile({ name: fileName });
      setShowFolderModal(true);
    } else {
      setPendingFile({ name: fileName });
      setShowUploadModal(true);
    }
  };

  const handleDragOver  = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop      = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) triggerUpload(files[0].name);
  }, [selectedFolder, showFolderPanel]);

  const handleBrowseFiles = () => triggerUpload("example-document.pdf");

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
    setShowFolderModal(false);
    if (pendingFile) setShowUploadModal(true);
  };

  const addToUploads = async (fileName, schoolYear, uploadType, file) => {
    const folder = selectedFolder || preAssignedFolder || "General";
    const newFile = {
      id: String(Date.now()),
      name: fileName,
      folder,
      schoolYear,
      status: "Uploading",
      uploadedBy: "Juan Dela Cruz", // In a real app, get from auth context
      uploadedOn: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setUploadedFiles((prev) => [newFile, ...prev]);

    try {
      if (uploadType === "general") {
        // 1. Upload to Supabase Storage (repository-files bucket)
        // eslint-disable-next-line no-unused-vars
        const { data, error } = await supabase.storage
          .from("repository-files")
          .upload(`${folder}/${fileName}`, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;
        
      } else if (uploadType === "enrollment") {
        // 1. Parse the Excel file
        const { records, errors } = await runImport(file, "enrollment");
        
        if (errors && errors.length > 0) {
          console.warn("Parsed with some row errors:", errors);
          // You might want to show these to the user in a modal
        }

        // 2. Map parsed records to database schema
        const dbRecords = records.map((r) => ({
          school_id: r.schoolId,
          school_name: r.schoolName,
          school_type: r.schoolType,
          category: r.sheet,
          school_year: schoolYear,
          elementary_data: r.elementary,
          junior_high_data: r.juniorHigh,
          senior_high_s1_data: r.seniorHighS1,
          senior_high_s2_data: r.seniorHighS2,
          grand_total: r.grandTotal,
          uploaded_by: "Juan Dela Cruz" // Replace with actual user name or ID
        }));

        // 3. Insert into Supabase database
        const { error: dbError } = await supabase
          .from("enrollment_data")
          .insert(dbRecords);

        if (dbError) throw dbError;

        // 4. Also store the actual file in excel-files bucket
        const { error: storageError } = await supabase.storage
          .from("excel-files")
          .upload(`${folder}/${fileName}`, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (storageError) throw storageError;

      } else if (uploadType === "classrooms") {
        // 1. Parse the Excel file (5 sheets: DB, KES, JHS, SHS, Status)
        const { db, kes, jhs, shs, status } = await runImport(file, "classrooms");

        // 2. Insert DB sheet records (Baliwag-filtered)
        if (db && db.records.length > 0) {
          const dbRecs = db.records.map((r) => ({
            school_id: r.schoolId,
            school_name: r.schoolName,
            division: r.division,
            district: r.district,
            street_address: r.streetAddress,
            mother_school_id: r.motherSchoolId,
            province: r.province,
            municipality: r.municipality,
            legislative_district: r.legislativeDistrict,
            barangay: r.barangay,
            sector: r.sector,
            school_subclassification: r.schoolSubclassification,
            school_type: r.schoolType,
            implementing_unit: r.implementingUnit,
            modified_coc: r.modifiedCoc,
            enrollment_elem: r.enrollmentElem,
            enrollment_jhs: r.enrollmentJhs,
            enrollment_shs: r.enrollmentShs,
            enrollment_total: r.enrollmentTotal,
            school_year: schoolYear,
            uploaded_by: "Juan Dela Cruz",
          }));
          for (let i = 0; i < dbRecs.length; i += 500) {
            const { error } = await supabase.from("classrooms_school_db").insert(dbRecs.slice(i, i + 500));
            if (error) throw error;
          }
        }

        // 3. Insert KES sheet records
        if (kes && kes.records.length > 0) {
          const kesRecs = kes.records.map((r) => ({
            school_id: r.schoolId,
            school_name: r.schoolName,
            division: r.division,
            kinder_needs: r.kinderNeeds,
            kinder_excess: r.kinderExcess,
            g1g6_needs: r.g1g6Needs,
            g1g6_excess: r.g1g6Excess,
            sned_needs: r.snedNeeds,
            sned_excess: r.snedExcess,
            pprd_checker: r.pprdChecker,
            remarks: r.remarks,
            prev_total_classroom_inventory: r.prevTotalClassroomInventory,
            prev_kinder_needs: r.prevKinderNeeds,
            prev_kinder_excess: r.prevKinderExcess,
            prev_g1g6_needs: r.prevG1g6Needs,
            prev_g1g6_excess: r.prevG1g6Excess,
            prev_sned_needs: r.prevSnedNeeds,
            prev_sned_excess: r.prevSnedExcess,
            school_year: schoolYear,
            uploaded_by: "Juan Dela Cruz",
          }));
          for (let i = 0; i < kesRecs.length; i += 500) {
            const { error } = await supabase.from("classrooms_kes").insert(kesRecs.slice(i, i + 500));
            if (error) throw error;
          }
        }

        // 4. Insert JHS sheet records
        if (jhs && jhs.records.length > 0) {
          const jhsRecs = jhs.records.map((r) => ({
            school_id: r.schoolId, school_name: r.schoolName,
            division: r.division, province: r.province, municipality: r.municipality,
            leg_district: r.legDistrict, curricular_offering: r.curricularOffering,
            enrollment_gr7: r.enrollmentGr7, enrollment_gr8: r.enrollmentGr8,
            enrollment_gr9: r.enrollmentGr9, enrollment_gr10: r.enrollmentGr10,
            enrollment_sped: r.enrollmentSped,
            total_enrollment: r.totalEnrollment, total_enrollment_with_sped: r.totalEnrollmentWithSped,
            sy_enrollment_lis: r.syEnrollmentLis,
            total_requirement: r.totalRequirement,
            already_available: r.alreadyAvailable, ongoing_construction: r.ongoingConstruction,
            not_yet_started: r.notYetStarted, allocation: r.allocation,
            total_classroom: r.totalClassroom,
            classroom_needs: r.classroomNeeds, classroom_excess: r.classroomExcess,
            pprd_checker: r.pprdChecker,
            school_year: schoolYear, uploaded_by: "Juan Dela Cruz",
          }));
          for (let i = 0; i < jhsRecs.length; i += 500) {
            const { error } = await supabase.from("classrooms_jhs").insert(jhsRecs.slice(i, i + 500));
            if (error) throw error;
          }
        }

        // 5. Insert SHS sheet records
        if (shs && shs.records.length > 0) {
          const shsRecs = shs.records.map((r) => ({
            school_id: r.schoolId, school_name: r.schoolName,
            division: r.division, province: r.province, municipality: r.municipality,
            leg_district: r.legDistrict, curricular_offering: r.curricularOffering,
            enrollment_data: r.enrollment, // JSONB (strand-level G11/G12)
            total_enrollment_g11: r.totalEnrollmentG11, total_enrollment_g12: r.totalEnrollmentG12,
            total_enrollment: r.totalEnrollment, sy_enrollment_lis: r.syEnrollmentLis,
            total_requirement: r.totalRequirement,
            already_available: r.alreadyAvailable, ongoing_construction: r.ongoingConstruction,
            not_yet_started: r.notYetStarted, allocation: r.allocation,
            total_classroom: r.totalClassroom,
            classroom_needs: r.classroomNeeds, classroom_excess: r.classroomExcess,
            pprd_checker: r.pprdChecker,
            school_year: schoolYear, uploaded_by: "Juan Dela Cruz",
          }));
          for (let i = 0; i < shsRecs.length; i += 500) {
            const { error } = await supabase.from("classrooms_shs").insert(shsRecs.slice(i, i + 500));
            if (error) throw error;
          }
        }

        // 6. Insert Status record
        if (status) {
          const { error } = await supabase.from("classrooms_status").insert({
            sdo: status.sdo,
            expected_schools: status.expectedSchools,
            kes_blank_cells: status.kes.blankCells,
            kes_complete: status.kes.complete,
            kes_percentage: status.kes.percentage,
            jhs_blank_cells: status.jhs.blankCells,
            jhs_complete: status.jhs.complete,
            jhs_percentage: status.jhs.percentage,
            shs_blank_cells: status.shs.blankCells,
            shs_complete: status.shs.complete,
            shs_percentage: status.shs.percentage,
            school_year: schoolYear,
            uploaded_by: "Juan Dela Cruz",
          });
          if (error) throw error;
        }

        // 7. Store the actual file in excel-files bucket
        const { error: storageError2 } = await supabase.storage
          .from("excel-files")
          .upload(`${folder}/${fileName}`, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (storageError2) throw storageError2;
      }

      // Mark as completed
      setUploadedFiles((files) =>
        files.map((f) => (f.id === newFile.id ? { ...f, status: "Completed" } : f))
      );
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
      setUploadedFiles((files) =>
        files.map((f) => (f.id === newFile.id ? { ...f, status: "Failed" } : f))
      );
    }

    return newFile;
  };

  const handleFileUpload = (fileName, schoolYear, uploadType, file) => {
    addToUploads(fileName, schoolYear, uploadType, file);
    setShowUploadModal(false);
    setPendingFile(null);
  };

  const handleRequestFileUpload = (fileName, schoolYear, uploadType, file) => {
    const req = pendingRequestUpload;
    const newStatus = req.status === "Overdue" ? "Completed Overdue" : "Completed";
    setFileRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: newStatus } : r)));
    addToUploads(fileName, schoolYear, uploadType, file);
    setShowUploadModal(false);
    setPendingFile(null);
    setPendingRequestUpload(null);
  };

  const filteredRequests = fileRequests.filter((r) => {
    if (fileRequestFilter === "All")       return true;
    if (fileRequestFilter === "Overdue")   return r.status === "Overdue";
    if (fileRequestFilter === "Completed") return r.status === "Completed" || r.status === "Completed Overdue";
    return r.status === fileRequestFilter;
  });

  const overdueCount = fileRequests.filter((r) => r.status === "Overdue").length;
  const pendingCount = uploadedFiles.filter((f) => f.status === "Pending").length;

  const handleRequestUpload = (req) => {
    setPendingRequestUpload(req);
    setPendingFile({ name: req.fileName });
    setShowUploadModal(true);
  };

  // ── Upload Area ───────────────────────────────────────────────────────────
  const renderUploadArea = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-bold text-gray-900">Upload Documents</h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-semibold">● {pendingCount} Pending</span>
            {showFileRequestPanel && <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold">● {overdueCount} Overdue</span>}
          </div>
        </div>
      </div>

      {/* Info tip when subfolders exist */}
      {activeSubfolders.length > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
          <Tag size={12} className="text-indigo-500 flex-shrink-0" />
          <p className="text-xs text-indigo-700">
            This section has{" "}
            <span className="font-bold">{activeSubfolders.length} categor{activeSubfolders.length === 1 ? "y" : "ies"}</span>.
            {" "}You'll be asked to pick one on the next step.
          </p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          isDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDragging ? "bg-indigo-100" : "bg-gray-100"}`}>
            <Upload className={isDragging ? "text-indigo-400" : "text-gray-400"} size={26} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Drag and drop files here</h3>
          <p className="text-sm text-gray-500 mb-1">or</p>
          <button
            onClick={handleBrowseFiles}
            className="mt-2 px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors inline-flex items-center gap-2 text-sm"
          >
            <Upload size={16} />Browse Files
          </button>
          <p className="text-xs text-gray-400 mt-3">PDF, DOCX, XLS, XLSX, JPG, JPEG, PNG, PPTX (max 1GB)</p>
        </div>
      </div>
    </div>
  );

  // ── File Requests Panel ───────────────────────────────────────────────────
  const renderFileRequestsPanel = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">File Requests</h3>
        <div className="flex items-center gap-1 text-xs flex-wrap justify-end">
          {["All", "Pending", "Overdue", "Completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFileRequestFilter(f)}
              className={`px-2.5 py-1.5 rounded-full font-medium transition-colors ${
                fileRequestFilter === f ? "bg-teal-500 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No requests found.</p>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-500 flex-shrink-0" size={18} />
                  <p className="text-sm font-semibold text-gray-900">{req.fileName}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getRequestStatusStyle(req.status)}`}>
                  {req.status}
                </span>
              </div>
              <div className="ml-6 grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User size={12} className="text-gray-400" />
                  <span className="font-medium text-gray-700">{req.requestedBy}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={12} className="text-gray-400" />
                  <span>Due: <span className={`font-semibold ${req.status === "Overdue" ? "text-red-600" : "text-gray-700"}`}>{req.dueDate}</span></span>
                </div>
                <div className="text-xs text-gray-400">{req.requesterRole}</div>
              </div>
              {req.status !== "Completed" && req.status !== "Completed Overdue" && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => handleRequestUpload(req)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    <Upload size={12} />Upload File
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ── Recent Uploads ────────────────────────────────────────────────────────
  const renderRecentUploads = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4">Recent Uploads</h3>
      <div className="space-y-3">
        {uploadedFiles.map((file) => {
          const codeMatch = file.name.match(/^([A-Z0-9]{1,4})-(\d{4}-\d{4})-/);
          return (
            <div key={file.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-500 flex-shrink-0" size={20} />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {codeMatch && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded font-mono border border-indigo-200">
                        {codeMatch[1]}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                  </div>
                  <p className="text-xs text-gray-500">{file.folder} · {file.schoolYear}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(file.status)}`}>
                {getStatusIcon(file.status)}{file.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Files</h1>
        <p className="text-gray-500 mt-1">
          {selectedFolder
            ? `Uploading to: ${selectedFolder}`
            : showFolderPanel
            ? "Select a folder on the right before uploading"
            : preAssignedFolder
            ? `Your folder: ${preAssignedFolder}`
            : "Upload files to your assigned section"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {renderUploadArea()}
          {renderRecentUploads()}
        </div>

        {/* Right Column - Contextual Panel */}
        <div className="lg:col-span-1">
          {showFolderPanel && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
              <h3 className="font-bold text-gray-900 mb-1">Select Folder</h3>
              <p className="text-xs text-gray-400 mb-4">{isAdmin ? "All folders" : "Folders in your division"}</p>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search folders..."
                  value={folderSearchQuery}
                  onChange={(e) => setFolderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {selectedFolder && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-[11px] text-blue-500 font-bold uppercase tracking-wide mb-1">Selected Folder</p>
                  <div className="flex items-center gap-2">
                    <Folder className="text-blue-600 flex-shrink-0" size={15} />
                    <p className="text-sm font-semibold text-blue-900 truncate">{selectedFolder}</p>
                  </div>
                </div>
              )}

              <div className="max-h-96 overflow-y-auto space-y-1">
                {filteredFolders.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No folders found.</p>
                ) : (
                  filteredFolders.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => handleFolderSelect(folder)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                        selectedFolder === folder
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <Folder className={selectedFolder === folder ? "text-blue-500" : "text-gray-400"} size={17} />
                      <span className={`text-sm font-medium ${selectedFolder === folder ? "text-blue-900" : "text-gray-700"}`}>
                        {folder}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {showFileRequestPanel && (
            <div className="sticky top-8 h-[calc(100vh-8rem)]">
              {renderFileRequestsPanel()}
            </div>
          )}
        </div>
      </div>

      <FolderSelectionModal
        isOpen={showFolderModal}
        onClose={() => { setShowFolderModal(false); setPendingFile(null); }}
        onSelect={handleFolderSelect}
      />

      {showUploadModal && pendingFile && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => { setShowUploadModal(false); setPendingFile(null); setPendingRequestUpload(null); }}
          selectedFolder={selectedFolder || preAssignedFolder || ""}
          fileName={pendingFile.name}
          onUpload={pendingRequestUpload ? handleRequestFileUpload : handleFileUpload}
          subfolders={activeSubfolders}
        />
      )}
    </div>
  );
}
