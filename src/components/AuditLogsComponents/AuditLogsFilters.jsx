import { Search, Filter, ChevronDown } from "lucide-react";

/**
 * AuditLogsFilters — Search + action/status filters.
 * Preserves existing controlled-state wiring from the page.
 *
 * @param {string}   searchQuery
 * @param {function} onSearchChange
 * @param {string}   filterAction
 * @param {function} onFilterActionChange
 * @param {string}   filterStatus
 * @param {function} onFilterStatusChange
 * @param {string[]} actions
 * @param {string[]} statuses
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
    <div
      className="rounded-[14px] border border-slate-100/80 bg-white p-3.5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center w-full">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by file name, user, action, or details..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 pl-9 pr-4 py-2 text-[0.8rem] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[0.78rem] font-semibold text-slate-500">
              Action:
            </span>
            <div className="relative flex items-center">
              <select
                value={filterAction}
                onChange={(e) => onFilterActionChange(e.target.value)}
                className="rounded-[10px] border border-slate-200/80 bg-slate-50/50 pl-3.5 pr-8 py-2 text-[0.78rem] font-semibold text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-all appearance-none"
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

          <div className="flex items-center gap-2">
            <span className="text-[0.78rem] font-semibold text-slate-500">
              Status:
            </span>
            <div className="relative flex items-center">
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value)}
                className="rounded-[10px] border border-slate-200/80 bg-slate-50/50 pl-3.5 pr-8 py-2 text-[0.78rem] font-semibold text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-all appearance-none"
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
    </div>
  );
}
