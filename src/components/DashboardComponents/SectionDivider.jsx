import React from "react";

/**
 * SectionDivider — Thin horizontal divider with optional centered label.
 * Used to separate dashboard sections visually.
 */
export function SectionDivider({ label }) {
  if (!label) {
    return <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent my-5" />;
  }
  return (
    <div className="flex items-center gap-4 my-5">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-slate-300 whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200/60 to-transparent" />
    </div>
  );
}
