import React from "react";

/**
 * MetricProgress — A labeled row showing a metric name, its value,
 * a count (optional), and a horizontal progress bar.
 *
 * @param {string} label    — e.g. "Elementary"
 * @param {number} value    — percentage value (0-100)
 * @param {string} display  — formatted display string (e.g. "0.82%")
 * @param {string} [count]  — raw count (e.g. "(150)")
 * @param {string} [color]  — Tailwind bg color class for the bar
 * @param {string} [note]   — extra note (e.g. "See Elementary")
 */
export function MetricProgress({
  label,
  value = 0,
  display,
  count,
  color = "bg-blue-500",
  note,
}) {
  // Clamp for visual width — scale small percentages for visibility
  const barWidth = Math.max(Math.min(value, 100), 2);

  return (
    <div className="group py-3 px-4 rounded-[10px] hover:bg-slate-50/60 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[0.8rem] font-medium text-slate-600 truncate">
            {label}
          </span>
          {note && (
            <span className="text-[0.65rem] text-blue-400/80 italic shrink-0">
              {note}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 shrink-0 ml-3">
          <span className="text-[0.82rem] font-bold text-slate-700">
            {display}
          </span>
          {count && (
            <span className="text-[0.65rem] text-slate-400">({count})</span>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-[4px] w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
