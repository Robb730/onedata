import { ArrowRight } from "lucide-react";

/**
 * EnrollmentBreakdown — the Public / Private / Total enrollment indicator.
 *
 * Renders the total as the single hero figure, then breaks it down into a
 * proportional Public/Private bar with the two parts aligned beneath it, so
 * the relationship reads at a glance instead of across three equal-weight
 * cards.
 *
 * Pass `compare` to additionally show the selected year side by side with
 * the year it is being compared against.
 *
 * @param {number}  publicCount  — learners in public schools
 * @param {number}  privateCount — learners in private schools
 * @param {number}  total        — grand total (should equal the sum above)
 * @param {string}  [year]       — label for the primary period, e.g. "2025-2026"
 * @param {object}  [compare]    — { publicCount, privateCount, total, year } or null
 */

const PUBLIC_COLOR = "#3b82f6";
const PRIVATE_COLOR = "#10b981";
const CURRENT_YEAR_COLOR = "#3b82f6";
const COMPARE_COLOR = "#f97316";

const fmt = (n) => (n || 0).toLocaleString();

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : null);

const pctLabel = (value) => (value === null ? "—" : `${value}%`);

/** Proportional Public/Private bar with a neutral track behind it. */
function SplitBar({ publicCount, privateCount, total }) {
  const publicPct = total > 0 ? (publicCount / total) * 100 : 0;
  const privatePct = total > 0 ? (privateCount / total) * 100 : 0;

  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
      role="presentation"
    >
      <div
        className="h-full transition-[width] duration-500 ease-out"
        style={{ width: `${publicPct}%`, backgroundColor: PUBLIC_COLOR }}
      />
      <div
        className="h-full transition-[width] duration-500 ease-out"
        style={{ width: `${privatePct}%`, backgroundColor: PRIVATE_COLOR }}
      />
    </div>
  );
}

/** One row of the side-by-side comparison grid. */
function CompareRow({ label, current, compare, total, compareTotal, emphasise }) {
  const currentPct = pct(current, total);
  const comparePct = pct(compare, compareTotal);
  const hasCompare = compareTotal > 0;
  const delta = hasCompare ? compare - current : null;

  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className={`min-w-[4.5rem] shrink-0 text-[0.72rem] ${
          emphasise ? "font-bold text-slate-700" : "font-semibold text-slate-500"
        }`}
      >
        {label}
      </span>

      <div className="flex flex-1 items-baseline justify-end gap-2 sm:gap-4">
        <span className="text-right">
          <span
            className={`block tabular-nums leading-none ${
              emphasise ? "text-[0.9rem] font-bold text-slate-900" : "text-[0.85rem] font-bold text-slate-700"
            }`}
          >
            {fmt(current)}
          </span>
          <span className="block text-[0.6rem] tabular-nums text-slate-400">
            {pctLabel(currentPct)}
          </span>
        </span>

        <span className="text-right">
          <span
            className={`block tabular-nums leading-none ${
              hasCompare
                ? emphasise
                  ? "text-[0.9rem] font-bold text-slate-900"
                  : "text-[0.85rem] font-bold text-slate-700"
                : "text-[0.85rem] font-bold text-slate-300"
            }`}
          >
            {hasCompare ? fmt(compare) : "—"}
          </span>
          <span className="block text-[0.6rem] tabular-nums text-slate-400">
            {pctLabel(comparePct)}
          </span>
        </span>

        <span className="w-[4.5rem] shrink-0 text-right">
          {delta !== null && delta !== 0 && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums ${
                delta > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
              }`}
            >
              {delta > 0 ? "↗" : "↘"} {fmt(Math.abs(delta))}
            </span>
          )}
          {delta === 0 && (
            <span className="text-[0.6rem] font-semibold text-slate-300">no change</span>
          )}
        </span>
      </div>
    </div>
  );
}

export function EnrollmentBreakdown({
  publicCount = 0,
  privateCount = 0,
  total = 0,
  year,
  compare = null,
}) {
  const publicPct = pct(publicCount, total);
  const privatePct = pct(privateCount, total);
  const compareProvided = !!compare;
  const hasCompare = compareProvided && (compare.total || 0) > 0;

  return (
    <div
      className="rounded-[16px] border border-slate-100/80 bg-white p-4 sm:p-5"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
    >
      {/* ── Hero: total enrollment ─────────────────────────── */}
      <div className="flex items-start gap-3">
        <div>
          <p
            className="text-[1.9rem] sm:text-[2.25rem] font-black leading-none tracking-tight tabular-nums text-slate-900"
            aria-label="Total enrollment"
          >
            {fmt(total)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[0.62rem] font-bold tabular-nums text-slate-500">
            <span
              className="h-1 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: CURRENT_YEAR_COLOR }}
            />
            SY {year}
          </p>
        </div>

        {compareProvided && (
          <>
            <ArrowRight size={18} className="mt-2 shrink-0 text-slate-300" />

            <div>
              <p className="text-[1.9rem] sm:text-[2.25rem] font-black leading-none tracking-tight tabular-nums text-slate-500">
                {hasCompare ? fmt(compare.total) : "—"}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[0.62rem] font-bold tabular-nums text-slate-400">
                <span
                  className="h-1 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: COMPARE_COLOR }}
                />
                SY {compare.year}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Proportion bar ──────────────────────────────────── */}
      <div className="mt-4">
        <SplitBar publicCount={publicCount} privateCount={privateCount} total={total} />
      </div>

      {/* ── Legend ─────────────────────────────────────────── */}
      <div className="mt-3.5 flex items-start">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: PUBLIC_COLOR }}
            />
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">
              Public
            </span>
          </div>
          {/* In compare mode the counts are shown in the grid below,
              so only the share is repeated here. */}
          {!hasCompare && (
            <p className="mt-1 text-[0.95rem] font-bold leading-none tabular-nums text-slate-700">
              {fmt(publicCount)}
            </p>
          )}
          <p
            className={`tabular-nums text-slate-400 ${
              hasCompare ? "mt-1.5 text-[0.72rem] font-semibold" : "mt-1 text-[0.62rem]"
            }`}
          >
            {pctLabel(publicPct)}
          </p>
        </div>

        <div className="flex-1 border-l border-slate-100 pl-4">
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: PRIVATE_COLOR }}
            />
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">
              Private
            </span>
          </div>
          {!hasCompare && (
            <p className="mt-1 text-[0.95rem] font-bold leading-none tabular-nums text-slate-700">
              {fmt(privateCount)}
            </p>
          )}
          <p
            className={`tabular-nums text-slate-400 ${
              hasCompare ? "mt-1.5 text-[0.72rem] font-semibold" : "mt-1 text-[0.62rem]"
            }`}
          >
            {pctLabel(privatePct)}
          </p>
        </div>
      </div>

      {/* ── Year-over-year comparison ──────────────────────── */}
      {hasCompare && (
        <div className="mt-4 border-t border-slate-100 pt-1">
          <div className="flex items-baseline gap-3 pb-2">
            <span className="min-w-[4.5rem] shrink-0" />
            <div className="flex flex-1 items-baseline justify-end gap-2 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-[5px] w-[5px] shrink-0 rounded-full"
                  style={{ backgroundColor: CURRENT_YEAR_COLOR }}
                />
                <span className="text-[0.6rem] font-bold tabular-nums text-slate-500">
                  {year}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-[5px] w-[5px] shrink-0 rounded-full"
                  style={{ backgroundColor: COMPARE_COLOR }}
                />
                <span className="text-[0.6rem] font-bold tabular-nums text-slate-500">
                  {compare.year}
                </span>
              </span>
              <span className="w-[4.5rem] shrink-0 text-right text-[0.6rem] font-bold uppercase tracking-[0.08em] text-slate-300">
                Change
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            <CompareRow
              label="Public"
              current={publicCount}
              compare={compare.publicCount}
              total={total}
              compareTotal={compare.total}
            />
            <CompareRow
              label="Private"
              current={privateCount}
              compare={compare.privateCount}
              total={total}
              compareTotal={compare.total}
            />
            <CompareRow
              label="Total"
              current={total}
              compare={compare.total}
              total={total}
              compareTotal={compare.total}
              emphasise
            />
          </div>
        </div>
      )}
    </div>
  );
}
