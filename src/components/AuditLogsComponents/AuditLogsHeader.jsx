import { Download } from "lucide-react";

/**
 * AuditLogsHeader — Page title, subtitle, and export action.
 *
 * @param {string}   [title]
 * @param {string}   [subtitle]
 * @param {function} [onExport] — optional; export remains non-wired if omitted
 */
export default function AuditLogsHeader({
  title = "Audit Logs",
  subtitle = "Complete history of all system activities, file actions, and user events.",
  onExport,
}) {
  return (
    <div className="mb-5 sm:mb-7 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
          {title}
        </h1>
        <p className="hidden lg:block text-[0.78rem] text-slate-400 font-medium mt-1 max-w-xl">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onExport}
        className="hidden lg:inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-px active:scale-[0.98] cursor-pointer"
      >
        <Download size={16} strokeWidth={2.25} />
        Export Logs
      </button>
    </div>
  );
}
