import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  RepositoryHeader,
  RepositorySearchBar,
  RepositoryTabs,
  FolderGrid,
  COLOR_PRESETS,
} from "../../components/RepositoryComponents";
import { supabase } from "../../lib/supabaseClient";

// ── Helper: look up color preset by id ───────────────────────────
function getColorPreset(id) {
  return COLOR_PRESETS.find((p) => p.id === id) || COLOR_PRESETS[0];
}

export default function Repository({ onFolderClick }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("repository-view-mode") || "grid"
  );

  useEffect(() => {
    localStorage.setItem("repository-view-mode", viewMode);
  }, [viewMode]);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [divisions, setDivisions] = useState([]);
  const [managersByDivision, setManagersByDivision] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [folderColors, setFolderColors] = useState({});



  useEffect(() => {
    async function fetchDivisions() {
      setLoading(true);
      setError(null);

      const { data: divisionsData, error: divisionsError } = await supabase
        .from("divisions")
        .select("id, name")
        .order("name", { ascending: true });

      if (divisionsError) {
        setError(divisionsError.message);
        setLoading(false);
        return;
      }

      // Anyone actively assigned as division_focal, grouped by division_id.
      // Multiple people can manage the same division — this is a 1:many join.
      const { data: managersData, error: managersError } = await supabase
        .from("users")
        .select("full_name, division_id")
        .eq("role", "division_focal")
        .eq("is_active", true)
        .not("division_id", "is", null);

      if (managersError) {
        setError(managersError.message);
        setLoading(false);
        return;
      }

      const grouped = {};
      (managersData || []).forEach(({ division_id, full_name }) => {
        if (!grouped[division_id]) grouped[division_id] = [];
        grouped[division_id].push(full_name);
      });

      setDivisions(divisionsData || []);
      setManagersByDivision(grouped);
      setLoading(false);
    }

    fetchDivisions();
  }, []);

  const handleFolderColorChange = (divisionId, newColorId) => {
    setFolderColors((prev) => ({ ...prev, [divisionId]: newColorId }));
  };

  const folders = divisions.map((division, index) => {
    const colorId =
      folderColors[division.id] || COLOR_PRESETS[index % COLOR_PRESETS.length].id;
    const preset = getColorPreset(colorId);
    const managers = managersByDivision[division.id] || [];

    return {
      id: division.id,
      name: division.name,
      managers,                                   // full list, for FolderCard
      owner: managers.length ? managers.join(", ") : "Unassigned", // fallback string
      colorId,
      iconColor: preset.text,
      iconBgColor: preset.bg,
      route: `/repository/divisions/${division.id}`,
    };
  });

  // ...rest unchanged

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

  const handleFolderClick = (folder) => {
    if (onFolderClick) {
      onFolderClick(folder);
      return;
    }
    navigate(folder.route);
  };

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        {/* ── Header ───────────────────────────────────── */}
        <RepositoryHeader />

        {/* ── Search / Sort / View Toggle ────────────────── */}
        <div className="mb-5 sm:mb-6 rounded-2xl sm:rounded-[28px] border border-white/70 bg-white/85 p-3 sm:p-5 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <RepositorySearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
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

        {/* ── States: loading / error / empty / grid ───────── */}
        {loading ? (
          <div className="rounded-2xl sm:rounded-[28px] border border-white/70 bg-white/85 px-4 sm:px-6 py-16 sm:py-24 text-center text-sm text-slate-500 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            Loading divisions…
          </div>
        ) : error ? (
          <div className="rounded-2xl sm:rounded-[28px] border border-rose-100 bg-rose-50/80 px-4 sm:px-6 py-16 sm:py-24 text-center text-sm text-rose-600 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            Failed to load divisions: {error}
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="rounded-2xl sm:rounded-[28px] border border-white/70 bg-white/85 px-4 sm:px-6 py-16 sm:py-24 text-center text-sm text-slate-500 shadow-[0_16px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            {searchQuery
              ? `No divisions matching "${searchQuery}"`
              : "No divisions found."}
          </div>
        ) : (
          <FolderGrid
            folders={filteredFolders}
            viewMode={viewMode}
            onFolderClick={handleFolderClick}
            onFolderColorChange={(folder, newColorId) =>
              handleFolderColorChange(folder.id, newColorId)
            }
          />
        )}
      </div>
    </div>
  );
}