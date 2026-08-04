import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * DashboardAccordion — Collapsible section card for grouping related
 * dashboard content (Performance Indicators, CESPES, etc.).
 *
 * @param {React.ReactNode} icon           — colored icon element (top-left square)
 * @param {string}          title          — section title
 * @param {string}          [subtitle]     — description / category link text
 * @param {string}          [subtitleColor] — CSS color string for subtitle text
 * @param {React.ReactNode} [badge]        — optional right-side badge
 * @param {boolean}         [defaultOpen]  — start expanded?
 * @param {string}          [accentBg]     — CSS background for expanded body tint
 * @param {React.ReactNode} children
 */
export function DashboardAccordion({
  icon,
  title,
  subtitle,
  subtitleColor,
  badge,
  defaultOpen = false,
  accentBg,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-[14px] border border-slate-100/80 bg-white overflow-hidden transition-all duration-300 hover:shadow-[0_4px_20px_rgba(15,23,42,0.07)]"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
    >
      {/* ── Header — always visible ──────────────────────── */}
      <button
        id={`accordion-${title?.replace(/\s+/g, "-").toLowerCase()}`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-slate-50/40 cursor-pointer"
      >
        {/* Icon */}
        {icon && <div className="shrink-0">{icon}</div>}

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="text-[0.85rem] font-semibold text-slate-700 truncate">
            {title}
          </p>
          {subtitle && (
            <p
              className="text-[0.68rem] font-medium truncate mt-0.5"
              style={{ color: subtitleColor ?? "#94a3b8" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Optional badge */}
        {badge && <div className="shrink-0">{badge}</div>}

        {/* Chevron pill */}
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            open ? "rotate-180 bg-slate-100" : "bg-slate-50 hover:bg-slate-100"
          }`}
        >
          <ChevronDown size={13} strokeWidth={2.5} className="text-slate-500" />
        </div>
      </button>

      {/* ── Expandable body ──────────────────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          className="border-t border-slate-100/60 px-5 py-5"
          style={accentBg ? { background: accentBg } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
