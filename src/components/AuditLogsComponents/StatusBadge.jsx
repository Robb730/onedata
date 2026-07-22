import { getStatusMeta } from "./auditLogsUtils";

/**
 * StatusBadge — Pill badge for log status.
 * @param {string} status
 */
export default function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${meta.className}`}
    >
      <Icon size={13} strokeWidth={2.25} />
      {status}
    </span>
  );
}
