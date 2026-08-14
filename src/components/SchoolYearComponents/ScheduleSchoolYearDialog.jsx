import { useState, useEffect } from "react";
import { X, CalendarClock, Info } from "lucide-react";

/**
 * ScheduleSchoolYearDialog — Modal for scheduling a new school year transition,
 * or editing an existing scheduled transition.
 *
 * @param {boolean}  open                  — whether modal is visible
 * @param {function} onClose               — close handler
 * @param {function} onSubmit              — called with { label, startYear, endYear, activationDate } on confirm
 * @param {string}   activeSchoolYearLabel — e.g. "2026-2027"; used to auto-derive
 *                                            the next start year (its end year).
 *                                            Ignored when editing an existing
 *                                            scheduled year (defaultStartYear wins).
 * @param {number}   [defaultStartYear]    — pre-filled starting year, e.g. 2027.
 *                                            Takes priority over activeSchoolYearLabel
 *                                            — pass this when editing an existing
 *                                            scheduled transition.
 * @param {string}   defaultDate           — "YYYY-MM-DD"
 * @param {string}   defaultTime           — "HH:MM"
 */
export default function ScheduleSchoolYearDialog({
  open,
  onClose,
  onSubmit,
  activeSchoolYearLabel,
  defaultStartYear,
  defaultDate = "",
  defaultTime = "",
}) {
  // Next start year = the active year's end year (e.g. active "2026-2027"
  // → next starts at 2027). Falls back to current calendar year if no
  // active label is available (shouldn't normally happen).
  const deriveNextStartYear = () => {
    if (defaultStartYear != null) return String(defaultStartYear);
    const match = /^\d{4}-(\d{4})$/.exec(activeSchoolYearLabel || "");
    return match ? match[1] : String(new Date().getFullYear());
  };

  const [startYear, setStartYear] = useState(deriveNextStartYear());
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);

  // The dialog component stays mounted the whole time the page is open (it
  // just renders `null` while closed), so useState's initial value only
  // fires once, on first mount. Without this effect, opening the dialog to
  // edit an existing scheduled year would keep showing whatever was there
  // the very first time the dialog was ever opened (usually blank), instead
  // of that year's actual values. Re-sync every time it transitions to open.
  useEffect(() => {
    if (open) {
      setStartYear(deriveNextStartYear());
      setDate(defaultDate);
      setTime(defaultTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultStartYear, activeSchoolYearLabel, defaultDate, defaultTime]);

  if (!open) return null;

  // A valid start year is a plain 4-digit number.
  const isValidYear = /^\d{4}$/.test(startYear);
  const endYear = isValidYear ? Number(startYear) + 1 : null;
  const label = isValidYear ? `${startYear}-${endYear}` : "";

  const canSubmit = isValidYear && date && time;

  const handleStartYearChange = (e) => {
    // Allow only digits, capped at 4 characters, while typing.
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
    setStartYear(digitsOnly);
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    onSubmit({
      label,
      startYear: Number(startYear),
      endYear,
      activationDate: new Date(`${date}T${time}`).toISOString(),
    });
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        className="relative w-full max-w-[480px] max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 shrink-0">
              <CalendarClock size={18} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[0.95rem] sm:text-[1rem] font-bold text-slate-800 leading-tight">
                Schedule School Year Transition
              </h2>
              <p className="text-[0.73rem] text-slate-400 font-medium mt-0.5">
                Set the upcoming school year and its activation date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────── */}
        <div className="px-4 sm:px-6 py-5 space-y-5">
          {/* Upcoming School Year */}
          <div>
            <label className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
              Upcoming School Year
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0000"
                  value={startYear}
                  onChange={handleStartYearChange}
                  maxLength={4}
                  className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-[0.85rem] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition-all"
                />
                <span className="block mt-1 text-[0.68rem] font-medium text-slate-400">
                  Start year
                </span>
              </div>
              <div>
                <input
                  type="text"
                  value={endYear ?? ""}
                  disabled
                  placeholder="—"
                  className="w-full rounded-[10px] border border-slate-200/80 bg-slate-100/70 px-3.5 py-2.5 text-[0.85rem] font-medium text-slate-500 outline-none cursor-not-allowed"
                />
                <span className="block mt-1 text-[0.68rem] font-medium text-slate-400">
                  End year (auto)
                </span>
              </div>
            </div>
            {startYear && !isValidYear && (
              <p className="mt-1.5 text-[0.72rem] font-medium text-rose-500">
                Enter a 4-digit year
              </p>
            )}
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
                Transition Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-[0.85rem] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition-all cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
                Transition Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-[0.85rem] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Info Panel */}
          <div className="flex items-start gap-2.5 rounded-[10px] bg-blue-50 border border-blue-100 px-4 py-3">
            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[0.78rem] text-blue-700 leading-relaxed">
              At the scheduled date and time, the current school year will be
              automatically archived and the new year will become active.
            </p>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-[10px] border border-slate-200 text-[0.82rem] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] bg-blue-500 text-[0.82rem] font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,0.28)] hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <CalendarClock size={14} />
            Confirm Schedule
          </button>
        </div>
      </div>
    </div>
  );
}