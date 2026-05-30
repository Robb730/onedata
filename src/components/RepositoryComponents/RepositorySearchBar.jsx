import { Search, Grid3x3, List, SlidersHorizontal } from "lucide-react";

/**
 * RepositorySearchBar — Search input, sort dropdown, and grid/list
 * view-mode toggle for the Repository page.
 *
 * Uses `bg-white rounded-xl border border-gray-200 p-4` to match the
 * filter bar pattern from ManageUsers and AuditLogs.
 *
 * @param {string}   searchQuery       — current search text
 * @param {function} onSearchChange    — callback when search text changes
 * @param {string}   viewMode          — "grid" | "list"
 * @param {function} onViewModeChange  — callback with new view mode
 */
export function RepositorySearchBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
      <div className="flex-1 w-full relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search folders by name, owner, or date..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="text-gray-400" size={18} />
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Name</option>
          <option>Date</option>
          <option>Size</option>
        </select>
      </div>
      <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange("grid")}
          className={`p-2 rounded-md transition-all ${
            viewMode === "grid"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Grid3x3 size={16} />
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={`p-2 rounded-md transition-all ${
            viewMode === "list"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
}
