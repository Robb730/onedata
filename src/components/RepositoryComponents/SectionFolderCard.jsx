import { useState, useId } from "react";
import { User, FolderOpen, Plus, ChevronDown } from "lucide-react";

/**
 * SectionFolderCard — Section-level folder card, styled to match FolderCard.
 *
 * @param {string}   name
 * @param {string}   [owner]     — fallback single manager name
 * @param {string[]} [managers]  — list of people managing this section
 * @param {function} [onClick]
 * @param {"folder"|"create"} [variant="folder"]
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
            Section Managers
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

const VISIBLE_ROW_LIMIT = 4;

export function SectionFolderCard({
  name,
  owner,
  managers,
  onClick,
  variant = "folder",
  viewMode = "grid",
}) {
  const [expanded, setExpanded] = useState(false);
  const rawId = useId();
  const cardId = `section-card-${rawId.replace(/:/g, "")}`;

  const managerList = managers?.length ? managers : owner ? [owner] : [];
  const isOverflowing = managerList.length > VISIBLE_ROW_LIMIT;
  const rowsToShow = expanded ? managerList : managerList.slice(0, VISIBLE_ROW_LIMIT);
  const hiddenCount = managerList.length - VISIBLE_ROW_LIMIT;

  if (variant === "create") {
    if (viewMode === "list") {
      return (
        <button
          type="button"
          onClick={onClick}
          className="group flex items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white/85 px-4 py-3 text-left transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-emerald-100/70">
            <Plus size={18} className="text-slate-400 transition-colors group-hover:text-emerald-600" />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-slate-700">Create section</p>
            <p className="text-[11px] text-slate-400">Add a new folder to this division</p>
          </div>
        </button>
      );
    }
    
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex min-h-[140px] sm:min-h-[220px] min-w-0 flex-col items-center justify-center gap-2 sm:gap-3 rounded-[18px] sm:rounded-[22px] border border-dashed border-slate-200 bg-white/85 p-3 sm:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]"
      >
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-50 transition-colors group-hover:bg-emerald-100/70">
          <Plus size={18} className="text-slate-400 transition-colors group-hover:text-emerald-600" />
        </div>
        <p className="text-[11px] sm:text-sm font-semibold text-slate-700">Create section</p>
        <p className="hidden sm:block text-[11px] text-slate-400">Add a new folder to this division</p>
      </button>
    );
  }

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
        onClick={onClick}
        onMouseMove={handleMouseMove}
        className="group relative flex cursor-pointer rounded-2xl p-[1.5px] transition-all duration-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
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
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 ml-1 transition-all duration-300 group-hover:scale-[1.04]">
            <lord-icon
              src="/folder-outline.json"
              trigger="hover"
              target={`#${cardId}`}
              colors="primary:#047857"
              style={{ width: "24px", height: "24px" }}
            ></lord-icon>
          </div>

          {/* Name */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-900">{name}</h3>
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
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            ● Active
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={cardId}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      onMouseMove={handleMouseMove}
      className="group relative flex min-w-0 cursor-pointer flex-col rounded-[18px] sm:rounded-[22px] p-[1.5px] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]"
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

      {/* Top bar — Active badge */}
      <div className="mb-2 sm:mb-4 flex items-center justify-end">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold text-emerald-700">
          ● Active
        </span>
      </div>

      {/* Icon + name */}
      <div className="mb-2 sm:mb-4 flex flex-col items-center gap-2 sm:gap-3 text-center">
        <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-50 transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-md">
          <lord-icon
            src="/folder-outline.json"
            trigger="hover"
            target={`#${cardId}`}
            colors="primary:#047857"
            style={{ width: "24px", height: "24px" }}
          ></lord-icon>
        </div>

        <h3 className="w-full line-clamp-2 break-words text-center text-[11px] sm:text-sm font-semibold leading-snug text-slate-900">
          {name}
        </h3>
      </div>

      {/* Managed by — compact on mobile, full list from sm up */}
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
            <>
              <div className="flex flex-col divide-y divide-slate-200/60 rounded-xl bg-white/70">
                {rowsToShow.map((m) => (
                  <ManagerRow key={m} identifier={m} />
                ))}
              </div>

              {isOverflowing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((v) => !v);
                  }}
                  className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                  {expanded ? "Show less" : `+${hiddenCount} more`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}