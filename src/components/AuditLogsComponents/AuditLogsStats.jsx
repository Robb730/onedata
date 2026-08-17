import { Upload, Download, CheckCircle, FileText } from "lucide-react";

/**
 * MetricCard — Matches Manage Users summary cards:
 * icon top-left, large value top-right, uppercase label below.
 */
function MetricCard({ label, value, icon, gradient }) {
  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] lg:hover:-translate-y-[2px] shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-300 group-hover:scale-105"
          style={{ background: gradient }}
        >
          {icon}
        </div>
        <p className="text-xl sm:text-[1.75rem] font-black text-slate-800 tracking-tight leading-none">
          {value}
        </p>
      </div>
      <p className="text-[0.55rem] sm:text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.06em] sm:tracking-[0.08em] leading-snug">
        {label}
      </p>
    </div>
  );
}

/**
 * AuditLogsStats — Action count cards derived from existing log totals.
 *
 * @param {{ Upload: number, Download: number, Verify: number, Other: number }} actionCounts
 */
export default function AuditLogsStats({ actionCounts }) {
  const cards = [
    {
      key: "uploads",
      label: "UPLOADS",
      value: actionCounts?.Upload ?? 0,
      icon: <Upload size={18} className="text-white" />,
      gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
    },
    {
      key: "downloads",
      label: "DOWNLOADS",
      value: actionCounts?.Download ?? 0,
      icon: <Download size={18} className="text-white" />,
      gradient: "linear-gradient(135deg, #c084fc 0%, #9333ea 100%)",
    },
    {
      key: "verifications",
      label: "VERIFICATIONS",
      value: actionCounts?.Verify ?? 0,
      icon: <CheckCircle size={18} className="text-white" />,
      gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
    },
    {
      key: "other",
      label: "OTHER ACTIONS",
      value: actionCounts?.Other ?? 0,
      icon: <FileText size={18} className="text-white" />,
      gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-7">
      {cards.map(({ key, ...card }) => (
        <MetricCard key={key} {...card} />
      ))}
    </div>
  );
}
