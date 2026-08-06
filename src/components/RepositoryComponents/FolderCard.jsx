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
    <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white">
      <div
        className={`${bg} ${text} rounded-full flex items-center justify-center font-semibold shrink-0`}
        style={{ width: 22, height: 22, fontSize: 8 }}
      >
        {getInitials(identifier)}
      </div>
      <span className="text-xs font-medium text-slate-700 break-words leading-snug">
        {identifier}
      </span>
    </div>
  );
}

function ManagerNamePill({ identifier }) {
  const { bg, text } = getAvatarColors(identifier);
  return (
    <div className={`${bg} ${text} flex items-center gap-1.5 rounded-full px-2.5 py-1 shrink-0`}>
      <div
        className="rounded-full flex items-center justify-center font-semibold bg-white/60 shrink-0"
        style={{ width: 16, height: 16, fontSize: 7 }}
      >
        {getInitials(identifier)}
      </div>
      <span className="text-[11px] font-medium whitespace-nowrap">{identifier}</span>
    </div>
  );
}

function ManagerNameList({ managerList }) {
  const shown = managerList.slice(0, 2);
  const extra = managerList.length - shown.length;
  return (
    <div className="flex items-center gap-1.5 overflow-hidden">
      {shown.map((m) => (
        <ManagerNamePill key={m} identifier={m} />
      ))}
      {extra > 0 && (
        <span className="text-[11px] font-medium text-slate-500 shrink-0">+{extra} more</span>
      )}
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
  viewMode = "grid",
}) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) onClick();
  };

  const managerList = managers?.length ? managers : owner ? [owner] : [];

  if (viewMode === "list") {
    return (
      <div
        onClick={handleClick}
        className={`group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-slate-100/80 bg-white px-4 py-3 transition-all duration-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] ${locked ? "opacity-80" : ""
          }`}
        style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
        role="button"
        tabIndex={0}
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-sky-400 via-emerald-400 to-indigo-400" />

        {/* Icon */}
        <div
          className={`w-11 h-11 ${locked ? "bg-gray-100" : iconBgColor
            } rounded-xl flex items-center justify-center shrink-0 ml-1 transition-all duration-300 group-hover:scale-[1.04]`}
        >
          <FolderOpen size={20} className={locked ? "text-slate-400" : iconColor} />
        </div>

        {/* Name + section count */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900">{name}</h3>
          <div className="mt-0.5 flex items-center gap-2">
            {typeof sectionCount === "number" && (
              <span className="text-[11px] font-medium text-slate-500">
                {sectionCount} {sectionCount === 1 ? "section" : "sections"}
              </span>
            )}
          </div>
        </div>

        {/* Managers */}
        <div className="hidden min-w-0 shrink items-center gap-2 md:flex">
          <User size={12} className="text-slate-400 shrink-0" />
          {managerList.length === 0 ? (
            <span className="text-xs italic text-slate-400">Unassigned</span>
          ) : (
            <ManagerNameList managerList={managerList} />
          )}
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${locked
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
        >
          ● {locked ? "Restricted" : "Active"}
        </span>

        {/* Color picker */}
        {onColorChange && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <FolderColorPicker currentColorId={colorId} onColorChange={onColorChange} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-[22px] border border-slate-100/80 bg-white p-5 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)] ${locked ? "opacity-80" : ""
        }`}
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
      role="button"
      tabIndex={0}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-400" />

      <div className="mb-4 flex items-center justify-between">
        <div>
          {onColorChange && (
            <FolderColorPicker currentColorId={colorId} onColorChange={onColorChange} />
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${locked
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
        >
          ● {locked ? "Restricted" : "Active"}
        </span>
      </div>

      <div className="mb-4 flex flex-col items-center gap-3 text-center">
        <div
          className={`w-14 h-14 ${locked ? "bg-gray-100" : iconBgColor
            } rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-lg`}
        >
          <FolderOpen size={24} className={locked ? "text-slate-400" : iconColor} />
        </div>

        <div className="flex w-full flex-col items-center gap-1">
          <h3 className="w-full break-words text-center text-sm font-semibold leading-snug text-slate-900">
            {name}
          </h3>
          {typeof sectionCount === "number" && (
            <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {sectionCount} {sectionCount === 1 ? "section" : "sections"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 transition-colors">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <User size={11} className="text-slate-400 shrink-0" />
            <span>Managed by</span>
          </div>

          {managerList.length === 0 ? (
            <p className="pl-0.5 text-xs italic text-slate-400">Unassigned</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-200/60 rounded-xl bg-white/70">
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