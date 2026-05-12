import React from "react";

/**
 * DashboardGrid — Responsive CSS grid wrapper.
 *
 * @param {number} [cols]     — desktop column count (default 2)
 * @param {string} [gap]      — Tailwind gap class (default "gap-4")
 * @param {React.ReactNode} children
 */
export function DashboardGrid({ cols = 2, gap = "gap-4", children, className = "" }) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols] || "grid-cols-1 lg:grid-cols-2";

  return (
    <div className={`grid ${colClass} ${gap} ${className}`}>
      {children}
    </div>
  );
}
