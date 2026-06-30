import React from "react";

/**
 * DashboardHeader — Top-level header with school year selector,
 * SDO branding badge, and Compare button.
 *
 * @param {string}   selectedYear
 * @param {function} onYearChange
 * @param {string[]} years
 * @param {function} [onCompare]
 */
export function DashboardHeader({
  selectedYear = "2024-2025",
  onYearChange,
  years = ["2025-2026","2024-2025", "2023-2024", "2022-2023"],
  onCompare,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-7">
      {/* SDO badge */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] text-white"
          style={{
            background: "linear-gradient(135deg, #4f7df5 0%, #6366f1 100%)",
            boxShadow: "0 3px 10px rgba(99,102,241,0.25)",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[0.9rem] font-bold text-slate-800 leading-tight tracking-[-0.01em]">
            SDO Baliwag
          </h2>
          <p className="text-[0.68rem] text-slate-400 font-medium">
            OneData Management System
          </p>
        </div>
      </div>

      {/* Year selector + Compare */}
      <div className="flex items-center gap-2.5">
        <div
          className="relative flex items-center gap-2 rounded-[10px] border border-slate-200/80 bg-white px-3.5 py-[7px] text-sm"
          style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
        >
          <span className="h-[6px] w-[6px] rounded-full bg-blue-500 shrink-0" />
          <select
            id="dashboard-year-select"
            value={selectedYear}
            onChange={(e) => onYearChange?.(e.target.value)}
            className="bg-transparent text-[0.78rem] font-semibold text-slate-700 outline-none cursor-pointer pr-4 appearance-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <svg className="h-3 w-3 text-slate-400 pointer-events-none absolute right-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
          </svg>
        </div>

        {onCompare && (
          <button
            id="dashboard-compare-btn"
            onClick={onCompare}
            className="flex items-center gap-1.5 rounded-[10px] border border-slate-200/80 bg-white px-3.5 py-[7px] text-[0.78rem] font-medium text-slate-500 transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-[0_2px_8px_rgba(99,102,241,0.1)] cursor-pointer"
            style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3h5v5" /><path d="M8 3H3v5" />
              <path d="M21 3l-7 7" /><path d="M3 3l7 7" />
              <path d="M16 21h5v-5" /><path d="M8 21H3v-5" />
              <path d="M21 21l-7-7" /><path d="M3 21l7-7" />
            </svg>
            Compare
          </button>
        )}
      </div>
    </div>
  );
}
