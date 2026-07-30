import React, { useState, useEffect } from "react";
import { School, Users, GraduationCap, Building } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   Static stat data — public API unchanged
───────────────────────────────────────────────────────────────── */
const stats = [
  {
    icon: School,
    value: "64",
    label: "Schools",
    trend: "+3",
    color: "#3b82f6",
    floodFrom: "#5b9bff",
    floodTo: "#2352d6",
    hasBreakdown: true,
    breakdown: {
      title: "SCHOOL BREAKDOWN",
      rows: [
        { label: "Public Schools",  value: 30, pct: 46.9 },
        { label: "Private Schools", value: 34, pct: 53.1 },
      ],
    },
  },
  { icon: Users,         value: "41,000", label: "Students",   trend: "+2.4k", color: "#6366f1", floodFrom: "#818cf8", floodTo: "#4338ca" },
  { icon: GraduationCap, value: "928",    label: "Teachers",   trend: "+18",   color: "#10b981", floodFrom: "#34d399", floodTo: "#047857" },
  { icon: Building,      value: "9,500",  label: "Classrooms", trend: "+120",  color: "#f59e0b", floodFrom: "#fbbf24", floodTo: "#b45309" },
];

/* ─────────────────────────────────────────────────────────────────
   Animation CSS

   FIX — use px radius (0px → 700px) so the browser interpolates
   a single unitless number.  Mixing % and px causes a unit-change
   stutter on Chrome/Safari.  700 px is large enough to cover any
   stat card (max card width ≈ 280px, diagonal ≈ 390px).

   Easing: cubic-bezier(0.22, 1, 0.36, 1) is an iOS spring curve —
   fast start, smooth deceleration, no overshoot.
───────────────────────────────────────────────────────────────── */
const ANIMATION_CSS = `
/* ── Card shell ─────────────────────────────────────────────── */
.hs-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

/* ── Flood layer (radial reveal) ────────────────────────────── */
/*
   TIMING MATH (hover-in, 950ms ease-out):
   Card dims ≈ 270px wide × 160px tall.
   Icon centre: 39px, 39px.
   Farthest card corner (bottom-right) ≈ 270px from icon.
   With cubic-bezier(0.4,0,0.2,1) the circle hits 270px radius
   at roughly t ≈ 440ms  →  breakdown starts fading in at 440ms.
*/
.hs-flood {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  clip-path: circle(0px at 39px 39px);
  /* Smooth, steady ease-out — no spring shoot */
  transition: clip-path 950ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: clip-path;
  pointer-events: none;
  z-index: 1;
}
.hs-card:hover .hs-flood {
  clip-path: circle(700px at 39px 39px);
}
/* Reverse: breakdown disappears in 140ms, then flood contracts */
.hs-card:not(:hover) .hs-flood {
  transition: clip-path 820ms cubic-bezier(0.4, 0, 0.2, 1) 140ms;
}

/* ── Default content ─────────────────────────────────────────── */
.hs-default {
  position: relative;
  z-index: 2;
  transition:
    opacity   220ms cubic-bezier(0.4, 0, 1, 1) 0ms,
    transform 220ms cubic-bezier(0.4, 0, 1, 1) 0ms;
  will-change: opacity, transform;
}
.hs-card:hover .hs-default {
  opacity: 0;
  transform: translateY(-6px);
}
/* Re-enters: flood has finished contracting by ~960ms → show at 720ms */
.hs-card:not(:hover) .hs-default {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity   260ms cubic-bezier(0, 0, 0.2, 1) 720ms,
    transform 260ms cubic-bezier(0, 0, 0.2, 1) 720ms;
}

/* ── Breakdown overlay ───────────────────────────────────────── */
.hs-breakdown {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 22px;
  pointer-events: none;
  opacity: 0;
  transform: translateY(10px);
  /* Fast exit so flood can begin contracting unobstructed */
  transition:
    opacity   140ms cubic-bezier(0.4, 0, 1, 1) 0ms,
    transform 140ms cubic-bezier(0.4, 0, 1, 1) 0ms;
  will-change: opacity, transform;
}
.hs-card:hover .hs-breakdown {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  /*
    Delay 440ms = moment the circle covers the card fully.
    Duration 280ms  → fully opaque by 720ms.
    Progress bars start at 560ms.
  */
  transition:
    opacity   280ms cubic-bezier(0, 0, 0.2, 1) 440ms,
    transform 280ms cubic-bezier(0, 0, 0.2, 1) 440ms;
}

/* ── Progress bars ───────────────────────────────────────────── */
.hs-bar-track {
  height: 5px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
  margin-top: 8px;
}
.hs-bar-fill {
  height: 100%;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.84);
  width: 0%;
  /* Instant collapse on leave */
  transition: width 120ms ease-in 0ms;
  will-change: width;
}
.hs-card:hover .hs-bar-fill {
  /* Starts at 560ms — breakdown text is already visible */
  transition: width 700ms cubic-bezier(0.4, 0, 0.2, 1) 560ms;
}
`;

/* ─────────────────────────────────────────────────────────────────
   SchoolBreakdown overlay
───────────────────────────────────────────────────────────────── */
function SchoolBreakdown({ breakdown, hovered }) {
  return (
    <div className="hs-breakdown">
      {/* Title */}
      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 900,
          color: "rgba(255,255,255,0.65)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "14px",
          lineHeight: 1,
        }}
      >
        {breakdown.title}
      </p>

      {/* Rows */}
      {breakdown.rows.map((row, i) => (
        <div
          key={row.label}
          style={{ marginBottom: i < breakdown.rows.length - 1 ? "16px" : 0 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.01em",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              {row.value}
            </span>
          </div>

          <div className="hs-bar-track">
            <div
              className="hs-bar-fill"
              style={{ width: hovered ? `${row.pct}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HeroStats — public API unchanged
───────────────────────────────────────────────────────────────── */
export function HeroStats() {
  /* Inject styles once; remove on unmount */
  useEffect(() => {
    const id = "hs-anim-styles";
    if (document.getElementById(id)) return;
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = ANIMATION_CSS;
    document.head.appendChild(tag);
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const [schoolHover, setSchoolHover] = useState(false);

  return (
    <section
      className="relative z-20 pt-4 pb-20"
      style={{ background: "linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => {
            const isSchool = !!s.hasBreakdown;

            return (
              <div
                key={s.label}
                className="hs-card group rounded-[16px] bg-white px-5 py-5 transition-all duration-300 hover:-translate-y-[3px]"
                style={{
                  boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    `0 10px 32px rgba(15,23,42,0.10), 0 0 0 1px ${s.color}28`;
                  if (isSchool) setSchoolHover(true);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)";
                  if (isSchool) setSchoolHover(false);
                }}
              >
                {/* Flood layer — Schools card only */}
                {isSchool && (
                  <div
                    className="hs-flood"
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(135deg, ${s.floodFrom} 0%, ${s.floodTo} 100%)`,
                    }}
                  />
                )}

                {/* Default card content */}
                <div className={isSchool ? "hs-default" : undefined}>
                  <div className="flex items-center justify-between mb-4">
                    {/* Solid gradient circle — same design for all 4 cards */}
                    <div
                      className="flex h-[38px] w-[38px] items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${s.floodFrom ?? s.color} 0%, ${s.floodTo ?? s.color} 100%)`,
                      }}
                    >
                      <s.icon size={18} color="#ffffff" strokeWidth={2} />
                    </div>

                    {/* Trend badge */}
                    <span
                      className="text-[0.62rem] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: `${s.color}12`, color: s.color }}
                    >
                      ↗ {s.trend}
                    </span>
                  </div>

                  <p className="text-[1.65rem] font-black text-slate-800 tracking-tight leading-none">
                    {s.value}
                  </p>
                  <p className="text-[0.7rem] font-semibold text-slate-400 mt-1.5 tracking-wide">
                    {s.label}
                  </p>
                </div>

                {/* Breakdown overlay — Schools card only */}
                {isSchool && (
                  <SchoolBreakdown breakdown={s.breakdown} hovered={schoolHover} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
