import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Upload,
  ScrollText,
  X,
} from "lucide-react";
import logo from "../assets/one-data-logo.png";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Repository", path: "/repository", icon: FolderOpen },
  { label: "Manage Users", path: "/manage-user", icon: Users },
  { label: "Upload Files", path: "/upload-files", icon: Upload },
  { label: "Audit Logs", path: "/audit-logs", icon: ScrollText },
];

/**
 * Sidebar — Left-side navigation panel.
 *
 * @param {boolean}  collapsed    — whether sidebar is collapsed (mobile)
 * @param {function} onToggle     — toggle collapsed state
 */
export function Sidebar({ collapsed = false, onToggle }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[3px] lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-screen w-[260px] flex-col bg-white
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${collapsed ? "-translate-x-full" : "translate-x-0"}
        `}
        style={{
          borderRight: "1px solid rgba(226,232,240,0.6)",
          boxShadow: "1px 0 12px rgba(15,23,42,0.03)",
        }}
      >
        {/* ── Logo header ─────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-7 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] bg-gradient-to-br from-blue-50 to-indigo-50/80 shadow-sm border border-blue-100/50">
              <img
                src={logo}
                alt="OneData"
                className="h-[32px] w-auto"
              />
            </div>
            <div className="leading-tight">
              <p className="text-[1.25rem] font-black text-slate-800 tracking-tight">
                OneData
              </p>
              <p className="text-[0.62rem] font-bold text-blue-600/90 tracking-[0.15em] uppercase mt-0.5">
                Admin Panel
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Section label ───────────────────────── */}
        <div className="px-6 pt-6 pb-2">
          <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.15em]">
            Main Menu
          </p>
        </div>

        {/* ── Nav links ───────────────────────────── */}
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  group flex items-center gap-3.5 rounded-[12px] px-4 py-[11px] text-[0.85rem]
                  transition-all duration-200 relative
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 text-blue-600 font-semibold"
                      : "text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-700"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-full bg-blue-500" />
                )}

                <item.icon
                  size={19}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? "text-blue-500"
                      : "text-slate-400 group-hover:text-slate-500"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── Bottom ──────────────────────────────── */}
        <div className="px-4 pb-5 pt-3">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-3" />
          <p className="text-[0.55rem] text-slate-300 text-center tracking-wider">
            OneData v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
