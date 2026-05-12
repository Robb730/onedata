import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * TrendCard — A card showing a metric with its trend direction and change.
 *
 * @param {string} label
 * @param {string} value
 * @param {string} [change]  — e.g. "-0.15%"
 * @param {"up"|"down"|"flat"} [direction]
 * @param {string} [period]  — e.g. "vs. last year"
 */
export function TrendCard({
  label,
  value,
  change,
  direction = "flat",
  period,
}) {
  const iconMap = {
    up: <TrendingUp size={13} />,
    down: <TrendingDown size={13} />,
    flat: <Minus size={13} />,
  };
  const colorMap = {
    up: "text-emerald-500 bg-emerald-50",
    down: "text-rose-500 bg-rose-50",
    flat: "text-slate-500 bg-slate-100",
  };

  return (
    <div
      className="rounded-[14px] border border-slate-100/80 bg-white p-5 transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
    >
      <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-[0.06em] mb-2">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <span className="text-[1.4rem] font-bold text-slate-800 tracking-tight">{value}</span>
        {change && (
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${colorMap[direction]}`}
            >
              {iconMap[direction]}
              {change}
            </span>
          </div>
        )}
      </div>
      {period && (
        <p className="text-[0.62rem] text-slate-400 mt-1.5">{period}</p>
      )}
    </div>
  );
}
