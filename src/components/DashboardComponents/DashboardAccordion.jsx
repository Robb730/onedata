import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * DashboardAccordion — Collapsible section for grouping related
 * dashboard content (e.g. Performance Indicators, CESPES, etc.).
 *
 * @param {React.ReactNode} icon      — colored icon element
 * @param {string}          title     — section title
 * @param {string}          subtitle  — description text
 * @param {React.ReactNode} badge     — optional right-side badge
 * @param {boolean}         [defaultOpen] — start expanded?
 * @param {React.ReactNode} children
 */
export function DashboardAccordion({
  icon,
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-[14px] border border-slate-100/80 bg-white overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
    >
      {/* Header — clickable */}
      <button
        id={`accordion-${title?.replace(/\s+/g, "-").toLowerCase()}`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50/50 cursor-pointer"
      >
        {/* Icon */}
        {icon && (
          <div className="shrink-0">
            {icon}
          </div>
        )}

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="text-[0.82rem] font-semibold text-slate-700 truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-[0.68rem] text-slate-400 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Badge */}
        {badge && <div className="shrink-0">{badge}</div>}

        {/* Chevron */}
        <ChevronDown
          size={15}
          strokeWidth={2}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-slate-100/60 px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
