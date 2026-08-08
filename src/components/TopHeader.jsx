import React from "react";
import { Search, Bell, Menu, LogOut, FolderOpen, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
// Adjust this relative path to match TopHeader's location in your tree
// (this mirrors the import used in ManageUsers.jsx).
import { useUser } from "../contexts/UserContext.jsx";

/**
 * TopHeader — Persistent top bar with search, notifications, and user profile.
 *
 * @param {string}   userName     — display name (e.g. "Juan Dela Cruz")
 * @param {string}   userRole     — raw role key, e.g. "division_focal" | "section_focal" | "section_personnel"
 * @param {string}   [userSection] — e.g. "Records Section"
 * @param {string}   [userDivision] — e.g. "Records Management Division"
 * @param {string}   [userInitials] — avatar initials (auto-derived if omitted)
 * @param {function} onMenuToggle — hamburger click handler (mobile sidebar toggle)
 * @param {function} onLogout
 */

// Maps internal role keys to their human-readable display labels.
// Kept in sync with roleDisplayMap in ManageUsers.
const ROLE_LABELS = {
  division_focal: "Division Focal Person",
  section_focal: "Section Officer",
  section_personnel: "Section Personnel",
  administrator: "Administrator",
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

// Division focals are scoped to a division; section focals/personnel are
// scoped to a section. Administrators aren't scoped to either, so this
// returns null for them (and whenever the relevant value is missing/"—").
function getScopeLabel(role, section, division) {
  const clean = (v) => (v && v !== "—" ? v : null);
  if (role === "division_focal") return clean(division);
  if (role === "section_focal" || role === "section_personnel") return clean(section);
  return null;
}

// "Records Management Division" -> "RMD". Used to keep long office names
// from blowing out the compact header / dropdown pill widths.
const ACRONYM_STOPWORDS = new Set(["of", "the", "and"]);

function toAcronym(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !ACRONYM_STOPWORDS.has(word.toLowerCase()))
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

// Swaps in the acronym once a name passes maxLen, but always keeps the
// full name around (via the `full` field) so callers can put it in a
// `title` attribute — hovering the abbreviation reveals the whole name.
function abbreviate(name, maxLen = 22) {
  if (!name) return { display: name, full: name };
  return {
    display: name.length > maxLen ? toAcronym(name) : name,
    full: name,
  };
}

export function TopHeader({
  userName,
  userRole,
  userSection,
  userDivision,
  userInitials,
  onMenuToggle,
  onLogout,
}) {
  const { userProfile } = useUser();

  // Props win if explicitly passed; otherwise fall back to the logged-in
  // user's own profile from context — so TopHeader "just works" wherever
  // it's rendered without every page having to thread these props through.
  const resolvedName = userName ?? userProfile?.full_name ?? "Juan Dela Cruz";
  const resolvedRole = userRole ?? userProfile?.role ?? "Administrator";
  // userProfile.division / userProfile.section come from UserContext's
  // `division:divisions(name)` / `section:sections(name)` embed — each is
  // an object like { name: "..." } (or null if that FK isn't set for this
  // user's role), so pull .name back out into the flat strings the rest
  // of this component expects.
  const resolvedDivision = userDivision ?? userProfile?.division?.name ?? null;
  const resolvedSection = userSection ?? userProfile?.section?.name ?? null;

  const initials =
    userInitials ||
    resolvedName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const roleLabel = getRoleLabel(resolvedRole);
  const scopeLabel = getScopeLabel(resolvedRole, resolvedSection, resolvedDivision);
  const scopeAbbr = abbreviate(scopeLabel, 20);
  // The dropdown card has more breathing room than the compact header pill,
  // so it gets a slightly longer threshold before falling back to initials.
  const divisionAbbr = abbreviate(resolvedDivision, 30);
  const sectionAbbr = abbreviate(resolvedSection, 22);

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
            <div className="hidden sm:block text-right max-w-[220px]">
              <p className="text-[0.78rem] font-semibold text-slate-700 leading-tight truncate group-hover:text-blue-600 transition-colors">
                {resolvedName}
              </p>
              <p className="text-[0.62rem] font-medium text-slate-400 leading-tight truncate">
                {roleLabel}
                {scopeLabel && (
                  <>
                    {" "}
                    <span className="text-slate-300">·</span>{" "}
                    <span
                      className="text-indigo-500 font-semibold"
                      title={scopeAbbr.display !== scopeAbbr.full ? scopeAbbr.full : undefined}
                    >
                      {scopeAbbr.display}
                    </span>
                  </>
                )}
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

          {/* Dropdown / profile details card */}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white py-1 z-50 overflow-hidden"
              style={{
                border: "1px solid rgba(203,213,225,0.6)",
                boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
              }}
            >
              {/* Header block — mirrors the "manage users" user card layout */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-[0.7rem] font-bold ring-[2.5px] ring-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #4f7df5 0%, #6366f1 100%)",
                    boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                  }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[0.82rem] font-semibold text-slate-700 leading-tight">
                    {resolvedName}
                  </p>
                  <span
                    className="mt-0.5 inline-block rounded-full px-2 py-[1px] text-[0.62rem] font-semibold"
                    style={{
                      color: "#4f46e5",
                      background: "rgba(99,102,241,0.10)",
                    }}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Division / Section — same card treatment used in ManageUsers,
                  showing the specific division/section this user belongs to */}
              {resolvedDivision && resolvedDivision !== "—" && (
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-3">
                    <div className="flex items-center gap-1.5">
                      <FolderOpen size={13} className="text-indigo-500 shrink-0" />
                      <p
                        className="text-[0.72rem] font-bold text-slate-800 leading-snug truncate"
                        title={
                          divisionAbbr.display !== divisionAbbr.full ? divisionAbbr.full : undefined
                        }
                      >
                        {divisionAbbr.display}
                      </p>
                    </div>
                    {/* Section is only meaningful for section-scoped roles */}
                    {resolvedRole !== "division_focal" &&
                      resolvedSection &&
                      resolvedSection !== "—" && (
                        <div className="flex items-center gap-1 mt-1.5 ml-0.5">
                          <div className="w-1 h-1 rounded-full bg-indigo-300 shrink-0" />
                          <span
                            className="inline-block text-[10.5px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200 truncate"
                            title={
                              sectionAbbr.display !== sectionAbbr.full ? sectionAbbr.full : undefined
                            }
                          >
                            {sectionAbbr.display}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    // Settings workflow to be implemented
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[0.78rem] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Settings size={14} strokeWidth={2} />
                  Settings
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout?.();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[0.78rem] font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                >
                <LogOut size={14} strokeWidth={2} />
                Logout
              </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}