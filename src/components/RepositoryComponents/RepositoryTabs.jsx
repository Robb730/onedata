/**
 * RepositoryTabs — Pill-style tab group for filtering folders
 * (e.g. All | Active | Review | Archived).
 *
 * Enhanced with folder count badges and consistent styling
 * matching the filter patterns across ManageUsers and AuditLogs.
 *
 * @param {string[]} tabs        — list of tab labels
 * @param {string}   activeTab   — currently active tab
 * @param {function} onTabChange — callback with the selected tab
 * @param {object}   [counts]    — optional tab counts, e.g. { All: 3, Active: 3 }
 */
export function RepositoryTabs({
  tabs = [],
  activeTab,
  onTabChange,
  counts = {},
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[22px] bg-slate-100/70 p-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        const count = counts[tab];

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-all border ${
              isActive
                ? "bg-white text-slate-950 border-white shadow-[0_8px_28px_rgba(15,23,42,0.10)]"
                : "text-slate-500 hover:bg-white/80 border-transparent bg-transparent hover:text-slate-800"
            }`}
          >
            {tab}
            {count !== undefined && (
              <span
                className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-slate-100 text-slate-700"
                    : "bg-white/70 text-slate-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
