//DVISION FOLDER CARD COMPONENT
import { User, FolderOpen } from "lucide-react";
import { FolderColorPicker } from "./FolderColorPicker";

/**
 * FolderCard — Displays a division folder with customizable accent color,
 * metadata rows, and a hover interaction. All folders are accessible.
 *
 * @param {string}   name
 * @param {number}   [sectionCount]
 * @param {string}   owner
 * @param {string[]} [managers]    — list of people managing this folder
 * @param {string}   iconColor     — Tailwind text color class
 * @param {string}   iconBgColor   — Tailwind bg color class
 * @param {string}   [colorId]     — color preset id for the picker
 * @param {function} [onColorChange] — callback when user picks a new color
 * @param {function} [onClick]
 * @param {boolean}  [locked=false]
 */

const AVATAR_PALETTE = [
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getAvatarColors(identifier) {
  return AVATAR_PALETTE[hashString(identifier) % AVATAR_PALETTE.length];
}

function getInitials(identifier) {
  const namePart = identifier.includes("@") ? identifier.split("@")[0] : identifier;
  const pieces = namePart.split(/[.\s_-]+/).filter(Boolean);
  if (pieces.length >= 2) {
    return (pieces[0][0] + pieces[1][0]).toUpperCase();
  }
  return namePart.slice(0, 2).toUpperCase();
}

function ManagerRow({ identifier }) {
  const { bg, text } = getAvatarColors(identifier);
  return (
    <div className="flex items-center gap-2 py-1">
      <div
        className={`${bg} ${text} rounded-full flex items-center justify-center font-semibold shrink-0`}
        style={{ width: 20, height: 20, fontSize: 8 }}
      >
        {getInitials(identifier)}
      </div>
      <span className="text-xs font-medium text-slate-800 break-words leading-snug">
        {identifier}
      </span>
    </div>
  );
}

export function FolderCard({
  name,
  sectionCount,
  owner,
  managers,
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

  const managerList = managers?.length ? managers : owner ? [owner] : [];

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-[16px] border border-slate-100/80 bg-white p-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-[2px] cursor-pointer flex flex-col ${
        locked ? "opacity-80" : ""
      }`}
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
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

    {/* Managed by — its own block, full names always visible */}
      <div className="mt-auto">
        <div className="bg-slate-50/70 border border-slate-100 rounded-lg px-2.5 py-2 transition-colors">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-0.5">
            <User size={11} className="text-slate-400 shrink-0" />
            <span>{managerList.length > 1 ? "Managed by" : "Managed by"}</span>
          </div>

          {managerList.length === 0 ? (
            <p className="text-xs text-slate-400 italic pl-0.5">Unassigned</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-200/60">
              {managerList.map((m) => (
                <ManagerRow key={m} identifier={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}