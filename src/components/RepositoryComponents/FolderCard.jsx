import { User, FolderOpen } from "lucide-react";
import { FolderColorPicker } from "./FolderColorPicker";

/**
 * FolderCard — Displays a division folder with customizable accent color,
 * metadata rows, and a hover interaction. All folders are accessible.
 *
 * @param {string}   name
 * @param {number}   [sectionCount]
 * @param {string}   owner
 * @param {string}   iconColor     — Tailwind text color class
 * @param {string}   iconBgColor   — Tailwind bg color class
 * @param {string}   [colorId]     — color preset id for the picker
 * @param {function} [onColorChange] — callback when user picks a new color
 * @param {function} [onClick]
 * @param {boolean}  [locked=false]
 */
export function FolderCard({
  name,
  sectionCount,
  owner,
  iconColor = "text-slate-700",
  iconBgColor = "bg-slate-50",
  colorId,
  onColorChange,
  onClick,
  locked = false,
}) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`surface-elevated card-hover p-4 transition-all relative group cursor-pointer soft-border flex flex-col ${
        locked ? "opacity-80" : "hover:border-slate-200"
      }`}
      role="button"
      tabIndex={0}
    >
      {/* Top bar — color picker + Active badge */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {onColorChange && (
            <FolderColorPicker
              currentColorId={colorId}
              onColorChange={onColorChange}
            />
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            locked
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          ● {locked ? "Restricted" : "Active"}
        </span>
      </div>

      {/* Icon + name */}
      <div className="flex flex-col items-center gap-2 mb-3">
        <div
          className={`w-14 h-14 ${
            locked ? "bg-gray-100" : iconBgColor
          } rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`}
        >
          <FolderOpen
            size={24}
            className={locked ? "text-gray-400" : iconColor}
          />
        </div>

        {/* Name — wraps fully, no truncation */}
        <div className="flex flex-col items-center gap-1 w-full">
          <h3 className="text-center text-sm font-semibold leading-snug text-slate-800 break-words w-full">
            {name}
          </h3>
          {typeof sectionCount === "number" && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {sectionCount} {sectionCount === 1 ? "section" : "sections"}
            </span>
          )}
        </div>
      </div>

      {/* Detail rows */}
      <div className="mt-auto">
        <div className="surface-secondary rounded-lg p-2 transition-colors">
          <div className="flex items-center gap-1.5 text-sm">
            <User size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-500 text-xs">Owner</span>
            <span className="ml-auto font-medium text-slate-800 text-xs">
              {owner}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}