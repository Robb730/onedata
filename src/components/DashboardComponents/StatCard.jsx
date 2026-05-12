import React from "react";

/**
 * StatCard — Compact metric card displaying a single KPI.
 *
 * @param {string}  label     — e.g. "Total Enrollment"
 * @param {string}  value     — e.g. "41,215"
 * @param {React.ReactNode} icon — Lucide icon element
 * @param {string}  iconColor — Tailwind text-color class (e.g. "text-blue-500")
 * @param {string}  iconBg    — Tailwind bg class for the icon circle
 * @param {string}  [trend]   — e.g. "+2.3%"
 * @param {boolean} [trendUp] — true = green up, false = red down
 */
export function StatCard({
  label,
  value,
  icon,
  iconColor = "text-blue-500",
  iconBg = "bg-blue-50",
  trend,
  trendUp = true,
}) {
  return (
    <div
      className="group relative flex items-center gap-4 rounded-[14px] border border-slate-100/80 bg-white px-5 py-[14px] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:-translate-y-[1px]"
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
    >
      {/* Icon */}
      <div
        className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] ${iconBg} ${iconColor} transition-transform duration-300 group-hover:scale-105`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-[0.06em] truncate">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-[1.3rem] font-bold text-slate-800 leading-tight tracking-tight">
            {value}
          </span>
          {trend && (
            <span
              className={`text-[0.65rem] font-semibold ${
                trendUp ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
