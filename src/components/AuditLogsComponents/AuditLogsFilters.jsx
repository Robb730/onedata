import { Search, ChevronDown } from "lucide-react";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:flex lg:items-center">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline text-[0.78rem] font-semibold text-slate-500 shrink-0">
            Action:
          </span>
          <div className="relative flex items-center flex-1 lg:flex-none">
            <select
              value={filterAction}
              onChange={(e) => onFilterActionChange(e.target.value)}
              aria-label="Filter by action"
              className="w-full lg:w-auto rounded-[10px] border border-slate-200/80 bg-slate-50/50 pl-3.5 pr-8 py-2.5 min-h-[44px] text-[0.78rem] font-semibold text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-all appearance-none"
            >
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action === "All" ? "All Actions" : action}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline text-[0.78rem] font-semibold text-slate-500 shrink-0">
            Status:
          </span>
          <div className="relative flex items-center flex-1 lg:flex-none">
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              aria-label="Filter by status"
              className="w-full lg:w-auto rounded-[10px] border border-slate-200/80 bg-slate-50/50 pl-3.5 pr-8 py-2.5 min-h-[44px] text-[0.78rem] font-semibold text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-all appearance-none"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Statuses" : status}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
