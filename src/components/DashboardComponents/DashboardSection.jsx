import React from "react";

/**
 * DashboardSection — A simple titled wrapper for grouping dashboard content.
 *
 * @param {string}          title
 * @param {string}          [subtitle]
 * @param {React.ReactNode} [actions]   — right-side controls
 * @param {React.ReactNode} children
 */
export function DashboardSection({ title, subtitle, actions, children }) {
  return (
    <div className="space-y-4">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-[1.1rem] font-bold text-slate-800 tracking-[-0.01em]">{title}</h2>
            )}
            {subtitle && (
              <p className="text-[0.72rem] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
