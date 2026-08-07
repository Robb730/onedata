import { Archive, RotateCcw, Lock } from "lucide-react";

/**
 * StatusBadge — Visually distinct badge per status, instead of every
 * status sharing the same gray pill.
 */
function StatusBadge({ status }) {
  const styles = {
    Archived: "bg-slate-100 text-slate-500 border-slate-200",
    Reopened: "bg-amber-50 text-amber-600 border-amber-200",
  };
  const dotStyles = {
    Archived: "bg-slate-400",
    Reopened: "bg-amber-500 animate-pulse",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[0.68rem] font-bold px-2.5 py-1 rounded-full border ${
        styles[status] ?? styles.Archived
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status] ?? dotStyles.Archived}`} />
      {status}
    </span>
  );
}

/**
 * SchoolYearRow — A single row in the Previous School Years table.
 */
function SchoolYearRow({ year, onReopen, onClose }) {
  const isReopened = year.status === "Reopened";

  return (
    <tr className="group border-b border-slate-100 last:border-b-0 transition-colors duration-150 hover:bg-slate-50/80">
      {/* School Year */}
      <td className="px-5 py-4 align-middle">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isReopened
                ? "bg-amber-50 text-amber-500"
                : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
            }`}
          >
            <Archive size={14} />
          </div>
          <div>
            <p className="text-[0.85rem] font-semibold text-slate-800 leading-tight">
              {year.label}
            </p>
            <p className="text-[0.72rem] text-slate-400 mt-0.5">{year.dateRange}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4 align-middle">
        <StatusBadge status={year.status} />
      </td>

      {/* Total Files */}
      <td className="px-5 py-4 align-middle text-right">
        <p className="text-[1.15rem] font-black text-slate-800 leading-none">
          {year.totalFiles}
        </p>
        <p className="text-[0.68rem] text-slate-400 mt-0.5">files</p>
      </td>

      {/* Actions */}
      <td className="px-5 py-4 align-middle text-right">
        {isReopened ? (
          <button
            onClick={() => onClose(year.id)}
            className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-[8px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Lock size={12} />
            Close
          </button>
        ) : (
          <button
            onClick={() => onReopen(year.id)}
            className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-[8px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <RotateCcw size={12} />
            Reopen
          </button>
        )}
      </td>
    </tr>
  );
}

/**
 * PreviousSchoolYearsTable — Table listing archived school years.
 *
 * @param {{ id, label, dateRange, status, totalFiles }[]} years
 * @param {function} onReopen — called with a year's id when "Reopen" is clicked
 * @param {function} onClose  — called with a year's id when "Close" is clicked
 *                              on a currently-reopened year
 */
export default function PreviousSchoolYearsTable({ years = [], onReopen, onClose }) {
  const reopenedCount = years.filter((y) => y.status === "Reopened").length;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-[1.05rem] font-bold text-slate-800">
            Previous School Years{" "}
            <span className="text-[0.78rem] font-semibold text-slate-400 ml-1">
              {years.length}
            </span>
          </h2>
          <p className="text-[0.72rem] text-slate-400 font-medium mt-0.5">
            {reopenedCount > 0
              ? `${reopenedCount} year${reopenedCount > 1 ? "s" : ""} currently reopened for late submissions`
              : "Archived years are read-only · Hover a row to see actions"}
          </p>
        </div>
      </div>

      {/* Table card */}
      <div
        className="overflow-hidden rounded-[16px] border border-slate-100/80 bg-white"
        style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                School Year
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Status
              </th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Total Files
              </th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {years.length > 0 ? (
              years.map((year) => (
                <SchoolYearRow
                  key={year.id}
                  year={year}
                  onReopen={onReopen}
                  onClose={onClose}
                />
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-5 py-12 text-center">
                  <p className="text-[0.95rem] font-medium text-slate-500">
                    No previous school years available.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Table footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-[16px]">
          <p className="text-[11px] text-slate-400">
            ○ Archived years are read-only. Use{" "}
            <span className="font-semibold text-blue-500">Reopen</span> to
            temporarily allow late submissions, or{" "}
            <span className="font-semibold text-slate-500">Close</span> to
            lock a reopened year again.
          </p>
        </div>
      </div>
    </div>
  );
}