import { CalendarPlus } from "lucide-react";

/**
 * SchoolYearHeader — Page title + "Schedule New School Year" button.
 * @param {function} onSchedule — opens the schedule dialog
 */
export default function SchoolYearHeader({ onSchedule }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
      <div>
        <h1 className="text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
          School Year Management
        </h1>
        <p className="text-[0.78rem] text-slate-400 font-medium mt-1">
          Manage school year transitions, archiving, and historical access · Admin only
        </p>
      </div>

      <button
        onClick={onSchedule}
        className="inline-flex items-center gap-2 rounded-[10px] bg-blue-500 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,0.28)] hover:bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer shrink-0"
      >
        <CalendarPlus size={15} />
        Schedule New School Year
      </button>
    </div>
  );
}
