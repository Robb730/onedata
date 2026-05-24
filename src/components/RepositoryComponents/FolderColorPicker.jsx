import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Palette, Check } from "lucide-react";

/**
 * COLOR_PRESETS — Curated color palette for folder customization.
 * Each preset includes the Tailwind classes needed for the icon area,
 * the text accent, and a human-readable label.
 */
export const COLOR_PRESETS = [
  { id: "teal",   label: "Teal",    iconColor: "text-teal-500",   iconBg: "bg-teal-50",   accent: "#14b8a6", ring: "ring-teal-200"   },
  { id: "blue",   label: "Blue",    iconColor: "text-blue-500",   iconBg: "bg-blue-50",   accent: "#3b82f6", ring: "ring-blue-200"   },
  { id: "purple", label: "Purple",  iconColor: "text-purple-500", iconBg: "bg-purple-50", accent: "#8b5cf6", ring: "ring-purple-200" },
  { id: "rose",   label: "Rose",    iconColor: "text-rose-500",   iconBg: "bg-rose-50",   accent: "#f43f5e", ring: "ring-rose-200"   },
  { id: "amber",  label: "Amber",   iconColor: "text-amber-500",  iconBg: "bg-amber-50",  accent: "#f59e0b", ring: "ring-amber-200"  },
  { id: "emerald",label: "Emerald", iconColor: "text-emerald-500",iconBg: "bg-emerald-50",accent: "#10b981", ring: "ring-emerald-200"},
  { id: "indigo", label: "Indigo",  iconColor: "text-indigo-500", iconBg: "bg-indigo-50", accent: "#6366f1", ring: "ring-indigo-200" },
  { id: "orange", label: "Orange",  iconColor: "text-orange-500", iconBg: "bg-orange-50", accent: "#f97316", ring: "ring-orange-200" },
  { id: "cyan",   label: "Cyan",    iconColor: "text-cyan-500",   iconBg: "bg-cyan-50",   accent: "#06b6d4", ring: "ring-cyan-200"   },
  { id: "slate",  label: "Slate",   iconColor: "text-slate-500",  iconBg: "bg-slate-100", accent: "#64748b", ring: "ring-slate-200"  },
];

/**
 * FolderColorPicker — A small popover with color swatches
 * that lets the user change a folder's accent color.
 *
 * @param {string}   currentColorId — id of the currently selected preset
 * @param {function} onColorChange  — callback with the selected preset object
 */
export function FolderColorPicker({ currentColorId = "teal", onColorChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const popRef = useRef(null);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      const target = e.target;
      const insideBtn = ref.current && ref.current.contains(target);
      const insidePop = popRef.current && popRef.current.contains(target);
      if (!insideBtn && !insidePop) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // update popover position when opened, on resize/scroll
  useEffect(() => {
    function updatePos() {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const popoverWidth = 220; // approximate width
      let left = rect.right - popoverWidth;
      if (left < 8) left = rect.left; // fallback
      // ensure it doesn't overflow to the right
      if (left + popoverWidth > window.innerWidth - 8) left = window.innerWidth - popoverWidth - 8;
      const top = rect.bottom + 8;
      setPos({ left, top });
    }

    if (open) {
      updatePos();
      window.addEventListener("resize", updatePos);
      window.addEventListener("scroll", updatePos, true);
    }
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        ref={btnRef}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        title="Change folder color"
      >
        <Palette size={12} />
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            className="z-50 bg-white rounded-xl p-3"
            style={{
              position: "fixed",
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              width: 220,
              border: "1px solid rgba(203,213,225,0.6)",
              boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Folder Color</p>
            <div className="grid grid-cols-5 gap-1.5">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = preset.id === currentColorId;
                return (
                  <button
                    key={preset.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onColorChange(preset);
                      setOpen(false);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${
                      isSelected ? `ring-2 ${preset.ring} scale-110` : ""
                    }`}
                    style={{ backgroundColor: preset.accent + "18" }}
                    title={preset.label}
                  >
                    {isSelected ? (
                      <Check size={13} style={{ color: preset.accent }} strokeWidth={3} />
                    ) : (
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
