//DVISION FOLDER CARD COMPONENT
import { useId } from "react";
import { User, FolderOpen } from "lucide-react";
import { FolderColorPicker, COLOR_PRESETS } from "./FolderColorPicker";

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

// ManagerRow handles individual manager rendering
function ManagerRow({ identifier }) {
  const namePart = identifier.includes("@") ? identifier.split("@")[0] : identifier;
  const pieces = namePart.split(/[.\s_-]+/).filter(Boolean);
  let initials = namePart.slice(0, 2).toUpperCase();
  if (pieces.length >= 2) {
    initials = (pieces[0][0] + pieces[1][0]).toUpperCase();
  }

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % 6;
  const palettes = [
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-sky-100", text: "text-sky-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-violet-100", text: "text-violet-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-cyan-100", text: "text-cyan-700" },
  ];
  const { bg, text } = palettes[idx];

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className={`${bg} ${text} rounded-full flex items-center justify-center font-semibold shrink-0`} style={{ width: 18, height: 18, fontSize: 8 }}>
        {initials}
      </div>
      <span className="text-[11px] font-medium text-slate-700 break-words leading-tight">
        {identifier}
      </span>
    </div>
  );
}

function ManagerNameList({ managerList }) {
  const visible = managerList.slice(0, 3);
  const hiddenCount = managerList.length - 3;
  return (
    <div className="group/mlist relative min-w-0 flex-1">
      <div className="flex items-center gap-0.5">
        <span className="truncate text-xs font-medium text-slate-800">
          {visible.join(", ")}
        </span>
        {hiddenCount > 0 && (
          <span className="shrink-0 text-[10px] font-bold text-slate-400">
            +{hiddenCount}
          </span>
        )}
      </div>

      {managerList.length > 1 && (
        <div className="absolute left-0 bottom-full mb-1 z-20 hidden w-48 flex-col rounded-xl border border-slate-200/60 bg-white/95 p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm group-hover/mlist:flex">
          <p className="px-1.5 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Folder Managers
          </p>
          <div className="flex max-h-32 flex-col overflow-y-auto">
            {managerList.map((m) => (
              <ManagerRow key={m} identifier={m} />
            ))}
          </div>
        </div>
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

  const rawId = useId();
  const cardId = `folder-card-${rawId.replace(/:/g, "")}`;

  const managerList = managers?.length ? managers : owner ? [owner] : [];
  const preset = COLOR_PRESETS?.find(p => p.id === colorId) || COLOR_PRESETS?.find(p => p.id === "slate") || { accent: "#64748b", iconBg: iconBgColor };
  const lordColor = preset.accent;
  const dynamicIconBg = preset.iconBg || iconBgColor;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  };

  if (viewMode === "list") {
    return (
      <div
        id={cardId}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        className={`group relative flex cursor-pointer rounded-2xl p-[1.5px] transition-all duration-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] ${locked ? "opacity-80" : ""}`}
        style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
        role="button"
        tabIndex={0}
      >
        {/* Default static border background */}
        <div className="absolute inset-0 rounded-2xl bg-slate-100/80 transition-opacity duration-300 group-hover:opacity-0" />

        {/* Hover pointer glow background */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
          style={{ background: 'radial-gradient(circle 350px at var(--x, 50%) var(--y, 50%), #3EBA8F, #4B86EC, transparent 60%)' }}
        />

        {/* Inner White Card */}
        <div className="relative flex items-center gap-4 w-full overflow-hidden rounded-[15px] bg-white px-4 py-3">

        {/* Icon */}
        <div
          className={`w-11 h-11 ${locked ? "bg-gray-100" : dynamicIconBg
            } rounded-xl flex items-center justify-center shrink-0 ml-1 transition-all duration-300 group-hover:scale-[1.04]`}
        >
          {locked ? (
            <FolderOpen size={20} className="text-slate-400" />
          ) : (
            <lord-icon
              src="/folder-outline.json"
              trigger="hover"
              target={`#${cardId}`}
              colors={`primary:${lordColor}`}
              style={{ width: "24px", height: "24px" }}
            ></lord-icon>
          )}
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
        </div>
      </div>
    );
  }

  return (
    <div
      id={cardId}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      className={`group relative flex min-w-0 cursor-pointer flex-col rounded-[18px] sm:rounded-[22px] p-[1.5px] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)] ${locked ? "opacity-80" : ""}`}
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
      role="button"
      tabIndex={0}
    >
      {/* Default static border background */}
      <div className="absolute inset-0 rounded-[22px] bg-slate-100/80 transition-opacity duration-300 group-hover:opacity-0" />

      {/* Hover pointer glow background */}
      <div 
         className="absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
         style={{ background: 'radial-gradient(circle 350px at var(--x, 50%) var(--y, 50%), #3EBA8F, #4B86EC, transparent 60%)' }}
      />
      
      {/* Inner White Card */}
      <div className="relative flex w-full h-full flex-col overflow-hidden rounded-[16px] sm:rounded-[21px] bg-white p-3 sm:p-5">

      <div className="mb-2 sm:mb-4 flex items-center justify-end gap-1">
        <span
          className={`inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-semibold border ${locked
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
        >
          ● {locked ? "Restricted" : "Active"}
        </span>
      </div>

      <div className="mb-2 sm:mb-4 flex flex-col items-center gap-2 sm:gap-3 text-center">
        <div
          className={`w-10 h-10 sm:w-14 sm:h-14 ${locked ? "bg-gray-100" : dynamicIconBg
            } rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-lg`}
        >
          {locked ? (
            <FolderOpen size={20} className="text-slate-400" />
          ) : (
            <lord-icon
              src="/folder-outline.json"
              trigger="hover"
              target={`#${cardId}`}
              colors={`primary:${lordColor}`}
              style={{ width: "24px", height: "24px" }}
            ></lord-icon>
          )}
        </div>

        <div className="flex w-full min-w-0 flex-col items-center gap-1">
          <h3 className="w-full line-clamp-2 break-words text-center text-[11px] sm:text-sm font-semibold leading-snug text-slate-900">
            {name}
          </h3>
          {typeof sectionCount === "number" && (
            <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-600">
              {sectionCount} {sectionCount === 1 ? "section" : "sections"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto min-w-0">
        <div className="flex items-center justify-center gap-1 min-w-0 sm:hidden">
          <User size={10} className="text-slate-400 shrink-0" />
          <span className="truncate text-[10px] font-medium text-slate-500">
            {managerList.length === 0
              ? "Unassigned"
              : managerList.length === 1
                ? managerList[0]
                : `${managerList[0]} +${managerList.length - 1}`}
          </span>
        </div>
        <div className="hidden sm:block rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 transition-colors">
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
    </div>
  );
}