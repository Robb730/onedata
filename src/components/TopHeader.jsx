import React from "react";
import { Search, Bell, Menu, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

/**
 * TopHeader — Persistent top bar with search, notifications, and user profile.
 *
 * @param {string}   userName   — display name (e.g. "Juan Dela Cruz")
 * @param {string}   userRole   — e.g. "Administrator"
 * @param {string}   [userInitials] — avatar initials (auto-derived if omitted)
 * @param {function} onMenuToggle — hamburger click handler (mobile sidebar toggle)
 */
export function TopHeader({
  userName = "Juan Dela Cruz",
  userRole = "Administrator",
  userInitials,
  onMenuToggle,
  onLogout,
}) {
  const initials =
    userInitials ||
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-5 bg-white/90 backdrop-blur-xl px-6 py-2.5"
      style={{
        borderBottom: "1px solid rgba(203,213,225,0.45)",
        boxShadow: "0 1px 8px rgba(15,23,42,0.04)",
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all lg:hidden cursor-pointer"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Search bar */}
      <div className="relative flex-1 max-w-[480px]">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          id="global-search"
          type="text"
          placeholder="Search documents, users, files..."
          className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 py-[8px] pl-10 pr-4 text-[0.78rem] text-slate-700
                     placeholder:text-slate-400 outline-none transition-all duration-200
                     focus:border-blue-300/80 focus:bg-white focus:ring-[3px] focus:ring-blue-500/8"
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button
          id="notifications-btn"
          className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={17} strokeWidth={1.8} />
          {/* Badge dot */}
          <span className="absolute top-[7px] right-[7px] h-[7px] w-[7px] rounded-full bg-rose-500 ring-[2px] ring-white" />
        </button>

        {/* Divider */}
        <div className="h-7 w-px bg-slate-200/70 mx-1 hidden sm:block" />

        {/* User profile */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 cursor-pointer group hover:bg-slate-50 transition-all"
          >
            <div className="hidden sm:block text-right">
              <p className="text-[0.78rem] font-semibold text-slate-700 leading-tight group-hover:text-blue-600 transition-colors">
                {userName}
              </p>
              <p className="text-[0.62rem] font-medium text-slate-400">
                {userRole}
              </p>
            </div>
            <div
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-white text-[0.65rem] font-bold ring-[2.5px] ring-white"
              style={{
                background: "linear-gradient(135deg, #4f7df5 0%, #6366f1 100%)",
                boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
              }}
            >
              {initials}
            </div>
            {/* Dropdown chevron */}
            <svg
              className="h-3 w-3 text-slate-400 hidden sm:block"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          {/* Dropdown */}
        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white py-1 z-50"
            style={{
              border: "1px solid rgba(203,213,225,0.6)",
              boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
            }}
          >
            <button
              onClick={() => {
                setDropdownOpen(false);
                onLogout?.();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[0.78rem] font-medium text-rose-500 hover:bg-rose-50 transition-colors rounded-lg mx-auto"
            >
              <LogOut size={14} strokeWidth={2} />
              Logout
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
