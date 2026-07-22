import { getActionMeta } from "./auditLogsUtils";

/**
 * ActionBadge — Colored pill for an audit action type.
 * @param {string} action
 */
export default function ActionBadge({ action }) {
  const meta = getActionMeta(action);
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${meta.className}`}
    >
      <Icon size={13} className={meta.iconClass} strokeWidth={2.25} />
      {action}
    </span>
  );
}
