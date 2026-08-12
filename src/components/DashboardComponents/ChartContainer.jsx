import React from "react";

/**
 * ChartContainer — Reusable wrapper for Recharts visualizations.
 * Provides consistent card styling, title, subtitle, optional
 * action area (e.g. toggles), and annotation note.
 */
export function ChartContainer({
  title,
  subtitle,
  actions,
  annotation,
  children,
  className = "",
  minHeight = "280px",
}) {
  return (
    <div
      className={`rounded-[14px] border border-slate-100/80 bg-white p-4 sm:p-5 transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] ${className}`}
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
    >
      {/* Header row */}
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            {title && (
              <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {/* Chart area */}
      <div style={{ minHeight }}>{children}</div>

      {/* Annotation */}
      {annotation && (
        <p className="mt-3 text-[0.65rem] text-slate-400 italic text-right">
          {annotation}
        </p>
      )}
    </div>
  );
}
