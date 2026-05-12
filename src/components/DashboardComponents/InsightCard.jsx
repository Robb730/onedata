import React from "react";

/**
 * InsightCard — A small callout card highlighting a key insight
 * with an icon, message, and optional action.
 *
 * @param {React.ReactNode} icon
 * @param {string} title
 * @param {string} message
 * @param {string} [variant] — "info" | "success" | "warning" | "danger"
 */
export function InsightCard({
  icon,
  title,
  message,
  variant = "info",
}) {
  const variants = {
    info: {
      bg: "bg-blue-50/50",
      border: "border-blue-100/80",
      iconBg: "bg-blue-100/80 text-blue-600",
      title: "text-blue-800",
    },
    success: {
      bg: "bg-emerald-50/50",
      border: "border-emerald-100/80",
      iconBg: "bg-emerald-100/80 text-emerald-600",
      title: "text-emerald-800",
    },
    warning: {
      bg: "bg-amber-50/50",
      border: "border-amber-100/80",
      iconBg: "bg-amber-100/80 text-amber-600",
      title: "text-amber-800",
    },
    danger: {
      bg: "bg-rose-50/50",
      border: "border-rose-100/80",
      iconBg: "bg-rose-100/80 text-rose-600",
      title: "text-rose-800",
    },
  };

  const v = variants[variant] || variants.info;

  return (
    <div className={`flex gap-3 rounded-[10px] border ${v.border} ${v.bg} p-3.5`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${v.iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-[0.75rem] font-semibold ${v.title}`}>{title}</p>
        <p className="text-[0.7rem] text-slate-500 mt-0.5 leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}
