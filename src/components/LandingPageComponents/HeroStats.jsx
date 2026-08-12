import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
} from "recharts";
import { CalendarDays, ChevronDown, Search, MapPin } from "lucide-react";
import { useLandingStats } from "../../hooks/useLandingStats";
import { School, Users, GraduationCap, Building } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const CustomTooltip = ({ active, payload, label, totalForPercent }) => {
  if (!active || !payload?.length) return null;
  const sum = totalForPercent ?? payload.reduce((acc, p) => acc + (p.value || 0), 0);
  return (
    <div className="rounded-[12px] px-4 py-3.5 text-[0.7rem] bg-slate-900/95 backdrop-blur-md border border-white/10 shadow-2xl min-w-[150px]">
      {label && (
        <p className="text-white/50 font-semibold mb-2 text-[0.62rem] uppercase tracking-wide">{label}</p>
      )}
      <div className="flex flex-col gap-1.5">
        {payload.map((p) => {
          const pct = sum > 0 ? Math.round(((p.value || 0) / sum) * 100) : 0;
          return (
            <div key={p.dataKey || p.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-white/70 font-medium">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color || p.payload?.color }} />
                {p.name}
              </span>
              <span className="font-bold text-white">
                {p.value?.toLocaleString()}
                <span className="text-white/40 font-semibold ml-1">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-6 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.09)] hover:-translate-y-[2px] ${className}`}>
      {title && <h4 className="text-[0.88rem] font-bold text-slate-800 leading-tight">{title}</h4>}
      {subtitle && <p className="text-[0.7rem] text-slate-400 mt-0.5 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, height = "h-[220px]" }) {
  return (
    <div className={`${height} flex flex-col items-center justify-center gap-2 text-slate-300`}>
      <Icon size={28} strokeWidth={1.5} />
      <span className="text-[0.78rem] font-semibold">Data not yet available</span>
    </div>
  );
}

function YearPicker({ selectedYear, onYearChange, availableYears }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-2 h-[38px] rounded-[10px] border border-slate-200/80 bg-white pl-3 pr-8 hover:border-slate-300 transition-colors min-w-[130px] w-max shadow-sm cursor-pointer"
      >
        <CalendarDays size={14} className="text-blue-500 shrink-0" />
        <span className="text-[0.82rem] font-bold text-slate-700 select-none whitespace-nowrap">
          SY {selectedYear}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`text-slate-400 pointer-events-none absolute right-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-full min-w-[130px] bg-white border border-slate-200 rounded-[10px] shadow-[0_8px_30px_rgba(15,23,42,0.12)] py-1.5 z-50">
          {availableYears.map((year) => {
            const isSelected = selectedYear === year;
            return (
              <button
                key={year}
                onClick={() => { onYearChange(year); setOpen(false); }}
                className={`w-full flex items-center px-3.5 py-2 text-[0.82rem] font-semibold transition-colors ${isSelected ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                {year}
                {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── New: searchable/filterable school directory, replaces the scroll table ── */
function SchoolDirectory({ schoolList }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("All");

  const filtered = React.useMemo(() => {
    return schoolList.filter((s) => {
      const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "All" ||
        (s.category || "").trim().toLowerCase() === filter.toLowerCase();
      return matchesQuery && matchesFilter;
    });
  }, [schoolList, query, filter]);

  const maxEnrollment = Math.max(...schoolList.map((s) => s.enrollment), 1);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search schools…"
            className="w-full h-[38px] rounded-[10px] border border-slate-200/80 bg-slate-50/60 pl-9 pr-3 text-[0.8rem] font-medium text-slate-700 placeholder:text-slate-350 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
          />
        </div>
        <div className="flex gap-1.5 rounded-[10px] bg-slate-50/60 border border-slate-200/80 p-1 w-full sm:w-max">
          {["All", "Public", "Private"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-3 h-[30px] rounded-[8px] text-[0.72rem] font-bold transition-all ${filter === f
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-slate-300 text-[0.78rem] font-medium py-10">
          No schools match "{query}"
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1 -mr-1">
          {filtered.map((s) => {
            const pct = Math.round((s.enrollment / maxEnrollment) * 100);
            const isPublic = (s.category || "").trim().toLowerCase() === "public";
            return (
              <div
                key={s.name}
                className="group rounded-[12px] border border-slate-100 bg-slate-50/40 p-3.5 hover:bg-white hover:border-slate-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ background: isPublic ? "#eff6ff" : "#ecfdf5" }}
                    >
                      <MapPin size={12} style={{ color: isPublic ? "#3b82f6" : "#10b981" }} />
                    </div>
                    <p className="text-[0.78rem] font-bold text-slate-700 leading-tight truncate">
                      {s.name}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{
                      background: isPublic ? "#eff6ff" : "#ecfdf5",
                      color: isPublic ? "#3b82f6" : "#10b981",
                    }}
                  >
                    {s.category}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[0.68rem] font-semibold text-slate-400">Enrollment</span>
                  <span className="text-[0.82rem] font-black text-slate-800">
                    {s.enrollment.toLocaleString()}
                  </span>
                </div>
                <div className="h-[5px] w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: isPublic ? "#3b82f6" : "#10b981",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[0.66rem] text-slate-300 font-medium mt-3 text-center">
        Showing {filtered.length} of {schoolList.length} schools
      </p>
    </div>
  );
}

export function HeroStats({ selectedYear, onYearChange, availableYears }) {
  const { loading, error, learners, schools } = useLandingStats(selectedYear);

  const schoolPieData = [
    { name: "Public", value: schools.public, color: "#3b82f6" },
    { name: "Private", value: schools.private, color: "#10b981" },
  ];

  const learnerPieData = [
    { name: "Public", value: learners.public, color: "#3b82f6" },
    { name: "Private", value: learners.private, color: "#10b981" },
  ];

  const learnersRef = React.useRef(null);
  const schoolsRef = React.useRef(null);
  const teachersRef = React.useRef(null);
  const numSchoolsRef = React.useRef(null);

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const noLearners = learners.total === 0;
  const noSchools = schools.total === 0;

  return (
    <section
      id="analytics"
      className="relative z-20 pt-6 md:pt-4 pb-12 md:pb-20"
      style={{ background: "linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1">
        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-[0.72rem] text-slate-400 font-medium shrink-0">Live enrollment data</p>
          <YearPicker
            selectedYear={selectedYear}
            onYearChange={onYearChange}
            availableYears={availableYears}
          />
        </div>

        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <button
              onClick={() => scrollToSection(learnersRef)}
              className="text-left rounded-[16px] bg-white px-3.5 py-4 sm:px-5 sm:py-5 transition-all duration-300 hover:-translate-y-[3px] cursor-pointer border-none"
              style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)" }}
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full mb-4" style={{ background: "linear-gradient(135deg, #818cf8 0%, #4338ca 100%)" }}>
                <Users size={18} color="#fff" strokeWidth={2} />
              </div>
              <p className="text-[1.35rem] sm:text-[1.65rem] font-black text-slate-800 tracking-tight leading-none">{learners.total.toLocaleString()}</p>
              <p className="text-[0.7rem] font-semibold text-slate-400 mt-1.5 tracking-wide">Learners</p>
            </button>

            <button
              onClick={() => scrollToSection(schoolsRef)}
              className="text-left rounded-[16px] bg-white px-3.5 py-4 sm:px-5 sm:py-5 transition-all duration-300 hover:-translate-y-[3px] cursor-pointer border-none"
              style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)" }}
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full mb-4" style={{ background: "linear-gradient(135deg, #5b9bff 0%, #2352d6 100%)" }}>
                <School size={18} color="#fff" strokeWidth={2} />
              </div>
              <p className="text-[1.35rem] sm:text-[1.65rem] font-black text-slate-800 tracking-tight leading-none">{schools.total.toLocaleString()}</p>
              <p className="text-[0.7rem] font-semibold text-slate-400 mt-1.5 tracking-wide">Schools</p>
            </button>

            <button
              onClick={() => scrollToSection(teachersRef)}
              className="text-left rounded-[16px] bg-white px-3.5 py-4 sm:px-5 sm:py-5 transition-all duration-300 hover:-translate-y-[3px] cursor-pointer border-none"
              style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)" }}
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full mb-4" style={{ background: "linear-gradient(135deg, #34d399 0%, #047857 100%)" }}>
                <GraduationCap size={18} color="#fff" strokeWidth={2} />
              </div>
              <p className="text-[1.35rem] sm:text-[1.65rem] font-black text-slate-800 tracking-tight leading-none">—</p>
              <p className="text-[0.7rem] font-semibold text-slate-400 mt-1.5 tracking-wide">Teachers</p>
            </button>

            <button
              onClick={() => scrollToSection(numSchoolsRef)}
              className="text-left rounded-[16px] bg-white px-3.5 py-4 sm:px-5 sm:py-5 transition-all duration-300 hover:-translate-y-[3px] cursor-pointer border-none"
              style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)" }}
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full mb-4" style={{ background: "linear-gradient(135deg, #fbbf24 0%, #b45309 100%)" }}>
                <Building size={18} color="#fff" strokeWidth={2} />
              </div>
              <p className="text-[1.35rem] sm:text-[1.65rem] font-black text-slate-800 tracking-tight leading-none">—</p>
              <p className="text-[0.7rem] font-semibold text-slate-400 mt-1.5 tracking-wide">Number of Schools</p>
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center text-slate-400 text-sm py-16">Loading enrollment data…</div>
        )}

        {!loading && error && (
          <div className="text-center text-rose-500 text-sm py-16">Couldn't load data: {error}</div>
        )}

        {!loading && !error && (
          <>
            {/* ── Learners section ─────────────────── */}
            <div ref={learnersRef} className="mb-10 md:mb-14 scroll-mt-20">
              <SectionHeader
                label="Dashboard Overview"
                title="Learners"
                subtitle="Demographic distribution and enrollment breakdown across schools"
              />

              <div className="grid md:grid-cols-2 gap-5">
                <ChartCard
                  title="Learners"
                  subtitle={`${learners.total.toLocaleString()} total enrolled`}
                >
                  {noLearners ? (
                    <EmptyState icon={Users} height="h-[220px]" />
                  ) : (
                    <div className="relative h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <linearGradient id="gradPublic" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#60a5fa" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                            <linearGradient id="gradPrivate" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#34d399" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={learnerPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={85}
                            paddingAngle={4}
                            cornerRadius={6}
                            dataKey="value"
                            stroke="none"
                          >
                            {learnerPieData.map((e, i) => (
                              <Cell
                                key={i}
                                fill={e.name === "Public" ? "url(#gradPublic)" : "url(#gradPrivate)"}
                                className="transition-opacity duration-200 cursor-pointer hover:opacity-85"
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip totalForPercent={learners.total} />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[1.5rem] font-black text-slate-800 leading-none">
                          {learners.total.toLocaleString()}
                        </span>
                        <span className="text-[0.62rem] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          Total
                        </span>
                      </div>
                    </div>
                  )}

                  {!noLearners && (
                    <div className="flex justify-center gap-3 mt-3 flex-wrap">
                      {learnerPieData.map((d) => {
                        const pct = learners.total > 0 ? Math.round((d.value / learners.total) * 100) : 0;
                        return (
                          <div
                            key={d.name}
                            className="flex items-center gap-2 rounded-full bg-slate-50/70 border border-slate-100 px-3 py-1.5"
                          >
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                            <span className="text-[0.7rem] font-semibold text-slate-500">{d.name}</span>
                            <span className="text-[0.7rem] font-black text-slate-800">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ChartCard>

                <ChartCard title="Learners by Level" subtitle="Public vs. Private breakdown per level">
                  {noLearners ? (
                    <EmptyState icon={Users} height="h-[280px]" />
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={learners.byLevel} barGap={4} barSize={24} margin={{ top: 10, right: 4, left: -12, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barPublic" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#60a5fa" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                            <linearGradient id="barPrivate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#34d399" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                          <XAxis
                            dataKey="level"
                            tick={{ fontSize: 10.5, fill: "#64748b", fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            dy={6}
                          />
                          <YAxis tick={{ fontSize: 10, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.05)", radius: 8 }} />
                          <Bar dataKey="public" name="Public" fill="url(#barPublic)" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="private" name="Private" fill="url(#barPrivate)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {!noLearners && (
                    <div className="flex justify-center gap-4 mt-1">
                      {[{ label: "Public", color: "#3b82f6" }, { label: "Private", color: "#10b981" }].map((l) => (
                        <span key={l.label} className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-slate-400">
                          <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                          {l.label}
                        </span>
                      ))}
                    </div>
                  )}
                </ChartCard>
              </div>

              <div className="mt-5">
                <ChartCard title="Elementary — By Grade & Gender" subtitle="Male vs. Female per grade level">
                  {noLearners ? (
                    <EmptyState icon={Users} height="h-[280px]" />
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={learners.elemByGrade} barGap={3} barSize={18} margin={{ top: 10, right: 4, left: -12, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barMale" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#60a5fa" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                            <linearGradient id="barFemale" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f472b6" />
                              <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                          <XAxis dataKey="grade" tick={{ fontSize: 9.5, fill: "#64748b", fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} />
                          <YAxis tick={{ fontSize: 10, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)", radius: 8 }} />
                          <Bar dataKey="male" name="Male" fill="url(#barMale)" radius={[5, 5, 0, 0]} />
                          <Bar dataKey="female" name="Female" fill="url(#barFemale)" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {!noLearners && (
                    <div className="flex justify-center gap-4 mt-1">
                      {[{ label: "Male", color: "#3b82f6" }, { label: "Female", color: "#ec4899" }].map((l) => (
                        <span key={l.label} className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-slate-400">
                          <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                          {l.label}
                        </span>
                      ))}
                    </div>
                  )}
                </ChartCard>
              </div>
            </div>

            {/* ── Schools section ──────────────────── */}
            <div ref={schoolsRef} className="mb-10 md:mb-14 scroll-mt-20">
              <SectionHeader
                label="Dashboard Overview"
                title="Schools"
                subtitle="Public vs. private distribution and per-school enrollment"
              />

              <div className="grid lg:grid-cols-[280px_1fr] gap-5">
                <ChartCard
                  title="Overview"
                  subtitle={`${schools.total.toLocaleString()} total schools`}
                >
                  {noSchools ? (
                    <EmptyState icon={School} height="h-[180px]" />
                  ) : (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={schoolPieData} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                            {schoolPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {!noSchools && (
                    <div className="flex flex-col gap-2 mt-1">
                      {schoolPieData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-[0.72rem] font-semibold text-slate-500 bg-slate-50/60 rounded-lg px-3 py-2">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                            {d.name}
                          </span>
                          <span className="text-slate-700 font-bold">{d.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ChartCard>

                <ChartCard title="School Directory" subtitle="Search and browse individual schools">
                  {noSchools ? (
                    <EmptyState icon={MapPin} height="h-[280px]" />
                  ) : (
                    <SchoolDirectory schoolList={schools.schoolList} />
                  )}
                </ChartCard>
              </div>
            </div>

            {/* ── Teachers section (placeholder) ───── */}
            <div ref={teachersRef} className="mb-10 md:mb-14 scroll-mt-20">
              <SectionHeader
                label="Dashboard Overview"
                title="Teachers"
                subtitle="School personnel data"
              />
              <ChartCard title="Teachers" subtitle="No data available yet">
                <EmptyState icon={GraduationCap} height="h-[200px]" />
              </ChartCard>
            </div>

            {/* ── Number of Schools section (placeholder) ── */}
            <div ref={numSchoolsRef} className="mb-10 md:mb-14 scroll-mt-20">
              <SectionHeader
                label="Dashboard Overview"
                title="Number of Schools"
                subtitle="Community Learning Center data"
              />
              <ChartCard title="Number of Schools" subtitle="No data available yet">
                <EmptyState icon={Building} height="h-[200px]" />
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </section>
  );
}