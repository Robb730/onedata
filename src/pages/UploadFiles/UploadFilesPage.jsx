/* eslint-disable no-unused-vars */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  FolderOpen,
  CheckCircle,
  Clock,
  Tag,
  X,
  Loader,
} from "lucide-react";
import FolderSelectionModal from "../../components/UploadFilesComponents/FolderSelectionModal";
import FileUploadModal from "../../components/UploadFilesComponents/FileUploadModal";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";
import { runImport } from "../../utils/ExcelParsers";
import { parseAndSyncStructuredData } from "../../utils/structuredDataSync";
import { notifyScope } from "../../utils/notifications";

// ── Subfolder registry ────────────────────────────────────────────────────────
const SUBFOLDER_CODE_REGISTRY = {
  "DRRM/Contingency Plans": "CP",
  "DRRM/Incident Reports": "IR",
  "DRRM/Hazard Assessments": "HA",
  "HRD/Training": "TR",
  "HRD/Leave": "LV",
};

// ── Avatar helpers ─────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
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
function formatRelative(dateStr) {
  if (!dateStr) return "";
  const diffDays = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

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
export default function UploadFilesPage() {
  const { userProfile } = useUser();

  const role = userProfile?.role; // "administrator" | "division_focal" | "section_focal" | "section_personnel"
  const isAdmin = role === "administrator";
  const isDivisionFocal = role === "division_focal";
  const isSectionFocal = role === "section_focal";
  const isSectionPersonnel = role === "section_personnel";
  const isSectionScoped = isSectionFocal || isSectionPersonnel;
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const toastTimeoutRef = useRef(null);
  const uploadInFlightRef = useRef(false);

  // selectedFolder is now { id, name, divisionId, divisionName } or null
  // ── Auto-resolve the assigned section for section_focal / section_personnel ──
  useEffect(() => {
    if (!isSectionScoped || !userProfile?.section_id) return;

    let cancelled = false;
    supabase
      .from("sections")
      .select("id, name, division_id, divisions(name)")
      .eq("id", userProfile.section_id)
      .single()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setSelectedFolder({
          id: data.id,
          name: data.name,
          divisionId: data.division_id,
          divisionName: data.divisions?.name ?? "",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isSectionScoped, userProfile?.section_id]);

  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [fileRequestFilter, setFileRequestFilter] = useState("All");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileRequests, setFileRequests] = useState([]);
  const [pendingRequestUpload, setPendingRequestUpload] = useState(null);
  const [uploadToastStatus, setUploadToastStatus] = useState(null); // 'uploading', 'success', 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadsPage, setUploadsPage] = useState(1);
  const uploadsPerPage = 5;

  useEffect(() => {
    let interval;
    if (uploadToastStatus === "uploading") {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress((prev) =>
          prev >= 95 ? prev : prev + Math.random() * 5 + 2,
        );
      }, 600);
    } else if (uploadToastStatus === "success") {
      setUploadProgress(100);
    }
    return () => clearInterval(interval);
  }, [uploadToastStatus]);

  const fetchRecentUploads = async () => {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, file_name, details, performed_on, status")
      .eq("action", "Upload")
      .order("performed_on", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch recent uploads:", error);
      return;
    }

    setUploadedFiles(
      data.map((row) => {
        // details looks like: "Uploaded to SectionName (2024-2025)"
        const match = row.details?.match(/^Uploaded to (.+?) \((.+?)\)$/);
        return {
          id: row.id,
          name: row.file_name,
          folder: match?.[1] || "General",
          schoolYear: match?.[2] || "",
          status: row.status === "Success" ? "Completed" : "Failed",
          uploadedOn: new Date(row.performed_on).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      }),
    );
    setUploadsPage(1);
  };

  const fetchFileRequests = async () => {
    if (!userProfile?.section_id) return;
    const { data, error } = await supabase
      .from("file_requests")
      .select(
        `
      id, file_name, description, deadline, status, created_at,
      requested_by,
      users:requested_by ( full_name, role )
    `,
      )
      .eq("section_id", userProfile.section_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch file requests:", error);
      return;
    }

    const today = new Date();
    setFileRequests(
      (data || []).map((r) => {
        const isOverdue =
          r.status === "pending" && r.deadline && new Date(r.deadline) < today;
        return {
          id: r.id,
          fileName: r.file_name,
          message: r.description,
          requestedOn: r.created_at, // ← add this line
          dueDate: r.deadline
            ? new Date(r.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            : "—",
          requestedBy: r.users?.full_name ?? "Unknown",
          requesterRole: getRoleDisplay(r.users?.role) ?? "",
          status:
            r.status === "completed"
              ? "Completed"
              : isOverdue
                ? "Overdue"
                : "Pending",
        };
      }),
    );
  };

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  useEffect(() => {
    fetchFileRequests();
  }, [userProfile?.section_id]);

  // Near the top, after your state declarations

  const showFolderPanel = isAdmin || isDivisionFocal;
  const showFileRequestPanel = isSectionFocal || isSectionPersonnel;

  const activeSubfolders = getSubfoldersForSection(
    typeof selectedFolder === "object" ? selectedFolder?.name : selectedFolder,
  );

  const selectedFolderName =
    typeof selectedFolder === "object" ? selectedFolder?.name : selectedFolder;

  // ── Upload handler ────────────────────────────────────────────────────────
  const triggerUpload = (fileOrNameOrArray) => {
    let fileName = "";
    let fileObj = null;

    if (Array.isArray(fileOrNameOrArray)) {
      fileObj = fileOrNameOrArray;
      fileName =
        fileOrNameOrArray.length === 1
          ? fileOrNameOrArray[0].name
          : `${fileOrNameOrArray.length} files selected`;
    } else {
      const isFile = fileOrNameOrArray instanceof File;
      fileName = isFile ? fileOrNameOrArray.name : fileOrNameOrArray;
      fileObj = isFile ? fileOrNameOrArray : null;
    }

    if (isSectionScoped) {
      // Folder is already auto-assigned; go straight to the upload modal.
      setPendingFile({ name: fileName, file: fileObj });
      setShowUploadModal(true);
    } else if (!selectedFolder) {
      setPendingFile({ name: fileName, file: fileObj });
      setShowFolderModal(true);
    } else {
      setPendingFile({ name: fileName, file: fileObj });
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
      if (files.length > 0) triggerUpload(files);
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
    const folder = selectedFolder;

    const sectionId = typeof folder === "object" ? folder?.id : null;
    const sectionName = typeof folder === "object" ? folder?.name : folder;
    const divisionId = typeof folder === "object" ? folder?.divisionId : null;

    const pathSegment = sectionId ?? sectionName ?? "general";
    const yearSegment = schoolYear || "unspecified";
    const storagePath = `sections/${pathSegment}/${yearSegment}/${fileName}`;

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
      const structuredTypes = [
        "enrollment",
        "classrooms",
        "seats",
        "teachers_inventory",
        "textbook_inventory",
        "cespes",
        "performance_indicators",
      ];
      const isStructured = structuredTypes.includes(uploadType);
      const bucket = isStructured ? "excel-files" : "repository-files";
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
          uploaded_by: userProfile?.uuid ?? null,
          uploaded_by_name: userProfile?.full_name ?? null,
          status: "Unverified",
          is_dashboard_source: uploadType !== "general",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. If structured upload type, also parse + insert data
      if (isStructured) {
        await parseAndSyncStructuredData(
          uploadType,
          file,
          schoolYear,
          userProfile?.full_name,
          fileRow.id,
          { uploaderId: userProfile?.uuid ?? userProfile?.id },
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
      await fetchRecentUploads();
      await notifyScope({
        sectionId,
        divisionId,
        excludeUserId: userProfile?.uuid ?? userProfile?.id,
        type: "file_uploaded",
        title: "New files uploaded",
        content: `${userProfile?.full_name ?? "Someone"} uploaded ${fileName} to ${sectionName || "General"}`,
        meta: {
          related_file_id: fileRow.id,
          section_id: sectionId,
          division_id: divisionId,
          uploaded_by: userProfile?.uuid ?? null,
        },
      });
    } catch (err) {
      console.error("Upload failed:", err);
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

      throw err;
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
            pprd_checker: r.pprdChecker,
            remarks: r.remarks,
            school_year: schoolYear,
            uploaded_by: uploaderName,
          };
          if (prefix === "textbooks") {
            base.textbook_needs = r.textbookNeeds;
            base.textbook_excess = r.textbookExcess;
          } else {
            base.kinder_needs = r.kinderNeeds;
            base.kinder_excess = r.kinderExcess;
            base.g1g6_needs = r.g1g6Needs;
            base.g1g6_excess = r.g1g6Excess;
            base.sned_needs = r.snedNeeds;
            base.sned_excess = r.snedExcess;
          }
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

  const handleFileUpload = async (
    fileName,
    schoolYear,
    uploadType,
    fileOrFiles,
    linkedRequestId,
  ) => {
    if (uploadInFlightRef.current) return;
    uploadInFlightRef.current = true;

    setShowUploadModal(false);
    setPendingFile(null);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setUploadToastStatus("uploading");

    try {
      if (Array.isArray(fileOrFiles)) {
        for (const file of fileOrFiles) {
          await addToUploads(file.name, schoolYear, uploadType, file);
        }
      } else {
        await addToUploads(fileName, schoolYear, uploadType, fileOrFiles);
      }

      if (linkedRequestId) {
        const { error } = await supabase
          .from("file_requests")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", linkedRequestId);

        if (error) {
          console.error("Failed to complete linked request:", error);
        } else {
          await fetchFileRequests();
        }
      }

      setUploadToastStatus("success");
    } catch (e) {
      setUploadErrorMessage(e.message || "An error occurred during upload.");
      setUploadToastStatus("error");
    }

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setUploadToastStatus(null);
      toastTimeoutRef.current = null;
    }, 4000);

    uploadInFlightRef.current = false;
  };

  const handleRequestFileUpload = async ( 
    fileName,
    schoolYear,
    uploadType,
    fileOrFiles,
  ) => {
    if (uploadInFlightRef.current) return;
    uploadInFlightRef.current = true;
    const req = pendingRequestUpload;

    setShowUploadModal(false);
    setPendingFile(null);
    setPendingRequestUpload(null);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setUploadToastStatus("uploading");

    try {
      const { error } = await supabase
        .from("file_requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", req.id);

      if (error) {
        throw error;
      }

      if (Array.isArray(fileOrFiles)) {
        for (const file of fileOrFiles) {
          await addToUploads(file.name, schoolYear, uploadType, file);
        }
      } else {
        await addToUploads(fileName, schoolYear, uploadType, fileOrFiles);
      }
      await fetchFileRequests();

      setUploadToastStatus("success");
    } catch (err) {
      console.error("Failed to update file request status or upload:", err);
      setUploadErrorMessage(err.message || "An error occurred during upload.");
      setUploadToastStatus("error");
    }

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setUploadToastStatus(null);
      toastTimeoutRef.current = null;
    }, 4000);
    uploadInFlightRef.current = false;
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
    section_focal: "Section Officer",
    section_personnel: "Section Personnel",
    administrator: "Administrator",
  };

  const getRoleDisplay = (role) => roleDisplayMap[role] ?? role;

  // ── Upload Area ───────────────────────────────────────────────────────────
  const renderUploadArea = () => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-base sm:text-[1.1rem] font-bold text-slate-900 tracking-tight">
          Upload Documents
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-[11px] font-semibold border border-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {pendingCount} Pending
          </span>
          {showFileRequestPanel && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-[11px] font-semibold border border-red-100">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {overdueCount} Overdue
            </span>
          )}
        </div>
      </div>

      {activeSubfolders.length > 0 && (
        <div className="mb-4 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <Tag size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            This section has{" "}
            <span className="font-semibold text-slate-800">
              {activeSubfolders.length} categor
              {activeSubfolders.length === 1 ? "y" : "ies"}
            </span>
            . You&apos;ll pick one in the next step.
          </p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl px-4 py-8 sm:p-10 text-center transition-all ${
          isDragging
            ? "border-blue-400 bg-blue-50/80"
            : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50/70"
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 ${
              isDragging ? "bg-blue-100" : "bg-white border border-slate-200"
            }`}
          >
            <Upload
              className={isDragging ? "text-blue-600" : "text-slate-400"}
              size={24}
            />
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
            <span className="hidden sm:inline">Drag and drop files here</span>
            <span className="sm:hidden">Add files to upload</span>
          </h3>
          <p className="hidden sm:block text-sm text-slate-500 mb-1">or</p>
          <button
            type="button"
            onClick={handleBrowseFiles}
            className="mt-3 sm:mt-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] font-semibold transition-all inline-flex items-center justify-center gap-2 text-sm shadow-sm shadow-blue-600/20"
          >
            <Upload size={16} /> Browse Files
          </button>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-3 max-w-[280px] sm:max-w-none leading-relaxed">
            PDF, DOCX, XLS, XLSX, JPG, PNG, PPTX · Max 1GB
          </p>
        </div>
      </div>
    </div>
  );

  // ── File Requests Panel ───────────────────────────────────────────────────
  const renderFileRequestsPanel = () => {
    const counts = {
      All: fileRequests.length,
      Pending: fileRequests.filter((r) => r.status === "Pending").length,
      Overdue: fileRequests.filter((r) => r.status === "Overdue").length,
      Completed: fileRequests.filter(
        (r) => r.status === "Completed" || r.status === "Completed Overdue",
      ).length,
    };

    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col overflow-hidden lg:h-full">
        {/* Header */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <FileText size={17} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-[1rem] font-bold text-slate-800 tracking-tight leading-tight">
                File Requests
              </h3>
              <p className="text-[0.7rem] text-slate-400 font-medium">
                From admin & division focal
              </p>
            </div>
          </div>

          {/* Filter tabs — scrollable on narrow screens */}
          <div className="flex gap-1.5 mt-4 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 scrollbar-none">
            {["All", "Pending", "Overdue", "Completed"].map((f) => {
              const isActive = fileRequestFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFileRequestFilter(f)}
                  className={`flex flex-col items-center justify-center gap-0.5 min-w-[4.5rem] flex-1 py-2 px-2 rounded-xl text-[10.5px] font-bold transition-colors shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                  }`}
                >
                  <span className="text-[13px] leading-none">{counts[f]}</span>
                  <span className="leading-none">{f}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 max-h-[28rem] lg:max-h-none">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center">
              <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                <FileText
                  className="text-slate-300"
                  size={20}
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-[0.8rem] font-semibold text-slate-500">
                No requests here
              </p>
              <p className="text-[0.72rem] text-slate-400 mt-0.5">
                You&apos;re all caught up.
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isOverdue = req.status === "Overdue";
              const isDone =
                req.status === "Completed" ||
                req.status === "Completed Overdue";
              const accent = isOverdue
                ? "bg-red-400"
                : isDone
                  ? "bg-teal-400"
                  : "bg-amber-400";
              const avatarBg = getAvatarColor(req.requestedBy);

              return (
                <div
                  key={req.id}
                  className="relative flex rounded-xl sm:rounded-2xl border border-slate-100 overflow-hidden bg-white hover:border-slate-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all"
                >
                  <div className={`w-[3px] shrink-0 ${accent}`} />
                  <div className="flex-1 p-3.5 sm:p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <FileText size={13} className="text-blue-500" />
                        </div>
                        <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">
                          {req.fileName}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[9.5px] font-bold px-2 py-1 rounded-full ${getRequestStatusStyle(req.status)}`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className={`w-7 h-7 ${avatarBg} rounded-full flex items-center justify-center shrink-0`}
                      >
                        <span className="text-[9.5px] font-bold text-white">
                          {getInitials(req.requestedBy)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] font-semibold text-slate-700 truncate leading-tight">
                          {req.requestedBy}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                          {req.requesterRole} ·{" "}
                          {formatRelative(req.requestedOn)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 pl-2 border-l border-slate-100">
                        <p className="text-[8.5px] font-bold uppercase tracking-wide text-slate-400">
                          Due
                        </p>
                        <p
                          className={`text-[11px] font-bold ${isOverdue ? "text-red-600" : "text-slate-600"}`}
                        >
                          {req.dueDate}
                        </p>
                      </div>
                    </div>

                    {req.message && (
                      <div className="flex items-start gap-1.5 bg-slate-50 rounded-lg px-2.5 py-2 mb-3">
                        <span className="text-slate-300 text-[13px] leading-none mt-px">
                          &ldquo;
                        </span>
                        <p className="text-[11px] text-slate-500 italic leading-snug line-clamp-2">
                          {req.message}
                        </p>
                      </div>
                    )}

                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => handleRequestUpload(req)}
                        className="w-full flex items-center justify-center gap-1.5 text-[11.5px] font-semibold min-h-[40px] px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all"
                      >
                        <Upload size={12} /> Upload File
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const totalUploadsPages = Math.max(
    1,
    Math.ceil(uploadedFiles.length / uploadsPerPage),
  );
  const paginatedUploads = uploadedFiles.slice(
    (uploadsPage - 1) * uploadsPerPage,
    uploadsPage * uploadsPerPage,
  );

  // ── Recent Uploads ────────────────────────────────────────────────────────
  const renderRecentUploads = () => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <h3 className="text-base sm:text-[1.1rem] font-bold text-slate-900 tracking-tight mb-3 sm:mb-4">
        Recent Uploads
      </h3>
      {uploadedFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
          <p className="text-sm text-slate-400 font-medium">
            No uploads yet this session.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5 sm:space-y-3">
            {paginatedUploads.map((file) => {
              const codeMatch = file.name.match(
                /^([A-Z0-9]{1,4})-(\d{4}-\d{4})-/,
              );
              return (
                <div
                  key={file.id}
                  className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between p-3.5 sm:p-4 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="text-blue-600" size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 min-w-0">
                        {codeMatch && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded font-mono border border-slate-200 shrink-0">
                            {codeMatch[1]}
                          </span>
                        )}
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {file.name}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {file.folder}
                        {file.schoolYear ? ` · ${file.schoolYear}` : ""}
                        {file.uploadedOn ? ` · ${file.uploadedOn}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`self-start sm:self-auto flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${getStatusColor(file.status)}`}
                  >
                    {getStatusIcon(file.status)}
                    {file.status}
                  </span>
                </div>
              );
            })}
          </div>

          {totalUploadsPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 gap-3">
              <p className="text-xs text-slate-400">
                Page{" "}
                <span className="font-semibold text-slate-600">
                  {uploadsPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-600">
                  {totalUploadsPages}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUploadsPage((p) => Math.max(1, p - 1))}
                  disabled={uploadsPage === 1}
                  className="min-h-[36px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUploadsPage((p) => Math.min(totalUploadsPages, p + 1))
                  }
                  disabled={uploadsPage === totalUploadsPages}
                  className="min-h-[36px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderDestinationPanel = () => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:sticky lg:top-8">
      <h3 className="text-sm sm:text-[1.05rem] font-bold text-slate-900 mb-0.5 tracking-tight">
        Destination
      </h3>
      <p className="text-[0.72rem] sm:text-[0.75rem] text-slate-400 font-medium mb-3 sm:mb-4">
        Section folder for this upload
      </p>

      {selectedFolder ? (
        <div className="mb-3 sm:mb-4 p-3 bg-blue-50/80 border border-blue-100 rounded-xl">
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wide mb-1">
            Section
          </p>
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen className="text-blue-600 flex-shrink-0" size={15} />
            <p className="text-sm font-semibold text-blue-900 truncate">
              {selectedFolderName}
            </p>
          </div>
          {selectedFolder.divisionName && (
            <p className="text-xs text-blue-500/80 mt-1 ml-5 truncate">
              {selectedFolder.divisionName}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-3 sm:mb-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center">
          <p className="text-sm text-slate-400 font-medium">
            No section selected
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowFolderModal(true)}
        className="w-full min-h-[44px] px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-semibold transition-colors"
      >
        {selectedFolder ? "Change Section" : "Select Section"}
      </button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full overflow-x-hidden bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
            Upload Files
          </h1>
          <p className="hidden lg:block text-[0.78rem] text-slate-400 font-medium mt-1">
            {selectedFolderName
              ? `Uploading to: ${selectedFolderName}`
              : showFolderPanel
                ? "Select a section folder on the right before uploading"
                : "Resolving your assigned section…"}
          </p>
          {/* Mobile destination chip for section-scoped users */}
          {selectedFolderName && !showFolderPanel && (
            <div className="lg:hidden mt-2 inline-flex items-center gap-1.5 max-w-full rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1.5">
              <FolderOpen size={13} className="text-blue-600 shrink-0" />
              <span className="text-[11px] font-semibold text-blue-800 truncate">
                {selectedFolderName}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1">
            {/* Destination first on mobile for admins/division focals */}
            {showFolderPanel && (
              <div className="lg:hidden">{renderDestinationPanel()}</div>
            )}
            {renderUploadArea()}
            {renderRecentUploads()}
            {showFileRequestPanel && (
              <div className="lg:hidden">{renderFileRequestsPanel()}</div>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-1 order-2">
            {showFolderPanel && renderDestinationPanel()}

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
          mode={isDivisionFocal ? "division" : "admin"}
          divisionId={isDivisionFocal ? userProfile?.division_id : null}
          divisionName={
            isDivisionFocal ? (userProfile?.division?.name ?? "") : ""
          }
        />

        {showUploadModal && (
          <FileUploadModal
            isOpen={showUploadModal}
            onClose={() => {
              setShowUploadModal(false);
              setPendingFile(null);
              setPendingRequestUpload(null);
            }}
            selectedFolder={selectedFolderName || ""}
            fileName={
              pendingFile?.name === "browse" ? "" : pendingFile?.name || ""
            }
            initialFile={pendingFile?.file || null}
            onUpload={
              pendingRequestUpload ? handleRequestFileUpload : handleFileUpload
            }
            subfolders={activeSubfolders}
            pendingRequests={fileRequests.filter(
              (r) => r.status === "Pending" || r.status === "Overdue",
            )}
            isRequestFulfillment={!!pendingRequestUpload}
          />
        )}

        {/* Toast Notification */}
        <div
          className={`fixed left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] z-50 flex flex-col bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-8 ${
            uploadToastStatus
              ? "translate-y-0 sm:translate-x-0 opacity-100 pointer-events-auto"
              : "translate-y-4 sm:translate-y-0 sm:translate-x-[120%] opacity-0 pointer-events-none"
          }`}
          style={{
            maxWidth: "380px",
            marginLeft: "auto",
            minHeight: "76px",
            borderRadius: "16px",
            boxShadow: uploadToastStatus
              ? uploadToastStatus === "success"
                ? "0 4px 24px rgba(16, 185, 129, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
                : uploadToastStatus === "error"
                  ? "0 4px 24px rgba(239, 68, 68, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
                  : "0 4px 24px rgba(59, 130, 246, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
              : "0 12px 30px rgba(0,0,0,0)",
            fontFamily: "Poppins, sans-serif",
            border: "1px solid rgba(241, 245, 249, 1)",
          }}
        >
          <div
            className={`absolute top-0 left-0 bottom-0 w-32 pointer-events-none bg-gradient-to-r to-transparent ${
              uploadToastStatus === "success"
                ? "from-emerald-100/60"
                : uploadToastStatus === "error"
                  ? "from-red-100/60"
                  : "from-blue-100/60"
            }`}
          />

          <div
            className="flex items-center relative z-10 py-4 flex-1"
            style={{ padding: "0 20px", gap: "16px", minHeight: "76px" }}
          >
            <div
              className="flex items-center justify-center shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06),_0_1px_3px_rgba(0,0,0,0.03)]"
              style={{
                width: "42px",
                height: "42px",
              }}
            >
              {uploadToastStatus === "uploading" ? (
                <Loader
                  size={22}
                  className="text-blue-500 animate-spin"
                  strokeWidth={2.5}
                />
              ) : uploadToastStatus === "error" ? (
                <X size={22} className="text-red-500" strokeWidth={2.5} />
              ) : (
                <CheckCircle
                  size={22}
                  className="text-emerald-500"
                  strokeWidth={2.5}
                />
              )}
            </div>

            <div className="flex flex-col justify-center flex-1 min-w-0 pr-6">
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {uploadToastStatus === "uploading"
                  ? "Uploading File"
                  : uploadToastStatus === "error"
                    ? "Upload Failed"
                    : "Success"}
              </p>
              <p
                className="line-clamp-2"
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#64748B",
                  marginTop: "3px",
                  margin: 0,
                }}
              >
                {uploadToastStatus === "uploading"
                  ? "Please wait, your file is uploading..."
                  : uploadToastStatus === "error"
                    ? uploadErrorMessage || "An error occurred during upload."
                    : "File uploaded successfully."}
              </p>
            </div>

            {uploadToastStatus !== "uploading" && (
              <button
                type="button"
                onClick={() => setUploadToastStatus(null)}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
                aria-label="Close notification"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div
            className={`w-full h-1 bg-slate-100 transition-all duration-300 ${
              uploadToastStatus === "uploading" ? "opacity-100" : "opacity-0 h-0"
            }`}
          >
            <div
              className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-r-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
