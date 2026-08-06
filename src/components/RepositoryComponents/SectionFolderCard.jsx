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
        className="soft-border rounded-xl border-dashed p-4 flex flex-col items-center justify-center gap-2 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
        style={{ minHeight: 200 }}
      >
        <div className="w-11 h-11 rounded-lg bg-slate-50 flex items-center justify-center">
          <Plus size={18} className="text-slate-400" />
        </div>
        <p className="text-xs font-medium text-slate-600">Create section</p>
        <p className="text-[11px] text-slate-400">Add to this division</p>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className="surface-elevated card-hover soft-border p-4 transition-all relative group cursor-pointer hover:border-slate-200 flex flex-col"
      role="button"
      tabIndex={0}
    >
      {/* Top bar — Active badge */}
      <div className="flex items-center justify-end mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-green-50 text-green-700 border-green-200">
          ● Active
        </span>
      </div>

      {/* Icon + name */}
      <div className="flex flex-col items-center gap-2 mb-3">
        <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
          <FolderOpen size={24} className="text-emerald-700" />
        </div>

        <h3 className="text-center text-sm font-semibold leading-snug text-slate-800 break-words w-full">
          {name}
        </h3>
      </div>

      {/* Managed by — full names visible, capped with expand toggle */}
      <div className="mt-auto">
        <div className="surface-secondary rounded-lg px-2.5 py-2 transition-colors">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-0.5">
            <User size={11} className="text-slate-400 shrink-0" />
            <span>Managed by</span>
          </div>

          {managerList.length === 0 ? (
            <p className="text-xs text-slate-400 italic pl-0.5">Unassigned</p>
          ) : (
            <>
              <div className="flex flex-col divide-y divide-slate-200/60">
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
                  className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
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