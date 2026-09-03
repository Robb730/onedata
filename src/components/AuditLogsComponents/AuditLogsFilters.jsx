import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, CalendarDays, X } from "lucide-react";
import { CustomDateRangePicker } from "./CustomDateRangePicker";

function CustomDropdown({ value, options, onChange, ariaLabel, placeholderPrefix = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLabel = (opt) => opt === "All" ? placeholderPrefix : opt;

  return (
    <div className="relative flex-1 lg:flex-none min-w-[160px]" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        className={`w-full flex items-center justify-between rounded-[10px] border pl-3.5 pr-2.5 py-2 min-h-[44px] text-[0.8rem] font-semibold transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
          isOpen 
            ? "border-blue-500 bg-white text-slate-800" 
            : "border-slate-200/80 bg-white sm:bg-slate-50/50 hover:border-blue-200 hover:bg-white text-slate-700"
        }`}
      >
        <span className="truncate">{getLabel(value)}</span>
        <ChevronDown
          size={14}
          className={`ml-2 shrink-0 transition-transform ${isOpen ? "rotate-180 text-blue-500" : "text-slate-400"}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full min-w-[160px] rounded-[12px] border border-slate-200 bg-white shadow-lg origin-top animate-in fade-in zoom-in-95 duration-150">
          <div className="flex max-h-60 flex-col overflow-y-auto custom-scrollbar">
            {options.map((opt) => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-3 text-left text-[0.85rem] font-semibold transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {getLabel(opt)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * AuditLogsFilters — Search + action/status filters.
 * Preserves existing controlled-state wiring from the page.
 */
export default function AuditLogsFilters({
  searchQuery,
  onSearchChange,
  filterAction,
  onFilterActionChange,
  filterStatus,
  onFilterStatusChange,
  actions = [],
  statuses = [],
  dateFrom = "",
  dateTo = "",
  onDateRangeChange,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-3.5 mb-5 sm:mb-8 flex flex-col gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="relative min-w-0 w-full">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by file, user, or action..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 pl-9 pr-4 py-2.5 min-h-[44px] text-[0.8rem] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          aria-label="Search audit logs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:flex lg:items-center lg:flex-wrap">
        <div className="flex items-center gap-2 min-w-0 z-20">
          <span className="hidden sm:inline text-[0.78rem] font-semibold text-slate-500 shrink-0">
            Action:
          </span>
          <CustomDropdown
            value={filterAction}
            options={actions}
            onChange={onFilterActionChange}
            ariaLabel="Filter by action"
            placeholderPrefix="All Actions"
          />
        </div>

        <div className="flex items-center gap-2 min-w-0 z-10">
          <span className="hidden sm:inline text-[0.78rem] font-semibold text-slate-500 shrink-0">
            Status:
          </span>
          <CustomDropdown
            value={filterStatus}
            options={statuses}
            onChange={onFilterStatusChange}
            ariaLabel="Filter by status"
            placeholderPrefix="All Statuses"
          />
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 col-span-full lg:col-span-1 min-w-[240px]">
          <CustomDateRangePicker
            startDate={dateFrom}
            endDate={dateTo}
            onChange={onDateRangeChange}
            placeholder="Filter by Date Range..."
          />
        </div>
      </div>
    </div>
  );
}
