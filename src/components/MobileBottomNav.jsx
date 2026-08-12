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
} from "lucide-react";

const primaryItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Repository", path: "/repository", icon: Database },
  { label: "Upload", path: "/upload-files", icon: Upload },
  { label: "Users", path: "/manage-user", icon: Users },
];

const moreItems = [
  { label: "Audit Logs", path: "/audit-logs", icon: ClipboardList },
  { label: "School Year", path: "/school-year", icon: CalendarRange },
];

function isPathActive(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavItem({ item, active, onClick, bounceKey }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className="relative z-10 flex h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-full px-1 no-underline"
    >
      <span
        key={active ? bounceKey : undefined}
        className={active ? "nav-icon-bounce inline-flex" : "inline-flex"}
      >
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

export function MobileBottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) =>
    isPathActive(location.pathname, item.path),
  );
  const moreHighlighted = moreActive || moreOpen;

  const activeIndex = useMemo(() => {
    if (moreHighlighted) return 4;
    const idx = primaryItems.findIndex((item) =>
      isPathActive(location.pathname, item.path),
    );
    return idx >= 0 ? idx : 0;
  }, [location.pathname, moreHighlighted]);

  const [bounceKey, setBounceKey] = useState(0);

  useEffect(() => {
    setBounceKey((k) => k + 1);
  }, [activeIndex]);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) {
      document.body.style.overflow = "";
      return undefined;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  return (
    <>
      {/* Dim page only — stops above the floating nav */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-200 ${
          moreOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        onClick={() => setMoreOpen(false)}
        aria-hidden={!moreOpen}
      >
        <div className="absolute inset-0 bg-slate-900/25" />
      </div>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4"
        style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
      >
        <div className="relative mx-auto max-w-md">
          {/* More menu */}
          <div
            className={`absolute bottom-full left-0 right-0 mb-3 origin-bottom transition-all duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
              moreOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-3 scale-95 opacity-0"
            }`}
          >
            <div className="liquid-glass-panel rounded-[22px] px-4 pt-3 pb-4">
              <div className="mb-3 flex items-center justify-between">
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
                {moreItems.map((item) => {
                  const active = isPathActive(location.pathname, item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 no-underline transition-colors ${
                        active
                          ? "border-blue-200/70 bg-blue-50/80"
                          : "border-white/50 bg-white/45 hover:bg-white/70"
                      }`}
                    >
                      <item.icon
                        size={18}
                        className={active ? "text-blue-600" : "text-slate-500"}
                      />
                      <span
                        className={`text-[0.8rem] font-semibold ${
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

          {/* Liquid glass tab bar */}
          <div className="liquid-glass-bar relative grid h-[64px] grid-cols-5 items-center rounded-full px-1">
            {/* Specular highlight */}
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/50 via-white/10 to-transparent" />

            {/* Sliding spring pill */}
            <div
              aria-hidden
              className="liquid-glass-pill pointer-events-none absolute top-1.5 bottom-1.5 z-0 rounded-full"
              style={{
                width: "calc((100% - 0.5rem) / 5)",
                left: "0.25rem",
                transform: `translateX(calc(${activeIndex} * 100%))`,
              }}
            />

            {primaryItems.map((item) => (
              <div key={item.path} className="relative z-10 px-0.5">
                <NavItem
                  item={item}
                  active={
                    !moreHighlighted &&
                    isPathActive(location.pathname, item.path)
                  }
                  bounceKey={bounceKey}
                  onClick={() => setMoreOpen(false)}
                />
              </div>
            ))}

            <div className="relative z-10 px-0.5">
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                className="relative z-10 flex h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-full border-none bg-transparent cursor-pointer"
                aria-expanded={moreOpen}
                aria-label="More"
              >
                <MoreHorizontal
                  key={moreHighlighted ? bounceKey : "more-idle"}
                  size={18}
                  strokeWidth={moreHighlighted ? 2.45 : 1.7}
                  className={`transition-colors duration-300 ${
                    moreHighlighted
                      ? "text-blue-600 nav-icon-bounce"
                      : "text-slate-400"
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
          </div>
        </div>
      </nav>
    </>
  );
}
