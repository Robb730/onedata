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
  hideViewMode = false,
  sortBy = "Name",
  onSortChange,
  placeholder = "Search folders by name, owner, or date...",
}) {
  return (
    <div className={`grid gap-4 ${hideViewMode ? "md:grid-cols-[1fr_auto]" : "xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center"}`}>
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5">
        <SlidersHorizontal className="text-slate-400" size={18} />
        <select 
          className="bg-transparent text-sm font-medium text-slate-700 outline-none"
          value={sortBy}
          onChange={(e) => onSortChange && onSortChange(e.target.value)}
        >
          <option value="name">Name</option>
          <option value="date">Date</option>
          <option value="size">Size</option>
        </select>
      </div>
      {!hideViewMode && (
        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-md transition-all ${
              viewMode === "grid"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 hover:bg-white"
            }`}
          >
            <Grid3x3 size={16} />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 rounded-md transition-all ${
              viewMode === "list"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 hover:bg-white"
            }`}
          >
            <List size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
