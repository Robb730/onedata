import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useLandingStats } from "../../hooks/useLandingStats";
import { School, Users, GraduationCap, Building } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] px-4 py-3 text-[0.7rem] bg-slate-900/95 backdrop-blur-md border border-white/10 shadow-xl">
      <p className="text-white/50 font-semibold mb-1.5 text-[0.62rem] uppercase tracking-wide">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="font-bold">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.09)] hover:-translate-y-[2px]">
      <h4 className="text-[0.88rem] font-bold text-slate-800 leading-tight">{title}</h4>
      {subtitle && <p className="text-[0.7rem] text-slate-400 mt-0.5 mb-3">{subtitle}</p>}
      {children}
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
    <div ref={ref} className="relative">
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

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative z-20 pt-4 pb-20" style={{ background: "linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-1">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[0.72rem] text-slate-400 font-medium">Live enrollment data</p>
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
              className="text-left rounded-[16px] bg-white px-5 py-5 transition-all duration-300 hover:-translate-y-[3px] cursor-pointer border-none"
              style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)" }}
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full mb-4" style={{ background: "linear-gradient(135deg, #818cf8 0%, #4338ca 100%)" }}>
                <Users size={18} color="#fff" strokeWidth={2} />
              </div>
              <p className="text-[1.65rem] font-black text-slate-800 tracking-tight leading-none">{learners.total.toLocaleString()}</p>
              <p className="text-[0.7rem] font-semibold text-slate-400 mt-1.5 tracking-wide">Learners</p>
            </button>

            <button
              onClick={() => scrollToSection(schoolsRef)}
              className="text-left rounded-[16px] bg-white px-5 py-5 transition-all duration-300 hover:-translate-y-[3px] cursor-pointer border-none"
              style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)" }}
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full mb-4" style={{ background: "linear-gradient(135deg, #5b9bff 0%, #2352d6 100%)" }}>
                <School size={18} color="#fff" strokeWidth={2} />
              </div>
              <p className="text-[1.65rem] font-black text-slate-800 tracking-tight leading-none">{schools.total.toLocaleString()}</p>
              <p className="text-[0.7rem] font-semibold text-slate-400 mt-1.5 tracking-wide">Schools</p>
            </button>

            <button
              disabled
              className="text-left rounded-[16px] bg-white px-5 py-5 opacity-50 cursor-not-allowed border-none"
              style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)" }}
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full mb-4" style={{ background: "linear-gradient(135deg, #34d399 0%, #047857 100%)" }}>
                <GraduationCap size={18} color="#fff" strokeWidth={2} />
              </div>
              <p className="text-[1.65rem] font-black text-slate-800 tracking-tight leading-none">—</p>
              <p className="text-[0.7rem] font-semibold text-slate-400 mt-1.5 tracking-wide">School Personnel</p>
            </button>

            <button
              disabled
              className="text-left rounded-[16px] bg-white px-5 py-5 opacity-50 cursor-not-allowed border-none"
              style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)" }}
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full mb-4" style={{ background: "linear-gradient(135deg, #fbbf24 0%, #b45309 100%)" }}>
                <Building size={18} color="#fff" strokeWidth={2} />
              </div>
              <p className="text-[1.65rem] font-black text-slate-800 tracking-tight leading-none">—</p>
              <p className="text-[0.7rem] font-semibold text-slate-400 mt-1.5 tracking-wide">Community Learning Centers</p>
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center text-slate-400 text-sm py-16">Loading enrollment data…</div>
        )}

        {!loading && error && (
          <div className="text-center text-rose-500 text-sm py-16">Couldn't load data: {error}</div>
        )}

        {!loading && !error && learners.total === 0 && schools.total === 0 && (
          <div className="text-center text-slate-400 text-sm py-16">
            No data available for SY {selectedYear}.
          </div>
        )}

        {!loading && !error && (learners.total > 0 || schools.total > 0) && (
          <>
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div ref={learnersRef}>
                <ChartCard
                  title="Learners"
                  subtitle={`${learners.total.toLocaleString()} total enrolled`}
                >
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={learnerPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {learnerPieData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex justify-center gap-4 mt-2">
                    {learnerPieData.map((d) => (
                      <span
                        key={d.name}
                        className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-slate-500"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: d.color }}
                        />
                        {d.name}: {d.value.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </ChartCard>
              </div>

              <div ref={schoolsRef}>
                <ChartCard
                  title="Schools"
                  subtitle={`${schools.total.toLocaleString()} total schools`}
                >
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={schoolPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {schoolPieData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex justify-center gap-4 mt-2">
                    {schoolPieData.map((d) => (
                      <span
                        key={d.name}
                        className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-slate-500"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: d.color }}
                        />
                        {d.name}: {d.value.toLocaleString()}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 max-h-[180px] overflow-y-auto rounded-lg border border-slate-100">
                    <table className="w-full text-[0.7rem]">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">
                            School
                          </th>
                          <th className="px-3 py-2 text-center font-semibold text-slate-500">
                            Category
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-500">
                            Enrollment
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {schools.schoolList.map((s) => (
                          <tr
                            key={s.name}
                            className="border-t border-slate-50 hover:bg-blue-50/30"
                          >
                            <td className="px-3 py-2 text-slate-700 font-medium truncate max-w-[140px]">
                              {s.name}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-500">
                              {s.category}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700">
                              {s.enrollment.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ChartCard>
              </div>
            </div>

            <div ref={schoolsRef}>
              <ChartCard
                title="Schools"
                subtitle={`${schools.total.toLocaleString()} total schools`}
              >
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={schoolPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                        {schoolPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {schoolPieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-slate-500">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      {d.name}: {d.value.toLocaleString()}
                    </span>
                  ))}
                </div>

                <div className="mt-4 max-h-[180px] overflow-y-auto rounded-lg border border-slate-100">
                  <table className="w-full text-[0.7rem]">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">School</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-500">Category</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-500">Enrollment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools.schoolList.map((s) => (
                        <tr key={s.name} className="border-t border-slate-50 hover:bg-blue-50/30">
                          <td className="px-3 py-2 text-slate-700 font-medium truncate max-w-[140px]">{s.name}</td>
                          <td className="px-3 py-2 text-center text-slate-500">{s.category}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{s.enrollment.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>

            <ChartCard title="Learners by Level" subtitle="Public vs. Private breakdown per level">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={learners.byLevel} barGap={2} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f020" />
                    <XAxis dataKey="level" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="public" name="Public" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="private" name="Private" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-5">
                <ChartCard title="Elementary — By Grade & Gender" subtitle="Male vs. Female per grade level">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={learners.elemByGrade} barGap={2} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f020" />
                        <XAxis dataKey="grade" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="male" name="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="female" name="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            </ChartCard>
          </>
        )
        }
      </div >
    </section >
  );
}
