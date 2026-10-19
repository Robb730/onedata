/**
 * GenderCard — a gender total with its public/private split always visible.
 *
 * The split uses the same global Public/Private colors as the enrollment
 * breakdown so the meaning stays consistent across the dashboard; `accent`
 * only marks the gender itself.
 *
 * @param {string} label        — e.g. "Male"
 * @param {number} total
 * @param {number} publicCount
 * @param {number} privateCount
 * @param {string} [accent]     — hex color for the gender label
 */

const PUBLIC_COLOR = "#3b82f6";
const PRIVATE_COLOR = "#10b981";

const pctLabel = (part, whole) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");

export function GenderCard({
  label,
  total = 0,
  publicCount = 0,
  privateCount = 0,
  accent = "#334155",
}) {
  const publicPct = total > 0 ? (publicCount / total) * 100 : 0;
  const privatePct = total > 0 ? (privateCount / total) * 100 : 0;

  return (
    <div
      className="rounded-[14px] border border-slate-100/80 bg-white p-4"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
    >
      {/* ── Gender total ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </span>
        <span
          className="text-[1.25rem] font-bold leading-none tracking-tight tabular-nums"
          style={{ color: accent }}
        >
          {total.toLocaleString()}
        </span>
      </div>

      {/* ── Proportion bar ──────────────────────────────────── */}
      <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full transition-[width] duration-500 ease-out"
          style={{ width: `${publicPct}%`, backgroundColor: PUBLIC_COLOR }}
        />
        <div
          className="h-full transition-[width] duration-500 ease-out"
          style={{ width: `${privatePct}%`, backgroundColor: PRIVATE_COLOR }}
        />
      </div>

      {/* ── Public / private counts ─────────────────────────── */}
      <div className="mt-3 flex items-start">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: PUBLIC_COLOR }}
            />
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.08em] text-slate-400">
              Public
            </span>
          </div>
          <p className="mt-1 text-[0.82rem] font-bold leading-none tabular-nums text-slate-700">
            {publicCount.toLocaleString()}
          </p>
          <p className="mt-1 text-[0.58rem] tabular-nums text-slate-400">
            {pctLabel(publicCount, total)}
          </p>
        </div>

        <div className="flex-1 border-l border-slate-100 pl-4">
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: PRIVATE_COLOR }}
            />
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.08em] text-slate-400">
              Private
            </span>
          </div>
          <p className="mt-1 text-[0.82rem] font-bold leading-none tabular-nums text-slate-700">
            {privateCount.toLocaleString()}
          </p>
          <p className="mt-1 text-[0.58rem] tabular-nums text-slate-400">
            {pctLabel(privateCount, total)}
          </p>
        </div>
      </div>
    </div>
  );
}
