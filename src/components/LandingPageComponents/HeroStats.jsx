import React, { useState } from "react";
import { School, Users, GraduationCap, Building } from "lucide-react";

const stats = [
  { icon: School, value: "64", label: "Schools", trend: "+3", color: "#3b82f6", hasBreakdown: true },
  { icon: Users, value: "41,000", label: "Students", trend: "+2.4k", color: "#6366f1" },
  { icon: GraduationCap, value: "928", label: "Teachers", trend: "+18", color: "#10b981" },
  { icon: Building, value: "9,500", label: "Classrooms", trend: "+120", color: "#f59e0b" },
];

/* ── Schools breakdown sub-component ──────────────── */
function SchoolBreakdown({ visible }) {
  return (
    <div
      className="absolute inset-0 rounded-[16px] flex flex-col justify-center px-5 py-5 transition-all duration-400 ease-in-out"
      style={{
        background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        pointerEvents: visible ? "auto" : "none",
        zIndex: 10,
      }}
    >
      <p className="text-[0.62rem] font-bold text-blue-500 uppercase tracking-[0.1em] mb-3">
        School Breakdown
      </p>
      {/* Public */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[0.65rem] font-semibold text-slate-500">Public Schools</span>
          <span className="text-[0.85rem] font-black text-slate-800">30</span>
        </div>
        <div className="h-[5px] rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: visible ? "46.9%" : "0%",
              background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
            }}
          />
        </div>
      </div>
      {/* Private */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[0.65rem] font-semibold text-slate-500">Private Schools</span>
          <span className="text-[0.85rem] font-black text-slate-800">34</span>
        </div>
        <div className="h-[5px] rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: visible ? "53.1%" : "0%",
              background: "linear-gradient(90deg, #10b981, #34d399)",
              transitionDelay: "100ms",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function HeroStats() {
  const [schoolHover, setSchoolHover] = useState(false);

  return (
    <section
      className="relative z-20 pb-20"
      style={{
        background: "linear-gradient(to bottom, #0a0f1e 0%, #111827 40%, #eef2f7 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => {
            const isSchool = s.hasBreakdown;

            return (
              <div
                key={s.label}
                className="group relative rounded-[16px] bg-white px-5 py-5 transition-all duration-300 hover:-translate-y-[3px]"
                style={{
                  boxShadow:
                    "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    `0 8px 30px rgba(15,23,42,0.1), 0 0 0 1px ${s.color}20`;
                  if (isSchool) setSchoolHover(true);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03)";
                  if (isSchool) setSchoolHover(false);
                }}
              >
                {/* Default content */}
                <div
                  className="transition-all duration-400 ease-in-out"
                  style={{
                    opacity: isSchool && schoolHover ? 0 : 1,
                    transform: isSchool && schoolHover ? "translateY(-6px)" : "translateY(0)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${s.color}10` }}
                    >
                      <s.icon size={17} style={{ color: s.color }} strokeWidth={2} />
                    </div>
                    <span
                      className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${s.color}0c`, color: s.color }}
                    >
                      ↗ {s.trend}
                    </span>
                  </div>
                  <p className="text-[1.6rem] font-black text-slate-800 tracking-tight leading-none">
                    {s.value}
                  </p>
                  <p className="text-[0.68rem] font-medium text-slate-400 mt-1.5">
                    {s.label}
                  </p>
                </div>

                {/* Hover breakdown (Schools card only) */}
                {isSchool && <SchoolBreakdown visible={schoolHover} />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
