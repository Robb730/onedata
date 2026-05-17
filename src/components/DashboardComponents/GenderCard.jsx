import {useState} from "react";

export function GenderCard({ label, total, publicCount, privateCount, accent, hoverAccent }) {
  const [hovered, setHovered] = useState(false);

  const publicPct = total > 0 ? Math.round((publicCount / total) * 100) : 0;
  const privatePct = 100 - publicPct;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderColor: hovered ? accent : "transparent",
        transition: "all 0.2s ease",
      }}
      className="relative rounded-xl border bg-white p-4 shadow-sm overflow-hidden cursor-default"
    >
      {/* Subtle color wash in background */}
      <div
        style={{ backgroundColor: accent, opacity: hovered ? 0.06 : 0.03, transition: "opacity 0.2s ease" }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Default view — total */}
      <div style={{ opacity: hovered ? 0 : 1, transition: "opacity 0.15s ease", position: hovered ? "absolute" : "relative" }}>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-1">{label}</p>
        <p style={{ color: accent }} className="text-2xl font-bold tabular-nums">
          {total.toLocaleString()}
        </p>
      </div>

      {/* Hover view — public / private split */}
      <div style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.15s ease", position: hovered ? "relative" : "absolute", top: hovered ? "auto" : 0, left: hovered ? "auto" : 0, right: hovered ? "auto" : 0 }}>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-2">{label} breakdown</p>

        {/* Progress bar */}
        <div className="flex rounded-full overflow-hidden h-1.5 mb-3">
          <div style={{ width: `${publicPct}%`, backgroundColor: accent }} />
          <div style={{ width: `${privatePct}%`, backgroundColor: hoverAccent }} />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-0.5">
              <span style={{ backgroundColor: accent }} className="h-1.5 w-1.5 rounded-full" />
              <span className="text-[0.6rem] text-slate-400 font-medium uppercase tracking-wide">Public</span>
            </div>
            <p style={{ color: accent }} className="text-base font-bold tabular-nums">
              {publicCount.toLocaleString()}
            </p>
            <p className="text-[0.6rem] text-slate-400">{publicPct}%</p>
          </div>
          <div className="w-px bg-slate-100" />
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-0.5">
              <span style={{ backgroundColor: hoverAccent }} className="h-1.5 w-1.5 rounded-full" />
              <span className="text-[0.6rem] text-slate-400 font-medium uppercase tracking-wide">Private</span>
            </div>
            <p style={{ color: hoverAccent }} className="text-base font-bold tabular-nums">
              {privateCount.toLocaleString()}
            </p>
            <p className="text-[0.6rem] text-slate-400">{privatePct}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}