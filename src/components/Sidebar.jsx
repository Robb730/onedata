import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Users,
  Upload,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarRange,
} from "lucide-react";
import iconSvg from "../assets/one_data-icon-v3.svg";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Repository", path: "/repository", icon: Database },
  { label: "Manage Users", path: "/manage-user", icon: Users },
  { label: "Upload Files", path: "/upload-files", icon: Upload },
  { label: "Audit Logs", path: "/audit-logs", icon: ClipboardList },
  { label: "School Year", path: "/school-year", icon: CalendarRange },
];

/**
 * Sidebar — Desktop collapsible navigation. Hidden on mobile
 * in favor of MobileBottomNav.
 */
export function Sidebar({ collapsed = false, onToggle }) {
  const location = useLocation();

  return (
    <aside
      className={`
        hidden lg:flex h-screen flex-col bg-white shrink-0
        transition-[width] duration-300 ease-in-out
        ${collapsed ? "w-[68px]" : "w-[240px]"}
      `}
      style={{
        borderRight: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "1px 0 20px rgba(15,23,42,0.04)",
      }}
    >
      <div
        className={`flex items-center gap-3 pt-6 pb-6 ${
          collapsed ? "justify-center px-0" : "px-5"
        }`}
      >
        <img
          src={iconSvg}
          alt="OneData"
          className={`shrink-0 ${collapsed ? "h-8 w-8" : "h-9 w-9"}`}
        />

        {!collapsed && (
          <div className="overflow-hidden leading-none">
            <p className="text-[1.05rem] font-black text-slate-800 tracking-tight">
              OneData
            </p>
            <p className="mt-0.5 text-[0.62rem] font-semibold text-slate-400 tracking-[0.06em]">
              Admin Panel
            </p>
          </div>
        )}
      </div>

      <div className="mx-4 h-px bg-slate-100" />

      {!collapsed && (
        <div className="px-5 pt-5 pb-1.5">
          <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-slate-400">
            Navigation
          </p>
        </div>
      )}

      <nav className={`flex-1 py-2 space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`
                group relative flex items-center rounded-[10px]
                transition-all duration-200
                ${collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5"}
                ${isActive
                  ? "bg-blue-50 shadow-[0_1px_4px_rgba(59,130,246,0.12)]"
                  : "hover:bg-slate-50"
                }
              `}
            >
              {isActive && !collapsed && (
                <span className="absolute left-0 top-[8px] bottom-[8px] w-[3px] rounded-full bg-blue-500" />
              )}

              <div
                className={`flex shrink-0 items-center justify-center transition-all duration-200 ${
                  collapsed ? "h-9 w-9 rounded-[10px]" : ""
                } ${
                  isActive && collapsed
                    ? "bg-blue-100"
                    : collapsed
                      ? "group-hover:bg-slate-100"
                      : ""
                }`}
              >
                <item.icon
                  size={17}
                  strokeWidth={isActive ? 2.1 : 1.6}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-blue-500"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
              </div>

              {!collapsed && (
                <span
                  className={`flex-1 text-[0.82rem] transition-colors duration-200 ${
                    isActive
                      ? "font-semibold text-blue-600"
                      : "font-medium text-slate-500 group-hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </span>
              )}

              {isActive && !collapsed && (
                <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-blue-400 opacity-80" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="mx-4 h-px bg-slate-100 mb-2" />
        <button
          id="sidebar-collapse-btn"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : undefined}
          className={`
            group flex w-full items-center gap-3 py-3.5 mb-2
            transition-all duration-200 cursor-pointer
            hover:bg-slate-50
            ${collapsed ? "justify-center px-0" : "px-4"}
          `}
        >
          {collapsed ? (
            <PanelLeftOpen
              size={16}
              strokeWidth={1.7}
              className="shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors"
            />
          ) : (
            <>
              <PanelLeftClose
                size={16}
                strokeWidth={1.7}
                className="shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors"
              />
              <span className="text-[0.8rem] font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                Collapse
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
