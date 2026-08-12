/**
 * AuditLogsFooter — Results count, read-only note, and existing pagination controls.
 */
export default function AuditLogsFooter({
  shownCount,
  totalCount,
  disclaimer = "Audit data is read-only · Exported logs are tamper-proof.",
  pagination,
}) {
  return (
    <div className="mt-4 sm:mt-5 mb-2 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-[0.8rem] sm:text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">{shownCount}</span>
          {totalCount !== undefined && (
            <>
              {" "}
              of{" "}
              <span className="font-semibold text-slate-700">{totalCount}</span>
            </>
          )}{" "}
          results
        </p>
        {disclaimer && (
          <p className="text-[0.7rem] sm:text-xs text-slate-400">{disclaimer}</p>
        )}
      </div>

      {pagination && (
        <div className="flex items-center gap-2">{pagination}</div>
      )}
    </div>
  );
}
