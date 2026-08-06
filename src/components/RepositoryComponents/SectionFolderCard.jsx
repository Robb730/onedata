// SECTION FOLDER CARD COMPONENT
import { useState } from "react";
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

const VISIBLE_ROW_LIMIT = 4;

export function SectionFolderCard({
  name,
  owner,
  managers,
  onClick,
  variant = "folder",
}) {
  const [expanded, setExpanded] = useState(false);

  const managerList = managers?.length ? managers : owner ? [owner] : [];
  const isOverflowing = managerList.length > VISIBLE_ROW_LIMIT;
  const rowsToShow = expanded ? managerList : managerList.slice(0, VISIBLE_ROW_LIMIT);
  const hiddenCount = managerList.length - VISIBLE_ROW_LIMIT;

  if (variant === "create") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-slate-200 bg-white/85 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 transition-colors group-hover:bg-emerald-100/70">
          <Plus size={18} className="text-slate-400 transition-colors group-hover:text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Create section</p>
        <p className="text-[11px] text-slate-400">Add a new folder to this division</p>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[22px] border border-slate-100/80 bg-white p-5 transition-all duration-300 hover:-translate-y-[3px] hover:border-slate-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]"
      role="button"
      tabIndex={0}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-400" />

      {/* Top bar — Active badge */}
      <div className="mb-4 flex items-center justify-end">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          ● Active
        </span>
      </div>

      {/* Icon + name */}
      <div className="mb-4 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-md">
          <FolderOpen size={24} className="text-emerald-700" />
        </div>

        <h3 className="w-full break-words text-center text-sm font-semibold leading-snug text-slate-900">
          {name}
        </h3>
      </div>

      {/* Managed by — full names visible, capped with expand toggle */}
      <div className="mt-auto">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 transition-colors">
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
  );
}