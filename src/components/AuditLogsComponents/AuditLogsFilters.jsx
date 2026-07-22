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
      className="mb-4 rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.04)]"
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            type="text"
            placeholder="Search by file name, user, action, or details..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Filter
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={15}
            />
            <select
              value={filterAction}
              onChange={(e) => onFilterActionChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-slate-700 outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 sm:w-auto"
            >
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action === "All" ? "All Actions" : action}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>

          <div className="relative">
            <Filter
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={15}
            />
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-slate-700 outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 sm:w-auto"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
