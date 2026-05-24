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
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        const count = counts[tab];

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all border ${
              isActive
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 border-gray-200 bg-white"
            }`}
          >
            {tab}
            {count !== undefined && (
              <span
                className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
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
