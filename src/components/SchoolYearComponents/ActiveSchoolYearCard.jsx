import { Eye, Zap, Clock } from "lucide-react";

/**
 * ActiveSchoolYearCard — Displays the currently active school year.
 *
 * @param {{ label, dateRange, totalFiles, archiveDays, archiveDate }} year
 */
export default function ActiveSchoolYearCard({ year, onForceTransition }) {
  if (!year) {
    return (
      <div
        className="group relative rounded-[16px] border border-slate-100/80 bg-slate-50/50 flex flex-col items-center justify-center p-6 sm:p-8 min-h-[220px] sm:min-h-[320px] transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-[2px]"
        style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
      >
        <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-slate-200 rounded-l-[16px]" />
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
          Currently Active
        </p>
        <p className="text-[0.95rem] font-medium text-slate-500 text-center">
          No active school year.
        </p>
      </div>
    );
  }

  const { label, dateRange, totalFiles, archiveDays, archiveDate } = year;

  return (
    <div
      className="group relative rounded-[16px] border border-slate-100/80 bg-white transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-[2px] overflow-hidden"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
    >
      <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-emerald-400 rounded-l-[16px]" />

      <div className="pl-5 sm:pl-7 pr-4 sm:pr-5 pt-4 sm:pt-5 pb-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-emerald-600">
            Currently Active
          </p>
          <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>

        <h2 className="text-[1.35rem] sm:text-[1.6rem] font-black text-slate-800 tracking-[-0.02em] leading-none mb-1">
          {label}
        </h2>
        <p className="text-[0.78rem] text-slate-400 font-medium mb-4">{dateRange}</p>

        <div className="h-px bg-slate-100 mb-4" />

        <p className="text-[0.82rem] text-slate-600 mb-4">
          <span className="text-[1.15rem] sm:text-[1.3rem] font-black text-slate-800 mr-1">{totalFiles}</span>
          total files
        </p>

        <div className="h-px bg-slate-100 mb-4" />

        <div className="flex items-start gap-2 text-[0.78rem] text-slate-500 mb-5">
          <Clock size={13} className="text-slate-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            Archives in{" "}
            <span className="font-bold text-slate-700">{archiveDays} days</span>
            {" — "}
            {archiveDate}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-7 py-3 sm:py-3.5 border-t border-slate-100 bg-slate-50/60">
        <button className="inline-flex items-center justify-center gap-1.5 text-[0.78rem] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer py-1">
          <Eye size={13} />
          View Repository
        </button>
        <button
          onClick={onForceTransition}
          className="inline-flex items-center justify-center gap-1.5 text-[0.78rem] font-semibold text-slate-400 hover:text-orange-500 transition-colors cursor-pointer py-1"
        >
          <Zap size={13} />
          Force Transition
        </button>
      </div>
    </div>
  );
}
