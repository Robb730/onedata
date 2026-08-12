import React from "react";

/**
 * StatCard — KPI card with icon (top-left), trend badge (top-right),
 * large value, uppercase label below, and an optional compare line.
 *
 * @param {string}          label         — e.g. "Total Enrollment"
 * @param {string}          value         — e.g. "44,948"
 * @param {React.ReactNode} icon          — Lucide icon element
 * @param {string}          iconColor     — Tailwind text-color class (fallback without gradient)
 * @param {string}          iconBg        — Tailwind bg class (fallback without gradient)
 * @param {string}          [gradient]    — CSS gradient string for icon circle background
 * @param {string}          [trend]       — e.g. "+2.3%" (hidden while comparing)
 * @param {boolean}         [trendUp]     — true = green ↗, false = red ▼
 * @param {string}          [compareValue] — e.g. "42,110" or "N/A" — the compare year's value
 * @param {string}          [delta]       — e.g. "2,838" — absolute difference, pre-formatted
 * @param {boolean}         [deltaUp]     — true = compare year is higher (emerald), false = lower (rose)
 */
export function StatCard({
  label,
  value,
  icon,
  iconColor = "text-blue-500",
  iconBg = "bg-blue-50",
  gradient,
  trend,
  trendUp = true,
  compareValue,
  delta,
  deltaUp = true,
}) {
  const isComparing = compareValue !== undefined && compareValue !== null;

  const iconClasses = gradient
    ? "flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform duration-300 group-hover:scale-105"
    : `flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105 ${iconBg} ${iconColor}`;

  return (
    <div
      className="group relative rounded-[16px] border border-slate-100/80 bg-white p-4 sm:p-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-[2px]"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
    >
      {/* ── Top row: icon circle + trend badge ───────────── */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        {/* Icon circle */}
        <div
          className={iconClasses}
          style={gradient ? { background: gradient } : undefined}
        >
          {icon}
        </div>

        {/* Trend badge — suppressed while comparing so it doesn't
            compete visually with the compare delta chip below */}
        {trend && !isComparing && (
          <span
            className={`inline-flex items-center gap-0.5 text-[0.65rem] font-bold px-2 py-1 rounded-full ${trendUp
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-500"
              }`}
          >
            {trendUp ? "↗" : "▼"} {trend}
          </span>
        )}

        {isComparing && (
          <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-400">
            <span className="h-[5px] w-[5px] rounded-full bg-blue-500" />
            vs
            <span className="h-[5px] w-[5px] rounded-full bg-orange-500" />
          </span>
        )}
      </div>

      {/* ── Value ─────────────────────────────────────────── */}
      <p
        className={`font-black text-slate-800 tracking-tight leading-none mb-1.5 ${isComparing ? "text-[1.15rem] sm:text-[1.3rem]" : "text-[1.25rem] sm:text-[1.55rem]"
          }`}
      >
        {value}
      </p>

      {/* ── Label ─────────────────────────────────────────── */}
      <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.08em]">
        {label}
      </p>

      {/* ── Compare line ──────────────────────────────────── */}
      {isComparing && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[0.78rem] font-bold text-orange-600 tabular-nums">
            <span className="h-[6px] w-[6px] rounded-full bg-orange-500 shrink-0" />
            {compareValue}
          </span>

          {delta !== null && delta !== undefined && (
            <span
              className={`flex items-center gap-0.5 text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${deltaUp
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-500"
                }`}
            >
              {deltaUp ? "↗" : "↘"} {delta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}