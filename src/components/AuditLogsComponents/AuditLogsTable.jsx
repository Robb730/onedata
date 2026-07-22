import { FileText, ClipboardList } from "lucide-react";
import ActionBadge from "./ActionBadge";
import StatusBadge from "./StatusBadge";
import UserAvatar from "./UserAvatar";
import { parsePerformedOn } from "./auditLogsUtils";

/**
 * AuditLogRow — Single table row for an existing audit log entry.
 * @param {object} log
 */
function AuditLogRow({ log }) {
  const { date, time } = parsePerformedOn(log.performedOn);
  const hasFile = log.fileName && log.fileName !== "N/A";

  return (
    <tr className="group border-b border-slate-100 last:border-b-0 transition-colors duration-200 hover:bg-slate-50/80">
      <td className="px-5 py-4 align-middle">
        <ActionBadge action={log.action} />
      </td>

      <td className="px-5 py-4 align-middle">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:bg-white group-hover:text-slate-500">
            <FileText size={15} />
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

      <td className="px-5 py-4 align-middle">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={log.performedBy} />
          <span className="truncate text-sm font-medium text-slate-700">
            {log.performedBy}
          </span>
        </div>
      </td>

      <td className="px-5 py-4 align-middle">
        {log.role ? (
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 whitespace-nowrap">
            {log.role}
          </span>
        ) : null}
      </td>

      <td className="px-5 py-4 align-middle whitespace-nowrap">
        <p className="text-sm font-semibold text-slate-800">{date}</p>
        {time && <p className="mt-0.5 text-xs text-slate-400">{time}</p>}
      </td>

      <td className="px-5 py-4 align-middle">
        <StatusBadge status={log.status} />
      </td>
    </tr>
  );
}

/**
 * AuditLogsTable — Logs table assembled from existing filtered entries.
 *
 * @param {Array}  logs
 * @param {number} [totalCount]
 * @param {number} [filteredCount]
 */
export default function AuditLogsTable({ logs = [], totalCount, filteredCount }) {
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {[
                "Action",
                "File / Details",
                "Performed By",
                "Role",
                "Date & Time",
                "Status",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-20 text-center"
                >
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
      </div>
    </div>
  );
}
