import { Zap, RefreshCw, CheckCircle2, Calendar } from "lucide-react";

/**
 * AuditLogsOverview — Optional mini summary strip.
 * Renders only cards whose values are provided. Does not invent values.
 *
 * @param {string|number} [activitiesToday]
 * @param {string}        [lastSynchronized]
 * @param {string}        [systemStatus]
 * @param {string}        [date]
 */
export default function AuditLogsOverview({
  activitiesToday,
  lastSynchronized,
  systemStatus,
  date,
}) {
  const cards = [
    {
      key: "activitiesToday",
      label: "Activities today",
      value: activitiesToday,
      icon: Zap,
      iconClass: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      key: "lastSynchronized",
      label: "Last synchronized",
      value: lastSynchronized,
      icon: RefreshCw,
      iconClass: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      key: "systemStatus",
      label: "System status",
      value: systemStatus,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      key: "date",
      label: "Date",
      value: date,
      icon: Calendar,
      iconClass: "text-violet-600",
      iconBg: "bg-violet-50",
    },
  ].filter((card) => card.value !== undefined && card.value !== null && card.value !== "");

  if (cards.length === 0) return null;

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
            style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.03)" }}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.iconClass} transition-transform duration-200 group-hover:scale-105`}
            >
              <Icon size={16} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400">{card.label}</p>
              <p className="truncate text-sm font-semibold text-slate-800">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
