import { useState, useRef, useEffect } from "react";
import { Search, Grid3x3, List, CalendarDays, ChevronDown } from "lucide-react";

const STATUS_STYLES = {
  active: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "Active" },
  archived: { dot: "bg-slate-300", badge: "bg-slate-100 text-slate-500 border-slate-200", label: "Archived" },
  scheduled: { dot: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-600 border-indigo-200", label: "Scheduled" },
};

export function RepositorySearchBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  hideViewMode = false,
  sortBy = "Name",
  onSortChange,
  placeholder = "Search folders by name, owner, or date...",
  schoolYears,
  selectedYear,
  onYearChange,
}) {
  const selectableYears = Array.isArray(schoolYears)
    ? schoolYears.filter((y) => y.status === "active" || y.status === "archived")
    : [];

  const showYearFilter = selectableYears.length > 0;
  const currentYear = selectableYears.find((y) => y.label === selectedYear);
  const currentStyle = STATUS_STYLES[currentYear?.status] ?? STATUS_STYLES.archived;

  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setIsYearOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="relative min-w-0 flex-1 basis-[min(100%,12rem)]">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50/80 py-2.5 sm:py-3 pl-10 sm:pl-11 pr-3 sm:pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
      </div>

      {!hideViewMode && (
        <div className="inline-flex shrink-0 items-center gap-1 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
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

      {showYearFilter && (
        <div ref={yearRef} className="relative w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsYearOpen((v) => !v)}
            className="flex w-full sm:w-auto items-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50/80 pl-3 pr-3 py-2.5 transition-colors hover:border-slate-300 min-w-0 sm:min-w-[168px]"
          >
            <CalendarDays size={16} className="text-blue-500 shrink-0" />
            <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{selectedYear || "Select year"}</span>
            {currentYear && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${currentStyle.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${currentStyle.dot}`} />
                {currentStyle.label}
              </span>
            )}
            <ChevronDown
              size={13}
              strokeWidth={2.5}
              className={`text-slate-400 ml-auto shrink-0 transition-transform duration-200 ${isYearOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isYearOpen && (
            <div className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-[0_8px_30px_rgba(15,23,42,0.12)] py-1.5 z-50 max-h-64 overflow-y-auto">
              {selectableYears.map(({ label, status }) => {
                const isSelected = selectedYear === label;
                const style = STATUS_STYLES[status] ?? STATUS_STYLES.archived;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      onYearChange && onYearChange(label);
                      setIsYearOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3.5 py-2 text-sm transition-colors ${
                      isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className={`font-semibold ${isSelected ? "text-blue-700" : "text-slate-700"}`}>{label}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      {style.label}
                    </span>
                    {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}