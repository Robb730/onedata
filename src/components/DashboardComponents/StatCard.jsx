import React from "react";

/**
 * StatCard — KPI card with icon (top-left), trend badge (top-right),
 * large value, and uppercase label below.
 *
 * @param {string}          label       — e.g. "Total Enrollment"
 * @param {string}          value       — e.g. "44,948"
 * @param {React.ReactNode} icon        — Lucide icon element
 * @param {string}          iconColor   — Tailwind text-color class (fallback without gradient)
 * @param {string}          iconBg      — Tailwind bg class (fallback without gradient)
 * @param {string}          [gradient]  — CSS gradient string for icon circle background
 * @param {string}          [trend]     — e.g. "+2.3%"
 * @param {boolean}         [trendUp]   — true = green ↗, false = red ▼
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
}) {
  const iconClasses = gradient
    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform duration-300 group-hover:scale-105"
    : `flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105 ${iconBg} ${iconColor}`;

  return (
    <div
      className="group relative rounded-[16px] border border-slate-100/80 bg-white p-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-[2px]"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
    >
      {/* ── Top row: icon circle + trend badge ───────────── */}
      <div className="flex items-center justify-between mb-4">
        {/* Icon circle */}
        <div
          className={iconClasses}
          style={gradient ? { background: gradient } : undefined}
        >
          {icon}
        </div>

        {/* Trend badge */}
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[0.65rem] font-bold px-2 py-1 rounded-full ${
              trendUp
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-500"
            }`}
          >
            {trendUp ? "↗" : "▼"} {trend}
          </span>
        )}
      </div>

      {/* ── Value ─────────────────────────────────────────── */}
      <p className="text-[1.55rem] font-black text-slate-800 tracking-tight leading-none mb-1.5">
        {value}
      </p>

      {/* ── Label ─────────────────────────────────────────── */}
      <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.08em]">
        {label}
      </p>
    </div>
  );
}
