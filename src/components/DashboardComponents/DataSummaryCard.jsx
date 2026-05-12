import React from "react";

/**
 * DataSummaryCard — A card displaying a single metric with
 * a colored accent bar on the left.
 *
 * @param {string} label  — e.g. "Public"
 * @param {string} value  — e.g. "27,646"
 * @param {string} [accent] — hex color for the left bar
 */
export function DataSummaryCard({
  label,
  value,
  accent = "#4f7df5",
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-[12px] border border-slate-100/80 bg-white px-5 py-4 overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: accent }}
      />

      <span className="text-[1.2rem] font-bold leading-tight tracking-tight" style={{ color: accent }}>
        {value}
      </span>
      <span className="text-[0.62rem] font-semibold text-slate-400 mt-1 uppercase tracking-[0.08em]">
        {label}
      </span>
    </div>
  );
}
