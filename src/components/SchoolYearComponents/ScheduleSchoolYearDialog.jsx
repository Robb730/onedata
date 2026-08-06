import { useState } from "react";
import { X, CalendarClock, Info, Bell } from "lucide-react";

const REMINDER_OPTIONS = [
  { id: "30d", label: "30 days before" },
  { id: "14d", label: "14 days before" },
  { id: "7d",  label: "7 days before" },
  { id: "3d",  label: "3 days before" },
  { id: "1d",  label: "1 day before" },
];

/**
 * ScheduleSchoolYearDialog — Modal for scheduling a new school year transition.
 * Everything is static — no backend calls, no state persistence.
 *
 * @param {boolean}  open    — whether modal is visible
 * @param {function} onClose — close handler
 */
export default function ScheduleSchoolYearDialog({ 
  open, 
  onClose,
  upcomingYearOptions = [],
  defaultDate = "",
  defaultTime = ""
}) {
  // Local UI state for reminder chip toggles (visual only, not persisted)
  const [activeReminders, setActiveReminders] = useState(["30d", "14d", "7d", "3d", "1d"]);

  const toggleReminder = (id) => {
    setActiveReminders((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <CalendarClock size={18} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-[1rem] font-bold text-slate-800 leading-tight">
                Schedule School Year Transition
              </h2>
              <p className="text-[0.73rem] text-slate-400 font-medium mt-0.5">
                Set the upcoming school year and its activation date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-5">
          {/* Upcoming School Year */}
          <div>
            <label className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
              Upcoming School Year
            </label>
            <select className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-[0.85rem] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition-all appearance-none cursor-pointer">
              {upcomingYearOptions.length > 0 ? (
                upcomingYearOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))
              ) : (
                <option value="" disabled>No upcoming years available</option>
              )}
            </select>
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
                Transition Date
              </label>
              <input
                type="text"
                defaultValue={defaultDate}
                placeholder="Select date"
                readOnly
                className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-[0.85rem] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition-all cursor-pointer placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
                Transition Time
              </label>
              <input
                type="text"
                defaultValue={defaultTime}
                placeholder="Select time"
                readOnly
                className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-[0.85rem] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition-all cursor-pointer placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Email Reminders */}
          <div>
            <label className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
              Email Reminders Before Transition
            </label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map(({ id, label }) => {
                const isActive = activeReminders.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleReminder(id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[0.75rem] font-semibold border transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Bell size={11} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Panel */}
          <div className="flex items-start gap-2.5 rounded-[10px] bg-blue-50 border border-blue-100 px-4 py-3">
            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[0.78rem] text-blue-700 leading-relaxed">
              At the scheduled date and time, the current school year will be automatically
              archived and the new year will become active.
            </p>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-[10px] border border-slate-200 text-[0.82rem] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-blue-500 text-[0.82rem] font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,0.28)] hover:bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer"
          >
            <CalendarClock size={14} />
            Confirm Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
