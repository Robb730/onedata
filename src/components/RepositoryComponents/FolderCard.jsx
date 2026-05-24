import { Calendar, User, FileText, FolderOpen } from "lucide-react";
import { FolderColorPicker } from "./FolderColorPicker";

/**
 * FolderCard — Displays a division folder with customizable accent color,
 * metadata rows, and a hover interaction. All folders are accessible.
 *
 * @param {string}          name
 * @param {number}          fileCount
 * @param {string}          date
 * @param {string}          owner
 * @param {React.Component} icon          — Lucide icon component
 * @param {string}          iconColor     — Tailwind text color class
 * @param {string}          iconBgColor   — Tailwind bg color class
 * @param {string}          [colorId]     — color preset id for the picker
 * @param {function}        [onColorChange] — callback when user picks a new color
 * @param {function}        [onClick]
 */
export function FolderCard({
  name,
  fileCount,
  sectionCount,
  date,
  owner,
  icon: Icon,
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
      className={`surface-elevated card-hover p-4 transition-all relative group cursor-pointer soft-border ${locked ? "opacity-80" : "hover:border-slate-200"}`}
      role="button"
      tabIndex={0}
    >
      {/* Top bar — color picker + Active badge */}
      <div className="flex items-center justify-between mb-2">
        <div>
          {onColorChange && (
            <FolderColorPicker
              currentColorId={colorId}
              onColorChange={onColorChange}
            />
          )}
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${locked ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-green-50 text-green-700 border-green-200"}`}>
          ● {locked ? "Restricted" : "Active"}
        </span>
      </div>

      {/* Icon + name */}
      <div className="flex flex-col items-center mb-3">
        <div
          className={`w-14 h-14 ${locked ? "bg-gray-100" : iconBgColor} rounded-xl flex items-center justify-center mb-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`}
        >
          {Icon && <Icon className={locked ? "text-gray-400" : iconColor} size={24} />}
        </div>
        <div className="flex items-center gap-1">
          <h3 className="text-center text-base font-semibold leading-tight text-slate-800 max-w-40 truncate">
            {name}
          </h3>
          {typeof sectionCount === "number" && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {sectionCount}
            </span>
          )}
        </div>
      </div>

      {/* Detail rows */}
      <div className="space-y-1 mb-0">
        <div className="surface-secondary rounded-lg p-2 transition-colors">
          <div className="flex items-center gap-1 text-sm">
            <FileText size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-600">Files</span>
            <span className="ml-auto font-medium text-slate-800">{fileCount}</span>
          </div>
        </div>
        {typeof sectionCount === "number" && (
          <div className="surface-secondary rounded-lg p-2 transition-colors">
            <div className="flex items-center gap-1 text-sm">
              <FolderOpen size={12} className="text-slate-400 shrink-0" />
              <span className="text-slate-600">Sections</span>
              <span className="ml-auto font-medium text-slate-800">{sectionCount}</span>
            </div>
          </div>
        )}
        <div className="surface-secondary rounded-lg p-2 transition-colors">
          <div className="flex items-center gap-1 text-sm">
            <Calendar size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-600">Modified</span>
            <span className="ml-auto font-medium text-slate-800">{date}</span>
          </div>
        </div>
        <div className="surface-secondary rounded-lg p-2 transition-colors">
          <div className="flex items-center gap-1 text-sm">
            <User size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-600">Owner</span>
            <span className="ml-auto font-medium text-slate-800">{owner}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
