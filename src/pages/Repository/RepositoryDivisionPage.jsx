// PINAPAKITA DITO YUNG MGA SECTION FOLDERS; ETO YUNG LOOB NG DIVISION FOLDER
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  SectionFolderGrid,
  RepositorySearchBar,
  RepositoryTabs,
} from "../../components/RepositoryComponents";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";
import { canAccessDivision } from "../../utils/accessControl";
import { resolveUserDivisionId } from "../../utils/accessControl";
import FloatingDivisionAccessRequestsButton from "../../components/RepositoryComponents/FloatingDivisionAccessRequestsButton";
import DivisionAccessRequestsSidebar from "../../components/RepositoryComponents/DivisionAccessRequestsSidebar";
import CreateSectionModal from "../../components/RepositoryComponents/CreateSectionModal";
import {
  fetchPendingDeletionRequests,
  requestSectionDeletion,
  reauthenticate,
  approveSectionDeletion,
  declineSectionDeletion,
} from "../../utils/sectionDeletion";
import DeleteSectionWarningModal from "../../components/RepositoryComponents/DeleteSectionWarningModal";
import PasswordConfirmModal from "../../components/RepositoryComponents/PasswordConfirmModal";
import { CheckCircle, XCircle, X as CloseIcon, ChevronRight, User, FolderOpen, Activity } from "lucide-react";

export default function RepositoryDivisionPage() {
  const navigate = useNavigate();
  const { divisionSlug } = useParams(); // this is the division id
  const { userProfile } = useUser();

  const [pendingRequests, setPendingRequests] = useState({}); // sectionId -> request
  const [deleteTarget, setDeleteTarget] = useState(null); // section being deleted (step 1)
  const [passwordFlow, setPasswordFlow] = useState(null); // { mode: 'request'|'approve', section, request }
  const [deleteBusy, setDeleteBusy] = useState(false);

  // ── Supabase state ─────────────────────────────────────────────
  const [division, setDivision] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [managersBySection, setManagersBySection] = useState({});
  const [divisionManagers, setDivisionManagers] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
  const [sectionToast, setSectionToast] = useState(null); // { type: 'success'|'error', message }


  // ─────────────────────────────────────────────────────────────────
  // SCROLL-SNAP MORPHING HEADER (desktop only)
  // The header no longer tracks scroll position 1:1 (that's what caused
  // slow-scroll bugs / half-morphed states). Instead it snaps fully
  // collapsed the moment the user scrolls past a small threshold, and the
  // CSS transition below animates that snap quickly — it doesn't need to
  // reach the bottom of the page, just a few px of scroll.
  const REPOSITORY_HEADER_SNAP_THRESHOLD = 60; // px scrolled down to trigger collapse
  const REPOSITORY_HEADER_UNSNAP_THRESHOLD = 15; // px to trigger expand back (hysteresis, prevents flicker)

  const headerRef = useRef(null); // the sticky <div>
  const scrollAnimationFrameRef = useRef(null); // rAF handle
  const morphStateRef = useRef(0); // 0 = expanded, 1 = collapsed

  useEffect(() => {
    const isDesktop = () => window.innerWidth >= 1024;
    const getScrollContainer = () => isDesktop() ? (document.querySelector('.app-main') || window) : window;

    function applyMorphedState(morphed) {
      if (headerRef.current) {
        if (morphed) {
          headerRef.current.classList.add("is-morphed");
        } else {
          headerRef.current.classList.remove("is-morphed");
        }
      }
    }

    function handleScroll() {
      if (scrollAnimationFrameRef.current) return;
      scrollAnimationFrameRef.current = requestAnimationFrame(() => {
        scrollAnimationFrameRef.current = null;
        const scrollContainer = getScrollContainer();
        const scrollY = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;

        if (morphStateRef.current === 0 && scrollY > REPOSITORY_HEADER_SNAP_THRESHOLD) {
          morphStateRef.current = 1;
          applyMorphedState(true);
        } else if (morphStateRef.current === 1 && scrollY <= REPOSITORY_HEADER_UNSNAP_THRESHOLD) {
          morphStateRef.current = 0;
          applyMorphedState(false);
        }
      });
    }

    if (headerRef.current) {
      const scrollContainer = getScrollContainer();
      const currentScroll = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
      const initialState = currentScroll > REPOSITORY_HEADER_SNAP_THRESHOLD ? 1 : 0;
      morphStateRef.current = initialState;
      applyMorphedState(initialState === 1);
    }

    const scrollContainer = getScrollContainer();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (scrollAnimationFrameRef.current) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
    };
  }, []);

  const logAudit = async ({ action, fileName, details, status }) => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .insert({
          action,
          file_name: fileName ?? null,
          details: details ?? "",
          performed_by: userProfile?.full_name,
          role: userProfile?.role,
          performed_on: new Date().toISOString(),
          status,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Failed to write audit log:", e);
      return null;
    }
  };

  const updateAuditLog = async (id, { action, details, status }) => {
    if (!id) return;
    try {
      await supabase
        .from("audit_logs")
        .update({
          action,
          details: details ?? "",
          performed_on: new Date().toISOString(),
          status,
        })
        .eq("id", id);
    } catch (e) {
      console.error("Failed to update audit log:", e);
    }
  };

  const handleSectionCreated = (newSection) => {
    setSections((prev) =>
      [...prev, newSection].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setShowCreateSectionModal(false);
    setSectionToast({
      type: "success",
      message: `"${newSection.name}" folder has been successfully added.`,
    });
    setTimeout(() => setSectionToast(null), 4000);
    logAudit({
      action: "Create",
      fileName: newSection.name,
      details: `Section "${newSection.name}" created in ${division?.name ?? "division"}.`,
      status: "Success",
    });
  };

  const canCreateSection =
    userProfile?.role === "administrator" ||
    (userProfile?.role === "division_focal" &&
      String(userProfile?.division_id) === String(divisionSlug));

  const canDeleteSection = (section) =>
    userProfile?.role === "administrator" ||
    (userProfile?.role === "division_focal" &&
      String(userProfile?.division_id) === String(divisionSlug));

  const isAdmin = userProfile?.role === "administrator";

  // Step 1: warning modal → user clicks Continue
  const openDeleteWarning = (section) => setDeleteTarget(section);

  // Step 2: warning confirmed → open password modal in "request" mode
  const handleWarningContinue = () => {
    const section = deleteTarget;
    setDeleteTarget(null);
    setPasswordFlow({ mode: "request", section });
  };

  // Step 3a: password confirmed for a *new* deletion request
  const handleRequestPassword = async (password) => {
    await reauthenticate(userProfile.email, password);
    const section = passwordFlow.section;
    const req = await requestSectionDeletion({
      sectionId: section.id,
      sectionName: section.name,
      divisionId: divisionSlug,
      requestedBy: userProfile.id,
      requestedByName: userProfile.full_name,
    });
    setPasswordFlow(null);
    setSectionToast({
      type: "success",
      message: `Deletion of "${section.name}" is now pending admin approval.`,
    });
    setTimeout(() => setSectionToast(null), 4000);
    const auditRow = await logAudit({
      action: "Access Request",
      fileName: section.name,
      details: `Deletion of section "${section.name}" requested — pending admin approval.`,
      status: "Pending",
    });
    setPendingRequests((prev) => ({
      ...prev,
      [section.id]: { ...req, auditLogId: auditRow?.id },
    }));
  };

  // Admin clicks "Confirm" on a pending card → open password modal in "approve" mode
  const openApprovePassword = (section) => {
    const request = pendingRequests[section.id];
    if (!request) return;
    setPasswordFlow({ mode: "approve", section, request });
  };

  // Step 3b: password confirmed for an admin *approval*
  const handleApprovePassword = async (password) => {
    await reauthenticate(userProfile.email, password);
    const { section, request } = passwordFlow;
    setDeleteBusy(true);
    try {
      await approveSectionDeletion({
        requestId: request.id,
        sectionId: section.id,
      });
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      setPendingRequests((prev) => {
        const next = { ...prev };
        delete next[section.id];
        return next;
      });
      setPasswordFlow(null);
      setSectionToast({
        type: "success",
        message: `"${section.name}" folder and its files has been successfully deleted.`,
      });
      setTimeout(() => setSectionToast(null), 4000);
      if (request.auditLogId) {
        updateAuditLog(request.auditLogId, {
          action: "Delete",
          details: `Section "${section.name}" and its files were permanently deleted (approved by ${userProfile.full_name}).`,
          status: "Success",
        });
      } else {
        logAudit({
          action: "Delete",
          fileName: section.name,
          details: `Section "${section.name}" and its files were permanently deleted (approved by ${userProfile.full_name}).`,
          status: "Success",
        });
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  // Admin clicks "Decline" — no password needed
  const handleDecline = async (section) => {
    const request = pendingRequests[section.id];
    if (!request) return;
    try {
      await declineSectionDeletion(request.id);
      setPendingRequests((prev) => {
        const next = { ...prev };
        delete next[section.id];
        return next;
      });
      setSectionToast({
        type: "success",
        message: `Deletion request for "${section.name}" was declined.`,
      });
      setTimeout(() => setSectionToast(null), 4000);
      if (request.auditLogId) {
        updateAuditLog(request.auditLogId, {
          action: "Access Grant",
          details: `Deletion request for section "${section.name}" was declined by ${userProfile.full_name}.`,
          status: "Failed",
        });
      } else {
        logAudit({
          action: "Access Grant",
          fileName: section.name,
          details: `Deletion request for section "${section.name}" was declined by ${userProfile.full_name}.`,
          status: "Failed",
        });
      }
    } catch (e) {
      setSectionToast({
        type: "error",
        message: e.message || "Failed to decline request.",
      });
      setTimeout(() => setSectionToast(null), 4000);
    }
  };

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("sectionViewMode") || "grid";
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("sectionViewMode", mode);
  };

  const isOwnDivisionFocal =
    userProfile?.role === "division_focal" &&
    String(userProfile?.division_id) === String(divisionSlug);

  useEffect(() => {
    if (!divisionSlug || !userProfile) return;

    async function checkAccessAndFetch() {
      setLoading(true);
      setError(null);

      try {
        const resolvedDivisionId = await resolveUserDivisionId(userProfile);
        const allowed = await canAccessDivision(
          userProfile,
          divisionSlug,
          resolvedDivisionId,
        );

        if (!allowed) {
          navigate(
            `/repository/restricted/${encodeURIComponent(divisionSlug)}`,
            {
              replace: true,
            },
          );
          return;
        }

        const [divisionRes, sectionsRes] = await Promise.all([
          supabase
            .from("divisions")
            .select("id, name, managed_by")
            .eq("id", divisionSlug)
            .single(),
          supabase
            .from("sections")
            .select("id, name, managed_by")
            .eq("division_id", divisionSlug)
            .order("name", { ascending: true }),
        ]);

        const { data: divisionManagersData, error: divisionManagersError } =
          await supabase
            .from("users")
            .select("full_name, section_id")
            .eq("division_id", divisionSlug)
            .eq("is_active", true);

        if (!divisionManagersError) {
          setDivisionManagers(
            (divisionManagersData || [])
              .filter(
                (u) =>
                  u.section_id === 0 ||
                  u.section_id === "0" ||
                  u.section_id == null,
              )
              .map((u) => u.full_name),
          );
        }

        if (divisionRes.error) {
          setError(divisionRes.error.message);
        } else {
          setDivision(divisionRes.data);
        }

        if (sectionsRes.error) {
          setError((prev) => prev || sectionsRes.error.message);
        } else {
          setSections(sectionsRes.data || []);
          const ids = (sectionsRes.data || []).map((s) => s.id);
          if (ids.length) {
            try {
              const pending = await fetchPendingDeletionRequests(ids);
              setPendingRequests(pending);
            } catch (e) {
              console.error("Failed to load deletion requests", e);
            }
          }

          const sectionIds = (sectionsRes.data || []).map((s) => s.id);

          if (sectionIds.length > 0) {
            const { data: managersData, error: managersError } = await supabase
              .from("users")
              .select("full_name, section_id")
              .in("role", ["section_focal"])
              .eq("is_active", true)
              .in("section_id", sectionIds);

            if (managersError) {
              setError((prev) => prev || managersError.message);
            } else {
              const grouped = {};
              (managersData || []).forEach(({ section_id, full_name }) => {
                if (!grouped[section_id]) grouped[section_id] = [];
                grouped[section_id].push(full_name);
              });
              setManagersBySection(grouped);
            }
          } else {
            setManagersBySection({});
          }
        }
      } catch (err) {
        setError(err.message || "Something went wrong while checking access.");
      } finally {
        setLoading(false);
      }
    }

    checkAccessAndFetch();
  }, [
    divisionSlug,
    userProfile?.id,
    userProfile?.role,
    userProfile?.division_id,
    userProfile?.section_id,
  ]);

  // ── Map sections → shape expected by SectionFolderGrid ────────
  const folders = sections.map((section) => {
    const managers = managersBySection[section.id] || [];
    return {
      id: section.id,
      name: section.name,
      managers,
      owner: managers.length ? managers.join(", ") : "Unassigned",
      route: `/repository/folder/${encodeURIComponent(section.name)}`,
      canDelete: canDeleteSection(section),
      isAdmin,
      pendingDeletion: pendingRequests[section.id] || null,
      onRequestDelete: () => openDeleteWarning(section),
      onConfirmDeletion: () => openApprovePassword(section),
      onDeclineDeletion: () => handleDecline(section),
    };
  });

  const filteredFolders = folders.filter((folder) => {
    const matchesSearch = folder.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/40 pb-10">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 pb-5 sm:pb-8">
        <style>{`
        
          .repo-morph-header {
            transform: translateZ(0);
            will-change: transform;
            contain: layout style paint;
            overflow-anchor: none !important;
            transition: padding 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .repo-morph-breadcrumb {
            transition: opacity 0.15s ease-out, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), margin-bottom 0.2s cubic-bezier(0.22, 1, 0.36, 1), font-size 0.2s cubic-bezier(0.22, 1, 0.36, 1);
            will-change: opacity, transform, margin-bottom, font-size;
          }
          .repo-morph-title {
            transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), margin-bottom 0.2s cubic-bezier(0.22, 1, 0.36, 1), font-size 0.2s cubic-bezier(0.22, 1, 0.36, 1), line-height 0.2s cubic-bezier(0.22, 1, 0.36, 1);
            will-change: transform, margin-bottom, font-size, line-height;
            transform-origin: left top;
          }
          .repo-morph-meta,
          .repo-morph-actions,
          .repo-morph-banner,
          .repo-morph-search {
             will-change: padding, margin, font-size, opacity, transform, max-height, max-width, line-height;
             transition: padding 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                         margin 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                         font-size 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                         line-height 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                         max-height 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                         transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                         opacity 0.15s ease-out;
          }
          
          .repo-morph-inline-pills {
             opacity: 0;
             max-width: 0;
             overflow: hidden;
             transform: translateY(10px);
             will-change: opacity, max-width, transform;
             transition: opacity 0.15s ease-out, max-width 0.2s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .repo-morph-header.is-morphed .repo-morph-inline-pills {
             opacity: 1;
             max-width: 100vw;
             transform: translateY(0);
          }

          /* Mobile (<1024px) */
          @media (max-width: 1023px) {
            .repo-morph-header {
              padding-top: 20px !important;
              padding-bottom: 12px !important;
            }
            .repo-morph-header.is-morphed {
              padding-top: 8px !important;
              padding-bottom: 4px !important;
            }

            .repo-morph-breadcrumb {
              margin-bottom: 16px !important;
              opacity: 1;
              font-size: 12px !important;
              transform: translateY(0);
            }
            .repo-morph-header.is-morphed .repo-morph-breadcrumb {
              margin-bottom: 4px !important;
              opacity: 0.4;
              font-size: 10.5px !important;
              transform: translateY(-2px);
            }

            .repo-morph-title {
              font-size: 21.6px !important;
              line-height: 1.2 !important;
              margin-bottom: 6px;
              transform: translateY(0);
            }
            .repo-morph-header.is-morphed .repo-morph-title {
              font-size: 14.6px !important;
              line-height: 1.3 !important;
              margin-bottom: 0px;
              transform: translateY(-2px);
            }

            .repo-morph-meta {
              max-height: 150px !important;
              margin-top: 6px !important;
              opacity: 1 !important;
              overflow: hidden;
              transform: translateY(0);
            }
            .repo-morph-header.is-morphed .repo-morph-meta {
              max-height: 0px !important;
              margin-top: 0px !important;
              opacity: 0 !important;
              transform: translateY(-4px);
            }

            .repo-morph-actions {
              opacity: 1;
              transform: scale(1) translateY(0);
              transform-origin: top right;
            }
            .repo-morph-header.is-morphed .repo-morph-actions {
              opacity: 0.55;
              transform: scale(0.93) translateY(-2px);
            }

            .repo-morph-banner {
              margin-bottom: 16px !important;
              margin-top: 12px !important;
              padding-top: 12px !important;
              padding-bottom: 12px !important;
              transform: translateY(0);
            }
            .repo-morph-header.is-morphed .repo-morph-banner {
              margin-bottom: 4px !important;
              margin-top: 4px !important;
              padding-top: 6px !important;
              padding-bottom: 6px !important;
              transform: translateY(-2px);
            }

            .repo-morph-search {
              margin-top: 12px !important;
              margin-bottom: 8px !important;
              padding-top: 12px !important;
              padding-bottom: 12px !important;
              padding-left: 12px !important;
              padding-right: 12px !important;
            }
            .repo-morph-header.is-morphed .repo-morph-search {
              margin-top: 4px !important;
              margin-bottom: 0px !important;
              padding-top: 6px !important;
              padding-bottom: 6px !important;
              padding-left: 8px !important;
              padding-right: 8px !important;
            }
          }

          /* Desktop (>=1024px) */
          @media (min-width: 1024px) {
            .repo-morph-header {
              padding-top: 32px !important;
              padding-bottom: 12px !important;
            }
            .repo-morph-header.is-morphed {
              padding-top: 8px !important;
              padding-bottom: 4px !important;
            }

            .repo-morph-breadcrumb {
              margin-bottom: 20px !important;
              opacity: 1;
              font-size: 12px !important;
              transform: translateY(0);
            }
            .repo-morph-header.is-morphed .repo-morph-breadcrumb {
              margin-bottom: 4px !important;
              opacity: 0.55;
              font-size: 10.5px !important;
              transform: translateY(-2px);
            }

            .repo-morph-title {
              font-size: 26.4px !important;
              line-height: 1.15 !important;
              margin-bottom: 6px;
              transform: translateY(0);
            }
            .repo-morph-header.is-morphed .repo-morph-title {
              font-size: 15.4px !important;
              line-height: 1.3 !important;
              margin-bottom: 0px;
              transform: translateY(-2px);
            }

            .repo-morph-meta {
              max-height: 120px !important;
              margin-top: 6px !important;
              opacity: 1 !important;
              overflow: hidden;
              transform: translateY(0);
            }
            .repo-morph-header.is-morphed .repo-morph-meta {
              max-height: 0px !important;
              margin-top: 0px !important;
              opacity: 0 !important;
              transform: translateY(-4px);
            }

            .repo-morph-actions {
              transform: scale(1) translateY(0);
              transform-origin: top right;
            }
            .repo-morph-header.is-morphed .repo-morph-actions {
              transform: scale(0.93) translateY(-2px);
            }

            .repo-morph-banner {
              margin-bottom: 20px !important;
              margin-top: 12px !important;
              padding-top: 12px !important;
              padding-bottom: 12px !important;
              transform: translateY(0);
            }
            .repo-morph-header.is-morphed .repo-morph-banner {
              margin-bottom: 4px !important;
              margin-top: 4px !important;
              padding-top: 6px !important;
              padding-bottom: 6px !important;
              transform: translateY(-2px);
            }

            .repo-morph-search {
              margin-top: 12px !important;
              margin-bottom: 8px !important;
              padding-top: 16px !important;
              padding-bottom: 16px !important;
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
            .repo-morph-header.is-morphed .repo-morph-search {
              margin-top: 4px !important;
              margin-bottom: 4px !important;
              padding-top: 8px !important;
              padding-bottom: 8px !important;
              padding-left: 12px !important;
              padding-right: 12px !important;
            }
          }
        `}</style>
        {/* ── Sticky Header Area ─────────────────────────────── */}
        <div ref={headerRef} className="sticky top-[56px] lg:top-0 z-20 bg-slate-50/95 pt-5 sm:pt-8 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 mb-5 sm:mb-6 repo-morph-header">
          {/* ── Breadcrumb ─────────────────────────────────────── */}
          <nav className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-4 sm:mb-5 font-medium overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden repo-morph-breadcrumb">
            <button
              onClick={() => navigate("/repository")}
              className="hover:text-slate-600 transition-colors"
            >
              Repository
            </button>
            <ChevronRight size={12} />
            <span className="text-slate-700 font-semibold truncate max-w-55">
              {loading ? "Loading…" : (division?.name ?? "Division")}
            </span>
          </nav>

          {/* ── Page Header ────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-[1.35rem] sm:text-[1.65rem] font-black text-slate-800 tracking-[-0.02em] leading-tight repo-morph-title min-w-0 max-w-full">
                  {loading ? "Loading…" : (division?.name ?? "Division")}
                </h1>
                <div className="flex items-center gap-1.5 sm:gap-2 repo-morph-inline-pills">
                  <span className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold text-blue-700 border border-blue-200/60 shadow-sm">
                    <User size={11} className="text-blue-500 shrink-0" />
                    <span className="truncate max-w-[80px] sm:max-w-[150px]">{loading ? "Loading…" : (divisionManagers.length ? divisionManagers.join(", ") : "—")}</span>
                  </span>
                  <span className="flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold text-indigo-700 border border-indigo-200/60 shadow-sm">
                    <FolderOpen size={11} className="text-indigo-500 shrink-0" />
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{loading ? "—" : `${sections.length} ${sections.length === 1 ? "folder" : "folders"}`}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1.5 repo-morph-meta">

                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg text-[0.75rem] font-bold text-blue-700 border border-blue-200/60 shadow-sm min-w-0">
                    <User size={13} className="text-blue-500 shrink-0" />
                    <span className="truncate max-w-[200px]">
                      {loading ? "Loading…" : divisionManagers.length ? divisionManagers.join(", ") : "—"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg text-[0.75rem] font-bold text-indigo-700 border border-indigo-200/60 shadow-sm min-w-0">
                    <FolderOpen size={13} className="text-indigo-500 shrink-0" />
                    <span className="truncate max-w-[200px]">
                      {loading ? "—" : `${sections.length} ${sections.length === 1 ? "folder" : "folders"}`}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Search / Sort / View Toggle ────────────────── */}
          <div className="mt-3 mb-2 rounded-2xl sm:rounded-[24px] border border-white/70 bg-white/85 p-3 sm:p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl repo-morph-search">
            <RepositorySearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          </div>


        </div>

        {/* ── States: loading / error / grid ────────────────────── */}
        {loading ? (
          <div className="rounded-2xl sm:rounded-[28px] border border-white/70 bg-white/85 px-4 sm:px-6 py-16 sm:py-24 text-center text-sm text-slate-500 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            Loading sections…
          </div>
        ) : error ? (
          <div className="rounded-2xl sm:rounded-[28px] border border-rose-100 bg-rose-50/80 px-4 sm:px-6 py-16 sm:py-24 text-center text-sm text-rose-600 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            Failed to load sections: {error}
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="rounded-2xl sm:rounded-[28px] border border-white/70 bg-white/85 px-4 sm:px-6 py-16 sm:py-24 text-center text-sm text-slate-500 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            {searchQuery
              ? `No sections matching "${searchQuery}"`
              : "No sections found."}
          </div>
        ) : (
          <SectionFolderGrid
            folders={filteredFolders}
            viewMode={viewMode}
            showCreateCard={canCreateSection}
            onFolderClick={(folder) =>
              navigate(`/repository/folder/${encodeURIComponent(folder.name)}`)
            }
            onCreateSection={() => setShowCreateSectionModal(true)}
          />
        )}
      </div>

      {(isOwnDivisionFocal || isAdmin) && (
        <>
          <FloatingDivisionAccessRequestsButton
            userProfile={userProfile}
            divisionId={divisionSlug}
            refreshKey={refreshKey}
            onClick={() => setSidebarOpen(true)}
          />
          <DivisionAccessRequestsSidebar
            isOpen={sidebarOpen}
            onClose={() => {
              setSidebarOpen(false);
              setRefreshKey((k) => k + 1); // re-poll the badge after closing
            }}
            userProfile={userProfile}
            divisionId={divisionSlug}
          />
        </>
      )}

      <CreateSectionModal
        isOpen={showCreateSectionModal}
        onClose={() => setShowCreateSectionModal(false)}
        divisionId={divisionSlug}
        divisionName={division?.name}
        existingSectionNames={sections.map((s) => s.name)}
        onCreated={handleSectionCreated}
      />
      <DeleteSectionWarningModal
        isOpen={!!deleteTarget}
        sectionName={deleteTarget?.name}
        onClose={() => setDeleteTarget(null)}
        onContinue={handleWarningContinue}
      />

      <PasswordConfirmModal
        isOpen={!!passwordFlow}
        mode={passwordFlow?.mode}
        section={passwordFlow?.section}
        busy={deleteBusy}
        onClose={() => setPasswordFlow(null)}
        onConfirm={
          passwordFlow?.mode === "approve"
            ? handleApprovePassword
            : handleRequestPassword
        }
      />

      {/* Success / Error Toast */}
      <div
        className={`fixed bottom-8 right-8 z-50 flex flex-col bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${sectionToast
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "translate-x-[120%] opacity-0 pointer-events-none"
          }`}
        style={{
          width: "380px",
          minHeight: "76px",
          borderRadius: "16px",
          boxShadow: sectionToast
            ? sectionToast.type === "error"
              ? "0 4px 24px rgba(244, 63, 94, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
              : "0 4px 24px rgba(16, 185, 129, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
            : "0 12px 30px rgba(0,0,0,0)",
          fontFamily: "Poppins, sans-serif",
          border: "1px solid rgba(241, 245, 249, 1)",
        }}
      >
        <div
          className={`absolute top-0 left-0 bottom-0 w-32 pointer-events-none bg-gradient-to-r ${sectionToast?.type === "error"
            ? "from-rose-100/60 to-transparent"
            : "from-emerald-100/60 to-transparent"
            }`}
        />
        <div
          className="flex items-center relative z-10 py-4 flex-1"
          style={{ padding: "0 20px", gap: "16px", minHeight: "76px" }}
        >
          <div
            className="flex items-center justify-center shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06),_0_1px_3px_rgba(0,0,0,0.03)]"
            style={{ width: "42px", height: "42px" }}
          >
            {sectionToast?.type === "error" ? (
              <XCircle size={22} className="text-rose-500" strokeWidth={2.5} />
            ) : (
              <CheckCircle size={22} className="text-emerald-500" strokeWidth={2.5} />
            )}
          </div>
          <div className="flex flex-col justify-center flex-1">
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", lineHeight: 1.2, margin: 0 }}>
              {sectionToast?.type === "error" ? "Error" : "Success"}
            </p>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#64748B", marginTop: "3px", margin: 0 }}>
              {sectionToast?.message}
            </p>
          </div>
          <button
            onClick={() => setSectionToast(null)}
            className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
            aria-label="Close notification"
          >
            <CloseIcon size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}