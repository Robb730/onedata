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
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Supabase state ────────────────────────────────────────────
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Folder color state (keyed by division id) ─────────────────
  const [folderColors, setFolderColors] = useState({});

  // ── Fetch divisions from Supabase ─────────────────────────────
  useEffect(() => {
    async function fetchDivisions() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("divisions")
        .select("id, name, managed_by")
        .order("name", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setDivisions(data || []);
      }

      setLoading(false);
    }

    fetchDivisions();
  }, []);

  const handleFolderColorChange = (divisionId, newColorId) => {
    setFolderColors((prev) => ({ ...prev, [divisionId]: newColorId }));
  };

  // ── Map divisions → folder shape expected by FolderGrid ───────
  const folders = divisions.map((division, index) => {
    const colorId =
      folderColors[division.id] || COLOR_PRESETS[index % COLOR_PRESETS.length].id;
    const preset = getColorPreset(colorId);
    return {
      id: division.id,
      name: division.name,
      owner: division.managed_by,
      colorId,
      iconColor: preset.text,
      iconBgColor: preset.bg,
      route: `/repository/divisions/${division.id}`,
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

  const handleFolderClick = (folder) => {
    if (onFolderClick) {
      onFolderClick(folder);
      return;
    }
    navigate(folder.route);
  };

  return (
    <div className="p-8">
      {/* ── Header ───────────────────────────────────── */}
      <RepositoryHeader />

      {/* ── Search / Sort / View Toggle ────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <RepositorySearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* ── Tab Filters ──────────────────────────────── */}
        <RepositoryTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={tabCounts}
        />
      </div>

      {/* ── States: loading / error / empty / grid ───────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">
          Loading divisions…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24 text-sm text-red-400">
          Failed to load divisions: {error}
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">
          {searchQuery
            ? `No divisions matching "${searchQuery}"`
            : "No divisions found."}
        </div>
      ) : (
        <FolderGrid
          folders={filteredFolders}
          onFolderClick={handleFolderClick}
          onFolderColorChange={(folder, newColorId) =>
            handleFolderColorChange(folder.id, newColorId)
          }
        />
      )}
    </div>
  );
}