import { Archive, RotateCcw, Lock } from "lucide-react";

/**
 * StatusBadge — Visually distinct badge per status.
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

function YearActions({ year, onReopen, onClose, alwaysVisible = false }) {
  const isReopened = year.status === "Reopened";
  const visibility = alwaysVisible
    ? "opacity-100"
    : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100";

  if (isReopened) {
    return (
      <button
        onClick={() => onClose(year.id)}
        className={`inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-[8px] transition-colors cursor-pointer ${visibility}`}
      >
        <Lock size={12} />
        Close
      </button>
    );
  }

  return (
    <button
      onClick={() => onReopen(year.id)}
      className={`inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-[8px] transition-colors cursor-pointer ${visibility}`}
    >
      <RotateCcw size={12} />
      Reopen
    </button>
  );
}

/**
 * Mobile card row — replaces the wide table on small screens.
 */
function SchoolYearCard({ year, onReopen, onClose }) {
  const isReopened = year.status === "Reopened";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isReopened ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-400"
          }`}
        >
          <Archive size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[0.88rem] font-semibold text-slate-800 leading-tight truncate">
                {year.label}
              </p>
              <p className="text-[0.72rem] text-slate-400 mt-0.5">{year.dateRange}</p>
            </div>
            <StatusBadge status={year.status} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[0.78rem] text-slate-500">
              <span className="text-[1.05rem] font-black text-slate-800">{year.totalFiles}</span>{" "}
              files
            </p>
            <YearActions year={year} onReopen={onReopen} onClose={onClose} alwaysVisible />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Desktop table row.
 */
function SchoolYearRow({ year, onReopen, onClose }) {
  const isReopened = year.status === "Reopened";

  return (
    <tr className="group border-b border-slate-100 last:border-b-0 transition-colors duration-150 hover:bg-slate-50/80">
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
      <td className="px-5 py-4 align-middle">
        <StatusBadge status={year.status} />
      </td>
      <td className="px-5 py-4 align-middle text-right">
        <p className="text-[1.15rem] font-black text-slate-800 leading-none">
          {year.totalFiles}
        </p>
        <p className="text-[0.68rem] text-slate-400 mt-0.5">files</p>
      </td>
      <td className="px-5 py-4 align-middle text-right">
        <YearActions year={year} onReopen={onReopen} onClose={onClose} />
      </td>
    </tr>
  );
}

/**
 * PreviousSchoolYearsTable — Archived school years list.
 * Cards on mobile, table from `sm` up.
 */
export default function PreviousSchoolYearsTable({ years = [], onReopen, onClose }) {
  const reopenedCount = years.filter((y) => y.status === "Reopened").length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="min-w-0">
          <h2 className="text-[1rem] sm:text-[1.05rem] font-bold text-slate-800">
            Previous School Years{" "}
            <span className="text-[0.78rem] font-semibold text-slate-400 ml-1">
              {years.length}
            </span>
          </h2>
          <p className="text-[0.72rem] text-slate-400 font-medium mt-0.5">
            {reopenedCount > 0
              ? `${reopenedCount} year${reopenedCount > 1 ? "s" : ""} currently reopened for late submissions`
              : "Archived years are read-only"}
          </p>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {years.length > 0 ? (
          years.map((year) => (
            <SchoolYearCard
              key={year.id}
              year={year}
              onReopen={onReopen}
              onClose={onClose}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-12 text-center">
            <p className="text-[0.95rem] font-medium text-slate-500">
              No previous school years available.
            </p>
          </div>
        )}
        <p className="text-[11px] text-slate-400 px-1 pt-1">
          ○ Use <span className="font-semibold text-blue-500">Reopen</span> for late
          submissions, or <span className="font-semibold text-slate-500">Close</span> to
          lock again.
        </p>
      </div>

      {/* Desktop table */}
      <div
        className="hidden sm:block overflow-hidden rounded-[16px] border border-slate-100/80 bg-white"
        style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
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
        </div>

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
