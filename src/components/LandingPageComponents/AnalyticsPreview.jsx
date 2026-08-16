import React from "react";
import { SectionHeader } from "./SectionHeader";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

/* ── Mock data (unchanged) ────────────────────────── */
const enrollmentData = [
  { name: "Elementary", public: 450, private: 180 },
  { name: "Junior High", public: 380, private: 120 },
  { name: "Senior High", public: 200, private: 90 },
  { name: "ALS", public: 35, private: 0 },
];

const genderData = [
  { name: "Male", value: 51, color: "#3b82f6" },
  { name: "Female", value: 49, color: "#10b981" },
];

const educTypeData = [
  { name: "Formal", value: 98, color: "#3b82f6" },
  { name: "ALS", value: 2, color: "#94a3b8" },
];

const gradeData = [
  { grade: "G1", public: 120, private: 40 },
  { grade: "G2", public: 115, private: 38 },
  { grade: "G3", public: 118, private: 42 },
  { grade: "G4", public: 110, private: 36 },
  { grade: "G5", public: 105, private: 35 },
  { grade: "G6", public: 100, private: 32 },
  { grade: "G7", public: 140, private: 48 },
  { grade: "G8", public: 135, private: 45 },
  { grade: "G9", public: 130, private: 40 },
  { grade: "G10", public: 120, private: 38 },
  { grade: "G11", public: 100, private: 45 },
  { grade: "G12", public: 95, private: 42 },
];

/* ── Shared dark tooltip (unchanged) ─────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[10px] px-4 py-3 text-[0.7rem]"
      style={{
        background: "rgba(15,23,42,0.94)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      <p className="text-white/50 font-semibold mb-1.5 text-[0.62rem] uppercase tracking-wide">
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium leading-relaxed">
          {p.name}: <span className="font-bold">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

/* ── Improved chart card wrapper ──────────────────── */
function ChartCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white p-6 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.09)] hover:-translate-y-[2px] hover:border-slate-200 ${className}`}
      style={{ boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
    >
      {children}
    </div>
  );
}

/* ── Improved chart title bar ─────────────────────── */
function ChartTitle({ title, legends = [] }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h4 className="text-[0.88rem] font-bold text-slate-800 leading-tight">{title}</h4>
      </div>
      {legends.length > 0 && (
        <div className="flex items-center gap-4">
          {legends.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-slate-400">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Improved Donut card ──────────────────────────── */
function DonutCard({ title, data, centerLabel, centerValue }) {
  return (
    <ChartCard>
      <div className="mb-4">
        <h4 className="text-[0.88rem] font-bold text-slate-800 leading-tight mb-2.5">{title}</h4>
        <div className="flex items-center gap-4">
          {data.map((d) => (
            <span key={d.name} className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-slate-400">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
              {d.name} ({d.value}%)
            </span>
          ))}
        </div>
      </div>
      <div className="relative h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.6rem] font-black text-slate-800 leading-none">{centerValue}</span>
          <span className="text-[0.62rem] font-semibold text-slate-400 mt-1 uppercase tracking-wide">{centerLabel}</span>
        </div>
      </div>
    </ChartCard>
  );
}

/* ── Sub-section label ────────────────────────────── */
function SubSectionLabel({ title, description }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="h-5 w-[3px] rounded-full bg-blue-500 shrink-0" />
        <h3 className="text-[1.15rem] font-bold text-slate-800 tracking-tight">{title}</h3>
      </div>
      <p className="text-[0.78rem] text-slate-400 font-medium pl-[15px]">{description}</p>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────── */
export function AnalyticsPreview() {
  return (
    <section
      id="analytics"
      className="relative pt-24 pb-28"
      style={{ background: "linear-gradient(180deg, #f1f5f9 0%, #eef2f7 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Section Header */}
        <SectionHeader
          title="Learners"
          subtitle="Demographic distribution and division breakdown across the SDO Baliwag division"
        />

        {/* ── Top row: donuts + division bar ─────── */}
        <div className="grid md:grid-cols-3 gap-5 mb-14">
          <DonutCard
            title="Education Type"
            data={educTypeData}
            centerValue="98%"
            centerLabel="Formal"
          />
          <DonutCard
            title="Gender Split"
            data={genderData}
            centerValue="51%"
            centerLabel="Male"
          />

          <ChartCard>
            <ChartTitle
              title="By Division"
              legends={[
                { label: "Public", color: "#3b82f6" },
                { label: "Private", color: "#10b981" },
              ]}
            />
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData} barGap={2} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f020" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="public" name="Public" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="private" name="Private" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* ── Section divider ───────────────────── */}
        <div className="flex items-center gap-6 mb-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400 shrink-0">
            Breakdown
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-300/60 to-transparent" />
        </div>

        {/* ── Education Breakdown ────────────────── */}
        <SubSectionLabel
          title="Education Breakdown"
          description="By level of education, sector, and grade level"
        />

        <div className="grid md:grid-cols-2 gap-5">
          {/* By Level — horizontal */}
          <ChartCard>
            <ChartTitle
              title="By Level of Education, Sector"
              legends={[
                { label: "Public School", color: "#3b82f6" },
                { label: "Private School", color: "#10b981" },
              ]}
            />
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData} layout="vertical" barGap={2} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f020" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="public" name="Public School" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="private" name="Private School" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* By Grade Level — vertical */}
          <ChartCard>
            <ChartTitle
              title="By Grade Level"
              legends={[
                { label: "Public School", color: "#3b82f6" },
                { label: "Private School", color: "#10b981" },
              ]}
            />
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData} barGap={1} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f020" />
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="public" name="Public School" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="private" name="Private School" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* ── Bottom note ───────────────────────── */}
        <p className="text-center text-[0.72rem] text-slate-400 font-medium mt-10">
          All figures shown are sample data for demonstration purposes only.
        </p>
      </div>
    </section>
  );
}
