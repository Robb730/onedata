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
      className="inline-flex max-w-full items-center overflow-x-auto rounded-[10px] border border-slate-200/60 bg-slate-50/50 p-[3px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              relative shrink-0 rounded-[7px] px-3 py-[5px] sm:px-3.5 text-[0.7rem] font-semibold transition-all duration-200 cursor-pointer
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
