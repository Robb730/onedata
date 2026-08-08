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
      title={action}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold max-w-[180px] transition-colors duration-200 ${meta.className}`}
    >
      <Icon size={13} className={`shrink-0 ${meta.iconClass}`} strokeWidth={2.25} />
      <span className="truncate">{action}</span>
    </span>
  );
}
