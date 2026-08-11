import React from "react";

/**
 * DashboardFilters — Pill-style toggle group for switching between
 * data views (e.g. Dropout | Promotion | Cohort or Summary | By Level).
 *
 * @param {string[]} options   — list of option labels
 * @param {string}   active    — currently active option
 * @param {function} onChange  — callback with the selected option
 */
export function DashboardFilters({ options = [], active, onChange }) {
  return (
    <div
      className="inline-flex items-center rounded-[10px] border border-slate-200/60 bg-slate-50/50 p-[3px]"
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt === active;
        return (
          <button
            key={opt}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(opt)}
            className={`
              relative rounded-[7px] px-3.5 py-[5px] text-[0.7rem] font-semibold transition-all duration-200 cursor-pointer
              ${isActive
                ? "bg-white text-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
              }
            `}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
