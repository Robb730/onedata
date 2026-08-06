/**
 * TransitionReadinessCard — Progress bar card showing transition readiness %.
 * Static presentational component; no backend logic.
 *
 * @param {number} progress — 0-100 static percentage value
 */
export default function TransitionReadinessCard({ progress = 60 }) {
  // Color changes based on progress bracket
  const barColor =
    progress >= 80
      ? "bg-emerald-500"
      : progress >= 50
      ? "bg-amber-400"
      : "bg-red-400";

  const textColor =
    progress >= 80
      ? "text-emerald-500"
      : progress >= 50
      ? "text-amber-500"
      : "text-red-500";

  return (
    <div
      className="rounded-[16px] border border-slate-100/80 bg-white px-6 py-5 mb-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-[0.95rem] font-bold text-slate-800 tracking-tight">
            Transition Readiness
          </h3>
          <p className="text-[0.75rem] text-slate-400 font-medium mt-0.5">
            Almost ready. Complete remaining requirements before transition.
          </p>
        </div>
        <span className={`text-[2rem] font-black leading-none ${textColor}`}>
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
