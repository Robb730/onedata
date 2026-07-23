/* eslint-disable no-unused-vars */
import { useState, useCallback, useEffect } from "react";
import {
  Upload,
  FileText,
  Search,
  FolderOpen,
  CheckCircle,
  Clock,
  User,
  Tag,
} from "lucide-react";
import FolderSelectionModal from "../../components/UploadFilesComponents/FolderSelectionModal";
import FileUploadModal from "../../components/UploadFilesComponents/FileUploadModal";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";
import { runImport } from "../../utils/ExcelParsers";
import { parseAndSyncStructuredData } from "../../utils/structuredDataSync";

// ── Subfolder registry ────────────────────────────────────────────────────────
const SUBFOLDER_CODE_REGISTRY = {
  "DRRM/Contingency Plans": "CP",
  "DRRM/Incident Reports": "IR",
  "DRRM/Hazard Assessments": "HA",
  "HRD/Training": "TR",
  "HRD/Leave": "LV",
};

function getSubfoldersForSection(sectionName) {
  if (!sectionName) return [];
  return Object.keys(SUBFOLDER_CODE_REGISTRY)
    .filter((k) => k.startsWith(sectionName + "/"))
    .map((k) => ({
      name: k.replace(sectionName + "/", ""),
      code: SUBFOLDER_CODE_REGISTRY[k],
    }));
}

// ── Mock file requests ────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusColor(status) {
  switch (status) {
    case "Completed":
      return "text-teal-600 bg-teal-50 border-teal-200";
    case "Pending":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "Uploading":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "Failed":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "Completed":
      return <CheckCircle size={13} />;
    case "Pending":
      return <Clock size={13} />;
    case "Uploading":
      return <Clock size={13} className="animate-spin" />;
    default:
      return null;
  }
}

function getRequestStatusStyle(status) {
  if (status === "Overdue")
    return "text-red-600 bg-red-50 border border-red-200";
  if (status === "Completed Overdue")
    return "text-purple-600 bg-purple-50 border border-purple-200";
  if (status === "Completed")
    return "text-teal-600 bg-teal-50 border border-teal-200";
  return "text-orange-600 bg-orange-50 border border-orange-200";
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UploadFilesPage({
  role = "personnel",
  userSection = "",
}) {
  const { userProfile } = useUser();
  const isAdmin = role === "admin";
  const isDivision = role === "division" || role === "division_focal";
  const isSectionFocal = role === "sectionFocal";
  const isPersonnel = role === "personnel" || isSectionFocal;

  const preAssignedFolder = isPersonnel && userSection ? userSection : null;

  console.log("ROLE:", role, "| userProfile:", userProfile);

  // selectedFolder is now { id, name, divisionId, divisionName } or null
  const [selectedFolder, setSelectedFolder] = useState(preAssignedFolder);
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [fileRequestFilter, setFileRequestFilter] = useState("All");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileRequests, setFileRequests] = useState([]);
  const [pendingRequestUpload, setPendingRequestUpload] = useState(null);

  // Near the top, after your state declarations
  useEffect(() => {
    if (!preAssignedFolder || typeof preAssignedFolder !== "string") return;

    // Resolve the string name to a full section object
    supabase
      .from("sections")
      .select("id, name, division_id, divisions(name)")
      .eq("name", preAssignedFolder)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setSelectedFolder({
            id: data.id,
            name: data.name,
            divisionId: data.division_id,
            divisionName: data.divisions?.name ?? "",
          });
        }
      });
  }, [preAssignedFolder]);

  const showFolderPanel = isAdmin || isDivision;
  const showFileRequestPanel = !isAdmin && !isDivision;

  const activeSubfolders = getSubfoldersForSection(
    typeof selectedFolder === "object" ? selectedFolder?.name : selectedFolder,
  );

  const selectedFolderName =
    typeof selectedFolder === "object" ? selectedFolder?.name : selectedFolder;

  // ── Upload handler ────────────────────────────────────────────────────────
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

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) triggerUpload(files[0].name);
    },
    [selectedFolder, showFolderPanel],
  );

  const handleBrowseFiles = () => triggerUpload("browse");

  // Fix handleFolderSelect — don't open upload modal here; let onClose fire cleanly
  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
    setShowFolderModal(false);
    setShowUploadModal(true); // always open — if there's no pendingFile, FileUploadModal handles it fine
  };

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

  // ── Core upload + Supabase insert ─────────────────────────────────────────
  // ── Core upload + Supabase insert ─────────────────────────────────────────
  const addToUploads = async (fileName, schoolYear, uploadType, file) => {
    // Always prefer the full object; fall back only for pre-assigned string folders
    const folder = selectedFolder || preAssignedFolder;

    const sectionId = typeof folder === "object" ? folder?.id : null;
    const sectionName = typeof folder === "object" ? folder?.name : folder;
    const divisionId = typeof folder === "object" ? folder?.divisionId : null;

    const pathSegment = sectionId ?? sectionName ?? "general";
    const storagePath = `sections/${pathSegment}/${fileName}`;

    const newEntry = {
      id: String(Date.now()),
      name: fileName,
      folder: sectionName || "General",
      schoolYear,
      status: "Uploading",
      uploadedBy: userProfile?.full_name ?? "Unknown",
      uploadedOn: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    setUploadedFiles((prev) => [newEntry, ...prev]);

    try {
      // 1. Upload file to Supabase Storage
      const bucket =
        uploadType === "general" ? "repository-files" : "excel-files";
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, { cacheControl: "3600", upsert: false });

      if (storageError) throw storageError;

      // 2. Insert metadata into files table
      const { data: fileRow, error: dbError } = await supabase
        .from("files")
        .insert({
          file_name: fileName,
          file_path: storagePath,
          file_size: file.size,
          file_type: file.type || null,
          data_category: uploadType,
          school_year: schoolYear,
          section_id: sectionId,
          division_id: divisionId,
          uploaded_by: userProfile?.id ?? null,
          is_dashboard_source: uploadType !== "general",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. If structured upload type, also parse + insert data
      if (uploadType !== "general") {
        await parseAndSyncStructuredData(
          uploadType,
          file,
          schoolYear,
          userProfile?.full_name,
          fileRow.id,
        );
      }

      setUploadedFiles((files) =>
        files.map((f) =>
          f.id === newEntry.id ? { ...f, status: "Completed" } : f,
        ),
      );

      // ✅ Log success
      await logAuditEvent({
        action: "Upload",
        fileName,
        details: `Uploaded to ${sectionName || "General"} (${schoolYear})`,
        status: "Success",
      });
    } catch (err) {
      console.error("Upload failed:", err);
      alert(`Upload failed: ${err.message}`);
      setUploadedFiles((files) =>
        files.map((f) =>
          f.id === newEntry.id ? { ...f, status: "Failed" } : f,
        ),
      );

      // ✅ Log failure
      await logAuditEvent({
        action: "Upload",
        fileName,
        details: err.message,
        status: "Failed",
      });
    }

    return newEntry;
  };

  // ── Structured data parsers (extracted) ───────────────────────────────────
  const handleStructuredUpload = async (
    uploadType,
    file,
    schoolYear,
    folder,
    uploaderName,
    fileId,
  ) => {
    // ── Generic handles for multi-sheet inventory files ────────────────────
    const processMultiSheet = async (prefix, data, fileId) => {
      const { db, kes, jhs, shs, status } = data;

      if (db?.records.length) {
        const recs = db.records.map((r) => ({
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
          uploaded_by: uploaderName,
          file_id: fileId,
        }));
        for (let i = 0; i < recs.length; i += 500) {
          const { error } = await supabase
            .from(`${prefix}_school_db`)
            .insert(recs.slice(i, i + 500));
          if (error) throw error;
        }
      }

      if (kes?.records.length) {
        const recs = kes.records.map((r) => {
          const base = {
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
            school_year: schoolYear,
            uploaded_by: uploaderName,
          };
          if (prefix === "teachers") {
            base.prev_total_teachers_inventory = r.prevTotalTeachersInventory;
            base.prev_needs = r.prevNeeds;
            base.prev_excess = r.prevExcess;
          } else if (prefix === "seats") {
            base.prev_total_seats_inventory = r.prevTotalSeatsInventory;
            base.prev_needs = r.prevNeeds;
            base.prev_excess = r.prevExcess;
          } else if (prefix === "classrooms") {
            base.prev_total_classroom_inventory = r.prevTotalClassroomInventory;
            base.prev_kinder_needs = r.prevKinderNeeds;
            base.prev_kinder_excess = r.prevKinderExcess;
            base.prev_g1g6_needs = r.prevG1g6Needs;
            base.prev_g1g6_excess = r.prevG1g6Excess;
            base.prev_sned_needs = r.prevSnedNeeds;
            base.prev_sned_excess = r.prevSnedExcess;
          } else if (prefix === "textbooks") {
            base.textbook_needs = r.textbookNeeds;
            base.textbook_excess = r.textbookExcess;
          }
          return base;
        });
        for (let i = 0; i < recs.length; i += 500) {
          const { error } = await supabase
            .from(`${prefix}_kes`)
            .insert(recs.slice(i, i + 500));
          if (error) throw error;
        }
      }

      if (jhs?.records.length) {
        const recs = jhs.records.map((r) => {
          if (prefix === "teachers") {
            return {
              school_id: r.schoolId,
              school_name: r.schoolName,
              division: r.division,
              teacher_needs: r.teacherNeeds,
              teacher_excess: r.teacherExcess,
              pprd_checker: r.pprdChecker,
              remarks: r.remarks,
              prev_total_teachers_inventory: r.prevTotalTeachersInventory,
              prev_needs: r.prevNeeds,
              prev_excess: r.prevExcess,
              school_year: schoolYear,
              uploaded_by: uploaderName,
            };
          }
          if (prefix === "seats") {
            return {
              school_id: r.schoolId,
              school_name: r.schoolName,
              division: r.division,
              province: r.province,
              municipality: r.municipality,
              leg_district: r.legDistrict,
              curricular_offering: r.curricularOffering,
              enrollment_gr7: r.enrollmentGr7,
              enrollment_gr8: r.enrollmentGr8,
              enrollment_gr9: r.enrollmentGr9,
              enrollment_gr10: r.enrollmentGr10,
              enrollment_sped: r.enrollmentSped,
              total_enrollment_g7_g10: r.totalEnrollmentG7G10,
              total_enrollment_with_sped: r.totalEnrollmentWithSped,
              seats_available: r.seatsAvailable,
              ongoing_delivery: r.ongoingDelivery,
              not_yet_started: r.notYetStarted,
              allocation: r.allocation,
              total_jhs_seats: r.totalJhsSeats,
              seat_needs: r.seatNeeds,
              seat_excess: r.seatExcess,
              school_year: schoolYear,
              uploaded_by: uploaderName,
            };
          }
          if (prefix === "textbooks") {
            return {
              school_id: r.schoolId,
              school_name: r.schoolName,
              division: r.division,
              textbook_needs: r.textbookNeeds,
              textbook_excess: r.textbookExcess,
              pprd_checker: r.pprdChecker,
              remarks: r.remarks,
              school_year: schoolYear,
              uploaded_by: uploaderName,
            };
          }
          // Default classrooms pattern (can be refactored further if needed)
          return {
            school_id: r.schoolId,
            school_name: r.schoolName,
            division: r.division,
            province: r.province,
            municipality: r.municipality,
            leg_district: r.legDistrict,
            curricular_offering: r.curricularOffering,
            enrollment_gr7: r.enrollmentGr7,
            enrollment_gr8: r.enrollmentGr8,
            enrollment_gr9: r.enrollmentGr9,
            enrollment_gr10: r.enrollmentGr10,
            enrollment_sped: r.enrollmentSped,
            total_enrollment: r.totalEnrollment,
            total_enrollment_with_sped: r.totalEnrollmentWithSped,
            sy_enrollment_lis: r.syEnrollmentLis,
            total_requirement: r.totalRequirement,
            already_available: r.alreadyAvailable,
            ongoing_construction: r.ongoingConstruction,
            not_yet_started: r.notYetStarted,
            allocation: r.allocation,
            total_classroom: r.totalClassroom,
            classroom_needs: r.classroomNeeds,
            classroom_excess: r.classroomExcess,
            pprd_checker: r.pprdChecker,
            school_year: schoolYear,
            uploaded_by: uploaderName,
          };
        });
        for (let i = 0; i < recs.length; i += 500) {
          const { error } = await supabase
            .from(`${prefix}_jhs`)
            .insert(recs.slice(i, i + 500));
          if (error) throw error;
        }
      }

      if (shs?.records.length) {
        const recs = shs.records.map((r) => {
          if (prefix === "teachers") {
            return {
              school_id: r.schoolId,
              school_name: r.schoolName,
              division: r.division,
              teacher_needs: r.teacherNeeds,
              teacher_excess: r.teacherExcess,
              pprd_checker: r.pprdChecker,
              remarks: r.remarks,
              prev_total_teachers_inventory: r.prevTotalTeachersInventory,
              prev_needs: r.prevNeeds,
              prev_excess: r.prevExcess,
              school_year: schoolYear,
              uploaded_by: uploaderName,
            };
          }
          if (prefix === "seats") {
            return {
              school_id: r.schoolId,
              school_name: r.schoolName,
              division: r.division,
              province: r.province,
              municipality: r.municipality,
              leg_district: r.legDistrict,
              curricular_offering: r.curricularOffering,
              enrollment_data: r.enrollment,
              total_enrollment_g11: r.totalEnrollmentG11,
              total_enrollment_g12: r.totalEnrollmentG12,
              total_enrollment_g11_g12: r.totalEnrollmentG11G12,
              seats_available: r.seatsAvailable,
              ongoing_delivery: r.ongoingDelivery,
              not_yet_started: r.notYetStarted,
              allocation: r.allocation,
              total_shs_seats: r.totalShsSeats,
              seat_needs: r.seatNeeds,
              seat_excess: r.seatExcess,
              pprd_checker: r.pprdChecker,
              school_year: schoolYear,
              uploaded_by: uploaderName,
            };
          }
          if (prefix === "textbooks") {
            return {
              school_id: r.schoolId,
              school_name: r.schoolName,
              division: r.division,
              textbook_needs: r.textbookNeeds,
              textbook_excess: r.textbookExcess,
              pprd_checker: r.pprdChecker,
              remarks: r.remarks,
              school_year: schoolYear,
              uploaded_by: uploaderName,
            };
          }
          return {
            school_id: r.schoolId,
            school_name: r.schoolName,
            division: r.division,
            province: r.province,
            municipality: r.municipality,
            leg_district: r.legDistrict,
            curricular_offering: r.curricularOffering,
            enrollment_data: r.enrollment,
            total_enrollment_g11: r.totalEnrollmentG11,
            total_enrollment_g12: r.totalEnrollmentG12,
            total_enrollment: r.totalEnrollment,
            sy_enrollment_lis: r.syEnrollmentLis,
            total_requirement: r.totalRequirement,
            already_available: r.alreadyAvailable,
            ongoing_construction: r.ongoingConstruction,
            not_yet_started: r.notYetStarted,
            allocation: r.allocation,
            total_classroom: r.totalClassroom,
            classroom_needs: r.classroomNeeds,
            classroom_excess: r.classroomExcess,
            pprd_checker: r.pprdChecker,
            school_year: schoolYear,
            uploaded_by: uploaderName,
          };
        });
        for (let i = 0; i < recs.length; i += 500) {
          const { error } = await supabase
            .from(`${prefix}_shs`)
            .insert(recs.slice(i, i + 500));
          if (error) throw error;
        }
      }

      if (status) {
        const { error } = await supabase.from(`${prefix}_status`).insert({
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
          uploaded_by: uploaderName,
        });
        if (error) throw error;
      }
    };

    if (uploadType === "enrollment") {
      const { records, errors } = await runImport(file, "enrollment");
      if (errors?.length) console.warn("Row errors:", errors);
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
        uploaded_by: uploaderName,
        file_id: fileId,
      }));
      const { error } = await supabase
        .from("enrollment_data")
        .insert(dbRecords);
      if (error) throw error;
    }

    if (uploadType === "classrooms") {
      const data = await runImport(file, "classrooms");
      await processMultiSheet("classrooms", data);
    }

    if (uploadType === "seats") {
      const data = await runImport(file, "seats");
      await processMultiSheet("seats", data);
    }

    if (uploadType === "teachers_inventory") {
      const data = await runImport(file, "teachers_inventory");
      await processMultiSheet("teachers", data); // Database prefix is "teachers"
    }

    if (uploadType === "textbook_inventory") {
      const data = await runImport(file, "textbook_inventory");
      await processMultiSheet("textbooks", data); // Database prefix is "textbooks"
    }
  };

  const handleFileUpload = (fileName, schoolYear, uploadType, file) => {
    addToUploads(fileName, schoolYear, uploadType, file);
    setShowUploadModal(false);
    setPendingFile(null);
  };

  const handleRequestFileUpload = (fileName, schoolYear, uploadType, file) => {
    const req = pendingRequestUpload;
    const newStatus =
      req.status === "Overdue" ? "Completed Overdue" : "Completed";
    setFileRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: newStatus } : r)),
    );
    addToUploads(fileName, schoolYear, uploadType, file);
    setShowUploadModal(false);
    setPendingFile(null);
    setPendingRequestUpload(null);
  };

  const filteredRequests = fileRequests.filter((r) => {
    if (fileRequestFilter === "All") return true;
    if (fileRequestFilter === "Overdue") return r.status === "Overdue";
    if (fileRequestFilter === "Completed")
      return r.status === "Completed" || r.status === "Completed Overdue";
    return r.status === fileRequestFilter;
  });

  const overdueCount = fileRequests.filter(
    (r) => r.status === "Overdue",
  ).length;
  const pendingCount = uploadedFiles.filter(
    (f) => f.status === "Pending",
  ).length;

  const handleRequestUpload = (req) => {
    setPendingRequestUpload(req);
    setPendingFile({ name: req.fileName });
    setShowUploadModal(true);
  };

  // Add near your other helper functions, above the component or inside it
const roleDisplayMap = {
  division_focal: "Division Focal Person",
  sectionFocal: "Section Officer",
  personnel: "Section Personnel",
  admin: "Administrator",
};

const getRoleDisplay = (role) => roleDisplayMap[role] ?? role;

  // ── Upload Area ───────────────────────────────────────────────────────────
  const renderUploadArea = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-bold text-gray-900">Upload Documents</h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-semibold">
              ● {pendingCount} Pending
            </span>
            {showFileRequestPanel && (
              <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold">
                ● {overdueCount} Overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {activeSubfolders.length > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
          <Tag size={12} className="text-indigo-500 flex-shrink-0" />
          <p className="text-xs text-indigo-700">
            This section has{" "}
            <span className="font-bold">
              {activeSubfolders.length} categor
              {activeSubfolders.length === 1 ? "y" : "ies"}
            </span>
            . You'll be asked to pick one on the next step.
          </p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDragging ? "bg-indigo-100" : "bg-gray-100"}`}
          >
            <Upload
              className={isDragging ? "text-indigo-400" : "text-gray-400"}
              size={26}
            />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Drag and drop files here
          </h3>
          <p className="text-sm text-gray-500 mb-1">or</p>
          <button
            onClick={handleBrowseFiles}
            className="mt-2 px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors inline-flex items-center gap-2 text-sm"
          >
            <Upload size={16} /> Browse Files
          </button>
          <p className="text-xs text-gray-400 mt-3">
            PDF, DOCX, XLS, XLSX, JPG, JPEG, PNG, PPTX (max 1GB)
          </p>
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
                fileRequestFilter === f
                  ? "bg-teal-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No requests found.
          </p>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-500 flex-shrink-0" size={18} />
                  <p className="text-sm font-semibold text-gray-900">
                    {req.fileName}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getRequestStatusStyle(req.status)}`}
                >
                  {req.status}
                </span>
              </div>
              <div className="ml-6 grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User size={12} className="text-gray-400" />
                  <span className="font-medium text-gray-700">
                    {req.requestedBy}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={12} className="text-gray-400" />
                  <span>
                    Due:{" "}
                    <span
                      className={`font-semibold ${req.status === "Overdue" ? "text-red-600" : "text-gray-700"}`}
                    >
                      {req.dueDate}
                    </span>
                  </span>
                </div>
                <div className="text-xs text-gray-400">{req.requesterRole}</div>
              </div>
              {req.status !== "Completed" &&
                req.status !== "Completed Overdue" && (
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => handleRequestUpload(req)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      <Upload size={12} /> Upload File
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
      {uploadedFiles.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No uploads yet this session.
        </p>
      ) : (
        <div className="space-y-3">
          {uploadedFiles.map((file) => {
            const codeMatch = file.name.match(
              /^([A-Z0-9]{1,4})-(\d{4}-\d{4})-/,
            );
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-500 flex-shrink-0" size={20} />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {codeMatch && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded font-mono border border-indigo-200">
                          {codeMatch[1]}
                        </span>
                      )}
                      <p className="text-sm font-semibold text-gray-900">
                        {file.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {file.folder} · {file.schoolYear}
                    </p>
                  </div>
                </div>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(file.status)}`}
                >
                  {getStatusIcon(file.status)}
                  {file.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Files</h1>
        <p className="text-gray-500 mt-1">
          {selectedFolderName
            ? `Uploading to: ${selectedFolderName}`
            : showFolderPanel
              ? "Select a section folder on the right before uploading"
              : preAssignedFolder
                ? `Your folder: ${preAssignedFolder}`
                : "Upload files to your assigned section"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {renderUploadArea()}
          {renderRecentUploads()}
        </div>

        <div className="lg:col-span-1">
          {showFolderPanel && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
              <h3 className="font-bold text-gray-900 mb-1">Selected Section</h3>
              <p className="text-xs text-gray-400 mb-4">
                Click to change the destination folder
              </p>

              {selectedFolder ? (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-[11px] text-blue-500 font-bold uppercase tracking-wide mb-1">
                    Section
                  </p>
                  <div className="flex items-center gap-2">
                    <FolderOpen
                      className="text-blue-600 flex-shrink-0"
                      size={15}
                    />
                    <p className="text-sm font-semibold text-blue-900 truncate">
                      {selectedFolderName}
                    </p>
                  </div>
                  {selectedFolder.divisionName && (
                    <p className="text-xs text-blue-400 mt-1 ml-5">
                      {selectedFolder.divisionName}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-4">
                  No section selected
                </p>
              )}

              <button
                onClick={() => setShowFolderModal(true)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                {selectedFolder ? "Change Section" : "Select Section"}
              </button>
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
        onClose={() => setShowFolderModal(false)}
        onSelect={handleFolderSelect}
      />

      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setPendingFile(null);
            setPendingRequestUpload(null);
          }}
          selectedFolder={selectedFolderName || preAssignedFolder || ""}
          fileName={
            pendingFile?.name === "browse" ? "" : pendingFile?.name || ""
          }
          onUpload={
            pendingRequestUpload ? handleRequestFileUpload : handleFileUpload
          }
          subfolders={activeSubfolders}
        />
      )}
    </div>
  );
}
