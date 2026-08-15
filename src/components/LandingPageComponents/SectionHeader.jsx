import React from "react";

/**
 * SectionHeader — Reusable section heading with a top label,
 * title, and optional subtitle. Used across all landing sections.
 */
export function SectionHeader({ label, title, subtitle, align = "center" }) {
  const centered = align === "center";

  return (
    <div
      className={`mb-5 md:mb-12 ${
        centered ? "text-left md:text-center md:max-w-[600px] md:mx-auto" : "text-left"
      }`}
    >
      {label && (
        <div
          className={`flex items-center gap-2 mb-2.5 md:mb-4 ${
            centered ? "justify-start md:justify-center" : "justify-start"
          }`}
        >
          <div className="h-px w-5 md:w-6 bg-gradient-to-r from-transparent to-blue-300" />
          <span className="text-[0.6rem] md:text-[0.65rem] font-bold text-blue-500 uppercase tracking-[0.16em]">
            {label}
          </span>
          <div className="h-px w-5 md:w-6 bg-gradient-to-l from-transparent to-blue-300" />
        </div>
      )}
      {title && (
        <h2 className="text-[1.28rem] md:text-[2.4rem] font-black text-slate-800 tracking-tight leading-tight">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-[0.78rem] md:text-[0.92rem] text-slate-400 mt-1.5 md:mt-3 leading-relaxed font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
