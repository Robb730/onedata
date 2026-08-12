// PINAPAKITA DITO YUNG MGA SECTION FOLDERS; ETO YUNG LOOB NG DIVISION FOLDER
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  RepositorySectionHeader,
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

export default function RepositoryDivisionPage() {
  const navigate = useNavigate();
  const { divisionSlug } = useParams(); // this is the division id
  const { userProfile } = useUser();

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

        if (!canAccessDivision(userProfile, divisionSlug, resolvedDivisionId)) {
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
      managers, // full list, if SectionFolderCard wants it
      owner: managers.length ? managers.join(", ") : "Unassigned",
      route: `/repository/folder/${encodeURIComponent(section.name)}`,
    };
  });

  const tabs = ["All", "Active", "Review", "Archived"];

  const tabCounts = {
    All: folders.length,
    Active: folders.length,
    Review: 0,
    Archived: 0,
  };

  const filteredFolders = folders.filter((folder) => {
    const matchesSearch = folder.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "All" || activeTab === "Active";
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-slate-50/40 pb-10">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        <RepositorySectionHeader
          title={loading ? "Loading…" : (division?.name ?? "Division")}
          subtitle={
            division
              ? `Browse the section folders inside ${division.name}.`
              : ""
          }
          onBack={() => navigate("/repository")}
          backLabel="Repository"
        />

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className="mb-5 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="rounded-2xl sm:rounded-[24px] border border-white/70 bg-white/85 p-3 sm:p-4 shadow-[0_14px_44px_rgba(15,23,42,0.07)] backdrop-blur-xl min-w-0">
            <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-slate-400">
              Sections
            </p>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {loading
                ? "—"
                : `${sections.length} ${sections.length === 1 ? "folder" : "folders"}`}
            </p>
          </div>
          <div className="rounded-2xl sm:rounded-[24px] border border-white/70 bg-white/85 p-3 sm:p-4 shadow-[0_14px_44px_rgba(15,23,42,0.07)] backdrop-blur-xl min-w-0">
            <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-slate-400">
              Managed by
            </p>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold text-slate-900 truncate" title={divisionManagers.join(", ")}>
              {loading
                ? "—"
                : divisionManagers.length
                  ? divisionManagers.join(", ")
                  : "—"}
            </p>
          </div>
          <div className="rounded-2xl sm:rounded-[24px] border border-white/70 bg-white/85 p-3 sm:p-4 shadow-[0_14px_44px_rgba(15,23,42,0.07)] backdrop-blur-xl min-w-0">
            <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-slate-400">
              Status
            </p>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {loading
                ? "Loading…"
                : error
                  ? "Needs attention"
                  : "Accessible"}
            </p>
          </div>
        </div>

        {/* ── Search / Sort / View Toggle ────────────────── */}
        <div className="mb-5 sm:mb-6 rounded-2xl sm:rounded-[28px] border border-white/70 bg-white/85 p-3 sm:p-5 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <RepositorySearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />

          {/* ── Tab Filters ──────────────────────────────── */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <RepositoryTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counts={tabCounts}
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
            showCreateCard
            onFolderClick={(folder) =>
              navigate(`/repository/folder/${encodeURIComponent(folder.name)}`)
            }
            onCreateSection={() => navigate("/upload-files")}
          />
        )}
      </div>

      {isOwnDivisionFocal && (
        <>
          <FloatingDivisionAccessRequestsButton
            userProfile={userProfile}
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
          />
        </>
      )}
    </div>
  );
}
