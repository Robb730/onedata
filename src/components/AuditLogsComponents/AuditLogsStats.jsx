import { Upload, Download, CheckCircle, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * MetricCard — Large action-count card with gradient icon circle and
 * color-matched hover glow, replicating the Audit Logs reference design.
 */
function MetricCard({
  label,
  value,
  icon,
  gradient,
  glowColor,
  change,
  changeTone = "neutral",
}) {
  /* Trend indicator icon + color */
  const toneConfig = {
    up:      { icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    down:    { icon: TrendingDown,  color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100" },
    neutral: { icon: Minus,         color: "text-slate-400",   bg: "bg-slate-50",   border: "border-slate-100" },
  };
  const tone = toneConfig[changeTone] || toneConfig.neutral;
  const ToneIcon = tone.icon;

  return (
    <div
      className="group relative rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] lg:hover:-translate-y-[2px] shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start justify-between gap-3 mb-2 sm:mb-4">
        <div
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-transform duration-300 group-hover:scale-105"
          style={{
            background: gradient,
            boxShadow: `0 4px 14px ${glowColor}`,
          }}
        >
          {icon}
        </div>

        {change !== undefined && change !== null && change !== "" && (
          <div
            className={`flex items-center gap-1 rounded-full ${tone.bg} ${tone.border} border px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold ${tone.color}`}
          >
            <ToneIcon size={12} strokeWidth={2.5} />
            <span>{change}</span>
          </div>
        )}
      </div>

      <div className="mt-1">
        <p className="text-xl sm:text-[1.55rem] font-black text-slate-800 tracking-tight leading-none mb-1 sm:mb-1.5">
          {value}
        </p>
        <p className="text-[0.62rem] sm:text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
}

/**
 * AuditLogsStats — Action count cards derived from existing log totals.
 *
 * @param {{ Upload: number, Download: number, Verify: number, Other: number }} actionCounts
 * @param {{ uploads?: string, downloads?: string, verifications?: string, other?: string }} [changes]
 * @param {{ uploads?: "up"|"down"|"neutral", downloads?: "up"|"down"|"neutral", verifications?: "up"|"down"|"neutral", other?: "up"|"down"|"neutral" }} [changeTones]
 */
export default function AuditLogsStats({
  actionCounts,
  changes = {},
  changeTones = {},
}) {
  const cards = [
    {
      key: "uploads",
      label: "Uploads",
      value: actionCounts?.Upload ?? 0,
      icon: <Upload size={22} strokeWidth={2.5} />,
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      glowColor: "rgba(59,130,246,0.25)",
      change: changes.uploads,
      changeTone: changeTones.uploads,
    },
    {
      key: "downloads",
      label: "Downloads",
      value: actionCounts?.Download ?? 0,
      icon: <Download size={22} strokeWidth={2.5} />,
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      glowColor: "rgba(16,185,129,0.25)",
      change: changes.downloads,
      changeTone: changeTones.downloads,
    },
    {
      key: "verifications",
      label: "Verifications",
      value: actionCounts?.Verify ?? 0,
      icon: <CheckCircle size={22} strokeWidth={2.5} />,
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      glowColor: "rgba(6,182,212,0.25)",
      change: changes.verifications,
      changeTone: changeTones.verifications,
    },
    {
      key: "other",
      label: "Other Actions",
      value: actionCounts?.Other ?? 0,
      icon: <FileText size={22} strokeWidth={2.5} />,
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      glowColor: "rgba(245,158,11,0.25)",
      change: changes.other,
      changeTone: changeTones.other,
    },
  ];

  return (
    <div className="mb-5 sm:mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map(({ key, ...card }) => (
        <MetricCard key={key} {...card} />
      ))}
    </div>
  );
}
