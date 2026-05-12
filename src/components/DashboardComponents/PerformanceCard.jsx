import React from "react";

/**
 * PerformanceCard — Wrapper card for the performance indicators section
 * showing enrollment summary and rate breakdowns.
 *
 * @param {React.ReactNode} children
 * @param {string}          [className]
 */
export function PerformanceCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[14px] border border-slate-100/80 bg-white p-5 transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] ${className}`}
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
    >
      {children}
    </div>
  );
}
