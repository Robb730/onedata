import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Users,
  Upload,
  ClipboardList,
  CalendarRange,
  MoreHorizontal,
  X,
  LayoutTemplate,
} from "lucide-react";
import { useUser } from "../contexts/UserContext"; // adjust path as needed
import { ROLES } from "../utils/accessControl"; // adjust path to wherever ROLES lives

const primaryItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN, ROLES.DIVISION_FOCAL, ROLES.SECTION_FOCAL, ROLES.PERSONNEL],
  },
  {
    label: "Repository",
    path: "/repository",
    icon: Database,
    roles: [ROLES.ADMIN, ROLES.DIVISION_FOCAL, ROLES.SECTION_FOCAL, ROLES.PERSONNEL],
  },
  {
    label: "Upload",
    path: "/upload-files",
    icon: Upload,
    roles: [ROLES.ADMIN, ROLES.DIVISION_FOCAL, ROLES.SECTION_FOCAL, ROLES.PERSONNEL],
  },
  {
    label: "Users",
    path: "/manage-user",
    icon: Users,
    roles: [ROLES.ADMIN],
  },
];

const moreItems = [
  {
    label: "Audit Logs",
    path: "/audit-logs",
    icon: ClipboardList,
    roles: [ROLES.ADMIN],
  },
  {
    label: "School Year",
    path: "/school-year",
    icon: CalendarRange,
    roles: [ROLES.ADMIN],
  },
  {
    label: "Templates",
    path: "/templates",
    icon: LayoutTemplate,
    roles: [ROLES.ADMIN],
  },
];

function isPathActive(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

const ROUTE_PRELOADERS = {
  "/dashboard": () => import("../pages/Dashboard/Dashboard.jsx"),
  "/repository": () => import("../pages/Repository/Repository.jsx"),
  "/upload-files": () => import("../pages/UploadFiles/UploadFilesPage.jsx"),
  "/manage-user": () => import("../pages/ManageUsers/ManageUsers.jsx"),
  "/audit-logs": () => import("../pages/AuditLogs/AuditLogs.jsx"),
  "/school-year": () => import("../pages/SchoolYear/SchoolYearPage.jsx"),
  "/templates": () => import("../pages/Templates/TemplatesPage.jsx"),
};

function preloadRoute(path) {
  ROUTE_PRELOADERS[path]?.();
}

function NavItem({ item, active, onClick }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      onPointerEnter={() => preloadRoute(item.path)}
      onTouchStart={() => preloadRoute(item.path)}
      className="relative z-10 flex h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-full px-1 no-underline"
    >
      <span className="inline-flex">
        <item.icon
          size={18}
          strokeWidth={active ? 2.45 : 1.7}
          className={`transition-colors duration-300 ${
            active ? "text-blue-600" : "text-slate-400"
          }`}
        />
      </span>
      <span
        className={`max-w-full truncate text-[0.56rem] leading-none transition-colors duration-300 ${
          active ? "font-semibold text-blue-600" : "font-medium text-slate-400"
        }`}
      >
        {item.label}
      </span>
    </NavLink>
  );
}

export function MobileBottomNav({ visible = true }) {
  const location = useLocation();
  const { userProfile } = useUser();
  const [moreOpen, setMoreOpen] = useState(false);

  const visiblePrimaryItems = useMemo(
    () => primaryItems.filter((item) => item.roles.includes(userProfile?.role)),
    [userProfile?.role],
  );
  const visibleMoreItems = useMemo(
    () => moreItems.filter((item) => item.roles.includes(userProfile?.role)),
    [userProfile?.role],
  );

  const moreActive = visibleMoreItems.some((item) =>
    isPathActive(location.pathname, item.path),
  );
  const moreHighlighted = moreActive || moreOpen;

  const hasMore = visibleMoreItems.length > 0;
  const colCount = visiblePrimaryItems.length + (hasMore ? 1 : 0);

  const activeIndex = useMemo(() => {
    if (moreHighlighted) return visiblePrimaryItems.length;
    const idx = visiblePrimaryItems.findIndex((item) =>
      isPathActive(location.pathname, item.path),
    );
    return idx >= 0 ? idx : 0;
  }, [location.pathname, moreHighlighted, visiblePrimaryItems]);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  return (
    <>
      {moreOpen && (
        <div
          className="lg:hidden more-scrim-in pointer-events-auto fixed inset-0 z-[70] bg-slate-900/25"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav
        className={`mobile-bottom-nav lg:hidden pointer-events-none fixed inset-x-0 bottom-0 z-[80] bg-transparent px-4 ${
          visible ? "" : "invisible"
        }`}
        aria-hidden={!visible}
      >
        <div className="pointer-events-auto relative mx-auto w-full max-w-md overflow-visible">
          {hasMore && moreOpen && (
            <div className="absolute bottom-full left-0 right-0 z-10 mb-3 more-panel-in">
              <div className="liquid-glass-panel overflow-hidden rounded-[22px] px-3 pt-3 pb-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[0.82rem] font-bold text-slate-800">More</p>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/60"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {visibleMoreItems.map((item, index) => {
                    const active = isPathActive(location.pathname, item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMoreOpen(false)}
                        onPointerEnter={() => preloadRoute(item.path)}
                        onTouchStart={() => preloadRoute(item.path)}
                        className={`more-tile-in flex min-w-0 items-center gap-2 rounded-2xl border px-2.5 py-2.5 no-underline transition-colors ${
                          active
                            ? "border-blue-200/70 bg-blue-50/80"
                            : "border-white/50 bg-white/45 hover:bg-white/70"
                        }`}
                        style={{ animationDelay: `${80 + index * 55}ms` }}
                      >
                        <item.icon
                          size={16}
                          className={`shrink-0 ${active ? "text-blue-600" : "text-slate-500"}`}
                        />
                        <span
                          className={`min-w-0 truncate text-[0.72rem] font-semibold ${
                            active ? "text-blue-700" : "text-slate-700"
                          }`}
                        >
                          {item.label}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Liquid glass tab bar */}
          <div
            className="liquid-glass-bar relative grid h-[64px] items-center rounded-full bg-white/10 px-1 backdrop-blur-xl backdrop-saturate-150"
            style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
          >
            {/* Sliding spring pill — `left`, not transform, so backdrop-filter stays valid */}
            <div
              aria-hidden
              className="liquid-glass-pill pointer-events-none absolute top-1.5 bottom-1.5 z-[2] rounded-full bg-white/20"
              style={{
                width: `calc((100% - 0.5rem) / ${colCount})`,
                left: `calc(0.25rem + ${activeIndex} * ((100% - 0.5rem) / ${colCount}))`,
              }}
            />

            {visiblePrimaryItems.map((item) => (
              <div key={item.path} className="relative z-10 px-0.5">
                <NavItem
                  item={item}
                  active={
                    !moreHighlighted &&
                    isPathActive(location.pathname, item.path)
                  }
                  onClick={() => setMoreOpen(false)}
                />
              </div>
            ))}

            {hasMore && (
              <div className="relative z-10 px-0.5">
                <button
                  type="button"
                  onClick={() => setMoreOpen((open) => !open)}
                  className="relative z-10 flex h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-full border-none bg-transparent cursor-pointer"
                  aria-expanded={moreOpen}
                  aria-label="More"
                >
                  <MoreHorizontal
                    size={18}
                    strokeWidth={moreHighlighted ? 2.45 : 1.7}
                    className={`transition-colors duration-300 ${
                      moreHighlighted ? "text-blue-600" : "text-slate-400"
                    }`}
                  />
                  <span
                    className={`text-[0.56rem] leading-none transition-colors duration-300 ${
                      moreHighlighted
                        ? "font-semibold text-blue-600"
                        : "font-medium text-slate-400"
                    }`}
                  >
                    More
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}