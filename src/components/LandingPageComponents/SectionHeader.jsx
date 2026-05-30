import React from "react";

/**
 * SectionHeader — Reusable section heading with a top label,
 * title, and optional subtitle. Used across all landing sections.
 */
export function SectionHeader({ label, title, subtitle, align = "center" }) {
  const alignClass =
    align === "left" ? "text-left" : "text-center max-w-[600px] mx-auto";

  return (
    <div className={`mb-12 ${alignClass}`}>
      {label && (
        <div className="flex items-center gap-2 mb-4 justify-center">
          <div className="h-px w-6 bg-gradient-to-r from-transparent to-blue-300" />
          <span className="text-[0.65rem] font-bold text-blue-500 uppercase tracking-[0.18em]">
            {label}
          </span>
          <div className="h-px w-6 bg-gradient-to-l from-transparent to-blue-300" />
        </div>
      )}
      {title && (
        <h2 className="text-[2rem] md:text-[2.4rem] font-black text-slate-800 tracking-tight leading-tight">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-[0.92rem] text-slate-400 mt-3 leading-relaxed font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
