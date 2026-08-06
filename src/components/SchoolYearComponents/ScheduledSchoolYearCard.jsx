import { Bell, CalendarClock, X, Edit3 } from "lucide-react";

/**
 * CountdownUnit — Single countdown column (value + label).
 */
function CountdownUnit({ value, label }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <span className="text-[2.4rem] font-black text-blue-600 leading-none tracking-tight">
        {padded}
      </span>
      <span className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-[0.1em] mt-1">
        {label}
      </span>
    </div>
  );
}

/**
 * ReminderChip — Individual reminder badge.
 */
function ReminderChip({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold text-blue-600 bg-blue-50 border border-blue-100">
      {label}
    </span>
  );
}

/**
 * ScheduledSchoolYearCard — Displays the next scheduled school year with countdown.
 * Static presentational component; no backend logic. "Edit Schedule" and
 * "Cancel Transition" are both delegated to the parent via callbacks.
 *
 * @param {{ id, label, activationDate, countdown, reminders }} year
 * @param {function} onCancel — called with no args when the user cancels the transition
 * @param {function} onEdit   — called with the full `year` object when the user wants to edit it
 */
export default function ScheduledSchoolYearCard({ year, onCancel, onEdit }) {
  if (!year) {
    return (
      <div
        className="group relative rounded-[16px] border border-slate-100/80 bg-slate-50/50 flex flex-col items-center justify-center p-8 min-h-[320px] transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-[2px]"
        style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
      >
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
          Scheduled Next
        </p>
        <p className="text-[0.95rem] font-medium text-slate-500">
          No upcoming transition scheduled.
        </p>
      </div>
    );
  }

  const { label, activationDate, countdown, reminders } = year;

  return (
    <div
      className="group relative rounded-[16px] border border-slate-100/80 bg-white transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-[2px] overflow-hidden"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
    >
      <div className="px-5 pt-5 pb-0">
        {/* ── Label + Badge ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-blue-500">
            Scheduled Next
          </p>
          <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Scheduled
          </span>
        </div>

        {/* ── School Year Title ─────────────────────────── */}
        <h2 className="text-[1.6rem] font-black text-slate-800 tracking-[-0.02em] leading-none mb-1">
          {label}
        </h2>
        <p className="text-[0.78rem] text-slate-400 font-medium mb-5">{activationDate}</p>

        {/* ── Countdown ─────────────────────────────────── */}
        <p className="text-[0.7rem] font-semibold text-slate-400 uppercase tracking-[0.1em] mb-3">
          Time until activation
        </p>
        <div className="flex items-end gap-4 mb-5">
          <CountdownUnit value={countdown.days} label="Days" />
          <span className="text-[2rem] font-black text-slate-200 pb-5">:</span>
          <CountdownUnit value={countdown.hours} label="Hours" />
          <span className="text-[2rem] font-black text-slate-200 pb-5">:</span>
          <CountdownUnit value={countdown.minutes} label="Minutes" />
        </div>

        
      </div>

      {/* ── Action Footer ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/60">
        <button
          onClick={() => onEdit?.(year)}
          className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-[8px]"
        >
          <Edit3 size={12} />
          Edit Schedule
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
        >
          <X size={13} />
          Cancel Transition
        </button>
      </div>
    </div>
  );
}