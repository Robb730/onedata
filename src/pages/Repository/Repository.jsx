import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  RepositoryHeader,
  RepositorySearchBar,
  RepositoryTabs,
  FolderGrid,
  COLOR_PRESETS,
} from "../../components/RepositoryComponents";
import { REPOSITORY_TOP_LEVEL_FOLDERS } from "../../constants/repositoryFolders";

// ── Helper: look up color preset by id ───────────────────────────
function getColorPreset(id) {
  return COLOR_PRESETS.find((p) => p.id === id) || COLOR_PRESETS[0];
}

export default function Repository({ onFolderClick }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Folder color state (keyed by folder name) ─────────────────
  const [folderColors, setFolderColors] = useState({
    "Curriculum Implementation Division": "teal",
    "Office of the Schools Division Superintendent": "blue",
    "School Governance and Operations Division": "purple",
  });

  const handleFolderColorChange = (folderName, preset) => {
    setFolderColors((prev) => ({ ...prev, [folderName]: preset.id }));
  };

  // ── Folder data ───────────────────────────────────────────────
  const folders = REPOSITORY_TOP_LEVEL_FOLDERS.map((folder) => {
    // Apply the current color preset to each folder
    const colorId = folderColors[folder.name] || "teal";
    const preset = getColorPreset(colorId);
    return {
      ...folder,
      colorId,
      iconColor: preset.iconColor,
      iconBgColor: preset.iconBg,
    };
  });

  const tabs = ["All", "Active", "Review", "Archived"];

  // Compute tab counts
  const tabCounts = {
    All: folders.length,
    Active: folders.length,
    Review: 0,
    Archived: 0,
  };

  const filteredFolders = folders.filter((folder) => {
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "All" ? true : activeTab === "Active";
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

        {/* ── Tab Filters ────────────────────────────────── */}
        <RepositoryTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={tabCounts}
        />
      </div>

      {/* ── Folder Grid ──────────────────────────────────── */}
      <FolderGrid
        folders={filteredFolders}
        onFolderClick={handleFolderClick}
        onFolderColorChange={handleFolderColorChange}
      />
    </div>
  );
}
