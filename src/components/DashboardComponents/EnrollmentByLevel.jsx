import React, { useState } from "react";
import { ChevronLeft, ChevronRight, School, Filter, X } from "lucide-react";
import ModalPortal from "../Modals/ModalPortal";

// ── Level definitions ─────────────────────────────────────────
const LEVELS = [
  {
    key: "elementary_data",
    label: "Elementary",
    shortLabel: "Elem",
    color: "#4f7df5",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    type: "elem",
  },
  {
    key: "junior_high_data",
    label: "Junior High School",
    shortLabel: "JHS",
    color: "#8b5cf6",
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-100",
    type: "jhs",
  },
  {
    key: "senior_high_s1_data",
    label: "Senior High S1",
    shortLabel: "SHS S1",
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    type: "shs",
  },
  {
    key: "senior_high_s2_data",
    label: "Senior High S2",
    shortLabel: "SHS S2",
    color: "#f59e0b",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    type: "shs",
  },
];

// ── Grade configs per level type ──────────────────────────────
const ELEM_GRADES = [
  { key: "kinder",  label: "Kinder" },
  { key: "grade1",  label: "Grade 1" },
  { key: "grade2",  label: "Grade 2" },
  { key: "grade3",  label: "Grade 3" },
  { key: "grade4",  label: "Grade 4" },
  { key: "grade5",  label: "Grade 5" },
  { key: "grade6",  label: "Grade 6" },
];

const JHS_GRADES = [
  { key: "grade7",  label: "Grade 7" },
  { key: "grade8",  label: "Grade 8" },
  { key: "grade9",  label: "Grade 9" },
  { key: "grade10", label: "Grade 10" },
];

const SHS_STRANDS = [
  { key: "acad",     label: "Academic" },
  { key: "tvl",      label: "TVL" },
  { key: "sports",   label: "Sports" },
  { key: "arts",     label: "Arts" },
  { key: "unique",   label: "UNIQUE" },
  { key: "acadSshs", label: "ACAD-SSHS" },
  { key: "techpro",  label: "Tech-Voc" },
];

function getGradeKeys(type) {
  if (type === "elem") return ELEM_GRADES;
  if (type === "jhs")  return JHS_GRADES;
  return null; // SHS handled separately
}

// ── Helpers ───────────────────────────────────────────────────
function sumRows(rows, levelKey, filter) {
  return rows
    .filter(r => filter === "Both" || r.category === filter.toUpperCase())
    .reduce((acc, row) => {
      const col = row[levelKey];
      acc.m += col?.total?.m ?? 0;
      acc.f += col?.total?.f ?? 0;
      return acc;
    }, { m: 0, f: 0 });
}

function sumGradeKey(rows, levelKey, gradeKey, filter) {
  return rows
    .filter(r => filter === "Both" || r.category === filter.toUpperCase())
    .reduce((acc, row) => {
      const col = row[levelKey];
      acc.m += col?.[gradeKey]?.m ?? 0;
      acc.f += col?.[gradeKey]?.f ?? 0;
      return acc;
    }, { m: 0, f: 0 });
}

function sumSHSGrade(rows, levelKey, gradeKey, strandKey, filter) {
  return rows
    .filter(r => filter === "Both" || r.category === filter.toUpperCase())
    .reduce((acc, row) => {
      const col = row[levelKey];
      acc.m += col?.[gradeKey]?.[strandKey]?.m ?? 0;
      acc.f += col?.[gradeKey]?.[strandKey]?.f ?? 0;
      return acc;
    }, { m: 0, f: 0 });
}

// ── Small reusable components ─────────────────────────────────

function MiniBar({ m, f, color }) {
  const total = m + f;
  if (total === 0) return null;
  const mPct = Math.round((m / total) * 100);
  return (
    <div className="flex rounded-full overflow-hidden h-1 mt-1.5 mb-1">
      <div style={{ width: `${mPct}%`, backgroundColor: color }} />
      <div style={{ width: `${100 - mPct}%`, backgroundColor: color, opacity: 0.3 }} />
    </div>
  );
}

function MFLabel({ m, f, color, size = "sm" }) {
  const cls = size === "xs" ? "text-[0.58rem]" : "text-[0.62rem]";
  return (
    <div className={`flex gap-2 ${cls} text-slate-400`}>
      <span><span className="font-semibold" style={{ color }}>{m.toLocaleString()}</span> M</span>
      <span><span className="font-semibold" style={{ color, opacity: 0.6 }}>{f.toLocaleString()}</span> F</span>
    </div>
  );
}

function GradeRow({ label, m, f, color, total: levelTotal }) {
  const rowTotal = m + f;
  const pct = levelTotal > 0 ? (rowTotal / levelTotal) * 100 : 0;
  if (rowTotal === 0) return null;

  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-[0.65rem] text-slate-500 w-16 shrink-0">{label}</span>
      <div className="flex-1">
        <div className="flex rounded-full overflow-hidden h-1 bg-slate-100">
          <div style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.3s ease" }} />
        </div>
      </div>
      <span style={{ color }} className="text-[0.65rem] font-bold tabular-nums w-10 text-right shrink-0">
        {rowTotal.toLocaleString()}
      </span>
      <span className="text-[0.58rem] text-slate-300 w-16 shrink-0">
        {m}M · {f}F
      </span>
    </div>
  );
}

// ── Filter pill ───────────────────────────────────────────────
function FilterPills({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <Filter size={10} className="text-slate-300" />
      {["Both", "Public", "Private"].map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`text-[0.6rem] font-semibold px-2 py-0.5 rounded-full transition-all ${
            value === opt
              ? "bg-slate-700 text-white"
              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}


function SchoolModal({ school, level, grandTotal, onClose }) {
  if (!school) return null;

  const col = school.col;

  return (
    // Backdrop
    <ModalPortal>
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="modal-overlay absolute inset-0" />

      {/* Modal panel */}
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()} // don't close when clicking inside
      >
        {/* Header */}
        <div
          style={{ backgroundColor: level.color }}
          className="px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/60 mb-0.5">
                School Breakdown
              </p>
              <p className="text-white font-bold text-[0.85rem] leading-tight truncate">
                {school.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={13} className="text-white" />
            </button>
          </div>

          {/* Total pill */}
          <div className="mt-3 flex items-center gap-3">
            <div className="bg-white/15 rounded-xl px-3 py-1.5">
              <p className="text-[0.58rem] text-white/60 mb-0.5">Total</p>
              <p className="text-white font-bold text-lg tabular-nums">{school.total.toLocaleString()}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-3 py-1.5">
              <p className="text-[0.58rem] text-white/60 mb-0.5">Male</p>
              <p className="text-white font-bold text-lg tabular-nums">{school.m.toLocaleString()}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-3 py-1.5">
              <p className="text-[0.58rem] text-white/60 mb-0.5">Female</p>
              <p className="text-white font-bold text-lg tabular-nums">{school.f.toLocaleString()}</p>
            </div>
            <span className={`ml-auto text-[0.58rem] font-bold uppercase px-2 py-1 rounded-lg ${
              school.category === "PUBLIC" ? "bg-white/20 text-white" : "bg-white/20 text-white"
            }`}>
              {school.category === "PUBLIC" ? "Public" : "Private"}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">

          {/* ELEM & JHS — per grade */}
          {level.type !== "shs" && (
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-wide text-slate-400 mb-2">
                By Grade
              </p>
              <div className="space-y-0">
                {getGradeKeys(level.type)?.map(({ key, label }) => {
                  const m = col?.[key]?.m ?? 0;
                  const f = col?.[key]?.f ?? 0;
                  const total = m + f;
                  const pct = school.total > 0 ? (total / school.total) * 100 : 0;
                  if (total === 0) return null;
                  return (
                    <div key={key} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <span className="text-[0.65rem] text-slate-500 w-14 shrink-0">{label}</span>
                      <div className="flex-1">
                        <div className="flex rounded-full overflow-hidden h-1.5 bg-slate-100">
                          <div
                            style={{ width: `${pct}%`, backgroundColor: level.color, transition: "width 0.4s ease" }}
                          />
                        </div>
                      </div>
                      <span style={{ color: level.color }} className="text-[0.68rem] font-bold tabular-nums w-8 text-right shrink-0">
                        {total}
                      </span>
                      <span className="text-[0.58rem] text-slate-300 w-14 shrink-0 text-right">
                        {m}M · {f}F
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SHS — grade 11 & 12 with strands */}
          {level.type === "shs" && ["grade11", "grade12"].map(gradeKey => {
            const gradeLabel = gradeKey === "grade11" ? "Grade 11" : "Grade 12";
            const gradeStrands = SHS_STRANDS.map(({ key: sk, label: sl }) => ({
              label: sl,
              m: col?.[gradeKey]?.[sk]?.m ?? 0,
              f: col?.[gradeKey]?.[sk]?.f ?? 0,
            })).filter(s => s.m + s.f > 0);

            const gradeTotal = gradeStrands.reduce((acc, s) => acc + s.m + s.f, 0);
            if (gradeTotal === 0) return null;

            return (
              <div key={gradeKey} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[0.6rem] font-bold uppercase tracking-wide text-slate-400">{gradeLabel}</p>
                  <span style={{ color: level.color }} className="text-[0.68rem] font-bold tabular-nums">
                    {gradeTotal.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-0">
                  {gradeStrands.map(s => {
                    const total = s.m + s.f;
                    const pct = school.total > 0 ? (total / school.total) * 100 : 0;
                    return (
                      <div key={s.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                        <span className="text-[0.65rem] text-slate-500 w-16 shrink-0">{s.label}</span>
                        <div className="flex-1">
                          <div className="flex rounded-full overflow-hidden h-1.5 bg-slate-100">
                            <div style={{ width: `${pct}%`, backgroundColor: level.color, transition: "width 0.4s ease" }} />
                          </div>
                        </div>
                        <span style={{ color: level.color }} className="text-[0.68rem] font-bold tabular-nums w-8 text-right shrink-0">
                          {total}
                        </span>
                        <span className="text-[0.58rem] text-slate-300 w-14 shrink-0 text-right">
                          {s.m}M · {s.f}F
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4">
          <p className="text-[0.58rem] text-slate-300 text-center">
            {(school.total / grandTotal * 100).toFixed(1)}% of all {level.shortLabel} enrollees
          </p>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

// ── Level detail panel (shown on drill-down) ──────────────────
function LevelDetail({ level, rows, filter, onBack }) {
  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null); // ✅ add this

  const filteredRows = rows.filter(r =>
    filter === "Both" || r.category === filter.toUpperCase()
  );

  const totals = sumRows(rows, level.key, filter);
  const grandTotal = totals.m + totals.f;

  const schoolRows = filteredRows
    .map(row => {
      const col = row[level.key];
      if (!col?.total) return null;
      return {
        name: row.school_name,
        category: row.category,
        m: col.total.m ?? 0,
        f: col.total.f ?? 0,
        total: (col.total.m ?? 0) + (col.total.f ?? 0),
        col,
      };
    })
    .filter(Boolean)
    .filter(s => s.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      {/* Modal */}
      {selectedSchool && (
        <SchoolModal
          school={selectedSchool}
          level={level}
          grandTotal={grandTotal}
          onClose={() => setSelectedSchool(null)}
        />
      )}

      {/* Back row */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[0.7rem] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <span style={{ color: level.color }} className="text-[0.7rem] font-bold uppercase tracking-wide">
          {level.label}
        </span>
        <span className="text-[0.68rem] text-slate-400">
          {schoolRows.length} schools ·{" "}
          <span className="font-semibold text-slate-600">{grandTotal.toLocaleString()}</span>
        </span>
      </div>

      {/* Grade/Strand breakdown totals */}
      <div className={`rounded-xl border ${level.border} p-3 mb-3`}>
        <p className={`text-[0.6rem] font-bold uppercase tracking-wide ${level.text} mb-2`}>
          {level.type === "shs" ? "By Grade & Strand" : "By Grade"} — All Schools
        </p>

        {level.type !== "shs" && getGradeKeys(level.type)?.map(({ key, label }) => {
          const { m, f } = sumGradeKey(rows, level.key, key, filter);
          return <GradeRow key={key} label={label} m={m} f={f} color={level.color} total={grandTotal} />;
        })}

        {level.type === "shs" && ["grade11", "grade12"].map(gradeKey => (
          <div key={gradeKey} className="mb-3">
            <p className={`text-[0.62rem] font-bold ${level.text} mb-1`}>
              {gradeKey === "grade11" ? "Grade 11" : "Grade 12"}
            </p>
            {SHS_STRANDS.map(({ key: sk, label: sl }) => {
              const { m, f } = sumSHSGrade(rows, level.key, gradeKey, sk, filter);
              return <GradeRow key={sk} label={sl} m={m} f={f} color={level.color} total={grandTotal} />;
            })}
          </div>
        ))}
      </div>

      {/* Search + Per school list */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[0.6rem] font-bold uppercase tracking-wide text-slate-400">Per School</p>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search school..."
            className="text-[0.68rem] pl-2.5 pr-7 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 placeholder-slate-300 focus:outline-none focus:border-slate-400 focus:bg-white transition-all w-40"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {schoolRows.length === 0 && (
          <p className="text-center py-6 text-slate-400 text-[0.8rem]">
            {search ? `No schools matching "${search}"` : "No data for this filter."}
          </p>
        )}
        {schoolRows.map((school, i) => {
          const pct = grandTotal > 0 ? (school.total / grandTotal) * 100 : 0;
          return (
            <div
              key={i}
              onClick={() => setSelectedSchool(school)} // ✅ open modal on click
              className="rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 hover:shadow-sm transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-md ${level.bg}`}>
                    <School size={11} style={{ color: level.color }} />
                  </div>
                  <p className="text-[0.75rem] font-semibold text-slate-700 truncate">{school.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[0.58rem] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                    school.category === "PUBLIC" ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-500"
                  }`}>
                    {school.category === "PUBLIC" ? "Pub" : "Priv"}
                  </span>
                  <span style={{ color: level.color }} className="text-[0.78rem] font-bold tabular-nums">
                    {school.total.toLocaleString()}
                  </span>
                  <ChevronRight size={11} className="text-slate-300" /> {/* ✅ hint */}
                </div>
              </div>

              <div className="flex rounded-full overflow-hidden h-1 bg-slate-100 mb-1.5">
                <div style={{ width: `${pct}%`, backgroundColor: level.color, transition: "width 0.4s ease" }} />
              </div>

              <div className="flex items-center justify-between">
                <MFLabel m={school.m} f={school.f} color={level.color} size="xs" />
                <span className="text-[0.58rem] text-slate-300">{pct.toFixed(1)}% of level</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function EnrollmentByLevel({ rows = [] }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [filter, setFilter] = useState("Both"); // "Both" | "Public" | "Private"

  const levelTotals = LEVELS.map(lvl => {
    const { m, f } = sumRows(rows, lvl.key, filter);
    return { ...lvl, male: m, female: f, total: m + f };
  });

  // ── Overview grid ─────────────────────────────────────────
  if (!selectedLevel) {
    return (
      <div>
        {/* Filter row */}
        <div className="flex items-center justify-end mb-3">
          <FilterPills value={filter} onChange={setFilter} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {levelTotals.map(lvl => (
            <button
              key={lvl.key}
              onClick={() => setSelectedLevel(lvl)}
              className={`group text-left rounded-xl border ${lvl.border} bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[0.6rem] font-bold uppercase tracking-[0.1em] ${lvl.text}`}>
                  {lvl.shortLabel}
                </span>
                <ChevronRight size={13} className={`${lvl.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>

              <p style={{ color: lvl.color }} className="text-2xl font-bold tabular-nums mb-0.5">
                {lvl.total.toLocaleString()}
              </p>
              <p className="text-[0.65rem] text-slate-400 mb-3">{lvl.label}</p>

              {lvl.total > 0 && (
                <>
                  <MiniBar m={lvl.male} f={lvl.female} color={lvl.color} />
                  <MFLabel m={lvl.male} f={lvl.female} color={lvl.color} />
                </>
              )}

              {/* Grade preview — top 3 non-zero grades */}
              {lvl.total > 0 && lvl.type !== "shs" && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {getGradeKeys(lvl.type)
                    ?.map(({ key, label }) => {
                      const { m, f } = sumGradeKey(rows, lvl.key, key, filter);
                      return { label, total: m + f };
                    })
                    .filter(g => g.total > 0)
                    .slice(0, 3)
                    .map(g => (
                      <div key={g.label} className="flex justify-between items-center">
                        <span className="text-[0.58rem] text-slate-400">{g.label}</span>
                        <span style={{ color: lvl.color }} className="text-[0.6rem] font-semibold tabular-nums">
                          {g.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  <p className={`text-[0.55rem] ${lvl.text} opacity-50`}>+ more grades inside →</p>
                </div>
              )}

              {/* SHS preview — grade 11 / 12 */}
              {lvl.total > 0 && lvl.type === "shs" && (
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  {["grade11", "grade12"].map(gk => {
                    const t = SHS_STRANDS.reduce((acc, { key: sk }) => {
                      const { m, f } = sumSHSGrade(rows, lvl.key, gk, sk, filter);
                      return acc + m + f;
                    }, 0);
                    return (
                      <div key={gk}>
                        <p className="text-[0.58rem] text-slate-400">{gk === "grade11" ? "Grade 11" : "Grade 12"}</p>
                        <p style={{ color: lvl.color }} className="text-sm font-bold tabular-nums">{t.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className={`text-[0.58rem] mt-3 ${lvl.text} opacity-0 group-hover:opacity-70 transition-opacity`}>
                Tap to see full breakdown →
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Drill-down ────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <FilterPills value={filter} onChange={setFilter} />
      </div>
      <LevelDetail
        level={selectedLevel}
        rows={rows}
        filter={filter}
        onBack={() => setSelectedLevel(null)}
      />
    </div>
  );
}