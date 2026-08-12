import {
  CheckCircle2,
  XCircle,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Clock,
  Activity,
} from "lucide-react";
import ActionBadge from "./ActionBadge";
import StatusBadge from "./StatusBadge";
import UserAvatar from "./UserAvatar";
import { parsePerformedOn } from "./auditLogsUtils";

function LogDetailsCard({ log, hasFile }) {
  const { date, time } = parsePerformedOn(log.performedOn);
  return (
    <div className="w-72 rounded-2xl bg-white text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-200">
      <div className="flex items-start gap-3 p-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
          <Activity size={18} className="text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-slate-800 leading-tight line-clamp-2">
            {hasFile ? log.fileName : log.action}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
              {log.action}
            </span>
            {log.status === "Success" || log.status === "Verified" ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                <CheckCircle2 size={9} /> {log.status}
              </span>
            ) : log.status === "Pending" ? (
              <span className="inline-flex items-center gap-0.5 text-amber-500 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                <Clock size={9} /> {log.status}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">
                <XCircle size={9} /> {log.status}
              </span>
            )}
          </p>
        </div>
      </div>

      {log.details && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            DETAILS
          </p>
          <p className="text-[11px] font-medium text-slate-700 leading-relaxed break-words">
            {log.details}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-px m-3 rounded-xl overflow-hidden bg-slate-200/50">
        <div className="bg-slate-50 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1">
            <User size={9} /> By
          </p>
          <p className="text-[11px] font-semibold text-slate-700 truncate">
            {log.performedBy}
          </p>
        </div>
        <div className="bg-slate-50 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1">
            <Calendar size={9} /> On
          </p>
          <p className="text-[11px] font-semibold text-slate-700 truncate">
            {date}
            {time ? ` · ${time}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function AuditLogMobileCard({ log }) {
  const { date, time } = parsePerformedOn(log.performedOn);
  const hasFile = log.fileName && log.fileName !== "N/A";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <ActionBadge action={log.action} />
        <StatusBadge status={log.status} />
      </div>

      <div className="flex items-start gap-2.5 mb-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 border border-slate-100">
          <FileText size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
            {hasFile ? log.fileName : log.action}
          </p>
          {log.details && (
            <p className="mt-0.5 text-[0.75rem] text-slate-500 line-clamp-2">
              {log.action === "Other" && log.details.includes("changed")
                ? "Role Change"
                : log.details}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <UserAvatar name={log.performedBy} className="h-7 w-7 text-[10px]" />
          <div className="min-w-0">
            <p className="text-[0.78rem] font-semibold text-slate-700 truncate">
              {log.performedBy}
            </p>
            {log.role ? (
              <p className="text-[0.68rem] font-medium text-blue-600 truncate">
                {log.role}
              </p>
            ) : null}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[0.72rem] font-semibold text-slate-700">{date}</p>
          {time && (
            <p className="text-[0.68rem] text-slate-400 flex items-center justify-end gap-1">
              <Clock size={10} />
              {time}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function AuditLogRow({ log, index, total }) {
  const { date, time } = parsePerformedOn(log.performedOn);
  const hasFile = log.fileName && log.fileName !== "N/A";

  const isNearBottom = index >= Math.ceil(total / 2) && total > 3;
  const popoverPos = isNearBottom
    ? "bottom-[calc(100%+8px)] origin-bottom-left"
    : "top-[calc(100%+8px)] origin-top-left";

  return (
    <tr className="group border-b border-slate-100 last:border-b-0 transition-colors duration-200 hover:bg-slate-50/80 relative">
      <td className="px-3 py-4 align-middle">
        <ActionBadge action={log.action} />
      </td>

      <td className="px-3 py-4 align-middle group/td">
        <div className="relative block w-full cursor-help">
          <div className="flex min-w-0 items-start gap-2">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:bg-white group-hover:text-slate-500">
              <FileText size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 whitespace-normal break-words line-clamp-2">
                {hasFile ? log.fileName : "—"}
              </p>
              {log.details && (
                <p className="mt-0.5 truncate text-xs text-slate-400 w-full">
                  {log.action === "Other" && log.details.includes("changed")
                    ? "Role Change"
                    : log.details}
                </p>
              )}
            </div>
          </div>

          <div
            className={`absolute z-[100] left-[40px] ${popoverPos} opacity-0 invisible scale-95 pointer-events-none group-hover/td:opacity-100 group-hover/td:visible group-hover/td:scale-100 group-hover/td:pointer-events-auto transition-all duration-200`}
          >
            <LogDetailsCard log={log} hasFile={hasFile} />
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

function PaginationBar({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 px-3 sm:px-5 py-3">
      <p className="text-xs text-slate-400 text-center sm:text-left">
        Page <span className="font-semibold text-slate-600">{currentPage}</span> of{" "}
        <span className="font-semibold text-slate-600">{totalPages}</span>
      </p>
      <div className="grid grid-cols-2 sm:flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex min-h-[44px] sm:min-h-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex min-h-[44px] sm:min-h-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-16 sm:py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        <ClipboardList size={28} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">No audit logs yet</p>
        <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
          Audit log entries will appear here once system activities are recorded.
        </p>
      </div>
    </div>
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
      className="rounded-2xl border border-slate-200/80 bg-white transition-shadow duration-300 hover:shadow-[0_6px_20px_rgba(15,23,42,0.05)] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 sm:px-5 py-3">
        <p className="text-[0.8rem] sm:text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">{shown}</span> of{" "}
          <span className="font-semibold text-slate-700">{total}</span> log
          entries
        </p>
      </div>

      {/* Mobile / tablet card list */}
      <div className="lg:hidden">
        {logs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-3 sm:p-4 space-y-3">
            {logs.map((log) => (
              <AuditLogMobileCard key={log.id} log={log} />
            ))}
          </div>
        )}
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-fixed min-w-[1000px]">
          <colgroup>
            <col className="w-48 lg:w-56" />
            <col className="w-auto" />
            <col className="w-44 lg:w-52" />
            <col className="w-36 lg:w-44" />
            <col className="w-32 lg:w-36" />
            <col className="w-28 lg:w-32" />
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
              ].map((heading) => (
                <th
                  key={heading}
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
                <td colSpan={6}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <AuditLogRow
                  key={log.id}
                  log={log}
                  index={index}
                  total={logs.length}
                />
              ))
            )}
          </tbody>
        </table>
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
