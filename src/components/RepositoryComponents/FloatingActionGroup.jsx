// FloatingActionGroup.jsx
// A floating action button group that expands child actions outward from the
// main trigger with spring-like physics.

import { useState, useEffect, useRef } from "react";
import { Grid3x3 } from "lucide-react";

export default function FloatingActionGroup({ actions = [], triggerColor }) {
  const [open, setOpen] = useState(false);
  const groupRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (groupRef.current && !groupRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const baseButton = triggerColor || "bg-blue-600 hover:bg-blue-700 shadow-[0_12px_30px_rgba(37,99,235,0.40)]";

  // Sum badge counts across all child actions (e.g. pending access requests)
  // so the trigger itself can surface a notification while collapsed —
  // otherwise a badge on a hidden child action is invisible to the user.
  const totalBadge = actions.reduce(
    (sum, action) => sum + (Number(action.badge) > 0 ? Number(action.badge) : 0),
    0,
  );

  return (
    <div
      ref={groupRef}
      className="fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-3 lg:right-6 lg:bottom-6"
    >
      {[...actions].reverse().map((action, reverseIdx) => {
        const idx = actions.length - 1 - reverseIdx;
        const offsetY = (idx + 1) * 60;
        return (
          <div
            key={action.id}
            className="relative flex items-center"
            style={{
              transform: open ? "translateY(0) scale(1)" : "translateY(" + offsetY + "px) scale(0.6)",
              opacity: open ? 1 : 0,
              pointerEvents: open ? "auto" : "none",
              transition: open
                ? "transform 420ms cubic-bezier(0.22, 1, 0.36, 1) " + (idx * 50) + "ms, opacity 320ms ease " + (idx * 50) + "ms"
                : "transform 280ms cubic-bezier(0.55, 0, 0.45, 1) " + ((actions.length - 1 - idx) * 40) + "ms, opacity 200ms ease " + ((actions.length - 1 - idx) * 40) + "ms",
              transformOrigin: "bottom center",
            }}
          >
            <span
              className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg transition-opacity duration-150 lg:block"
              style={{ opacity: open ? 1 : 0 }}
            >
              {action.label}
            </span>
            <button
              onClick={() => { action.onClick(); setOpen(false); }}
              className={"relative flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " + action.color}
              title={action.label}
              aria-label={action.label}
            >
              {action.icon}
              {action.badge != null && action.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {action.badge > 9 ? "9+" : action.badge}
                </span>
              )}
            </button>
          </div>
        );
      })}
      <button
        onClick={() => setOpen((v) => !v)}
        className={"relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 " + baseButton}
        aria-label={open ? "Close actions" : "Open actions"}
        aria-expanded={open}
      >
        <Grid3x3
          size={24}
          className="text-white transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        />
        {totalBadge > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[10px] font-bold text-white transition-opacity duration-200"
            style={{ opacity: open ? 0 : 1, pointerEvents: "none" }}
          >
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>
    </div>
  );
}