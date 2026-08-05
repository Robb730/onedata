
import { FileText, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import ActionBadge from "./ActionBadge";
import StatusBadge from "./StatusBadge";
import UserAvatar from "./UserAvatar";
import { parsePerformedOn } from "./auditLogsUtils";

function AuditLogRow({ log }) {
  const { date, time } = parsePerformedOn(log.performedOn);
  const hasFile = log.fileName && log.fileName !== "N/A";

  return (
    <tr className="group border-b border-slate-100 last:border-b-0 transition-colors duration-200 hover:bg-slate-50/80">
      <td className="px-3 py-4 align-middle">
        <ActionBadge action={log.action} />
      </td>

      <td className="px-3 py-4 align-middle">
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:bg-white group-hover:text-slate-500">
            <FileText size={13} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {hasFile ? log.fileName : "—"}
            </p>
            {log.details && (
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {log.details}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-3 py-4 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar name={log.performedBy} />
          <span className="truncate text-sm font-medium text-slate-700">
            {log.performedBy}
          </span>
        </div>
      </td>

      <td className="px-3 py-4 align-middle">
        {log.role ? (
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 whitespace-nowrap">
            {log.role}
          </span>
        ) : null}
      </td>

      <td className="px-3 py-4 align-middle whitespace-nowrap">
        <p className="text-sm font-semibold text-slate-800">{date}</p>
        {time && <p className="mt-0.5 text-xs text-slate-400">{time}</p>}
      </td>

      <td className="px-3 py-4 align-middle">
        <StatusBadge status={log.status} />
      </td>
    </tr>
  );
}

export default function AuditLogsTable({
  logs = [],
  totalCount,
  filteredCount,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  const shown = filteredCount ?? logs.length;
  const total = totalCount ?? logs.length;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white transition-shadow duration-300 hover:shadow-[0_6px_20px_rgba(15,23,42,0.05)]"
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">{shown}</span> of{" "}
          <span className="font-semibold text-slate-700">{total}</span> log
          entries
        </p>
      </div>

      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[11%]" />
          <col className="w-[29%]" />
          <col className="w-[20%]" />
          <col className="w-[15%]" />
          <col className="w-[14%]" />
          <col className="w-[11%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            {[
              "Action",
              "File / Details",
              "Performed By",
              "Role",
              "Date & Time",
              "Status",
            ].map((heading, i) => (
              <th
                key={i}
                className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                    <ClipboardList size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      No audit logs yet
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Audit log entries will appear here once system activities are recorded.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            logs.map((log) => <AuditLogRow key={log.id} log={log} />)
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">
            Page <span className="font-semibold text-slate-600">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-600">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}