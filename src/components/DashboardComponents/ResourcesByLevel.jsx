import React, { useState } from "react";
import { ChevronLeft, ChevronRight, School, Search, Filter, X, Users, BookOpen, GraduationCap } from "lucide-react";
import { DashboardFilters } from "./DashboardFilters";

// ── Resource Configs ──────────────────────────────────────────
const RESOURCE_CONFIGS = {
  Teachers: {
    icon: <Users size={16} />,
    color: "#4f7df5",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    inventoryLabel: "Teachers",
    totalField: "prev_total_teachers_inventory",
  },
  Classrooms: {
    icon: <School size={16} />,
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    inventoryLabel: "Classrooms",
    totalField: (level) => (level === "Elementary" ? "prev_total_classroom_inventory" : "total_classroom"),
  },
  Seats: {
    icon: <GraduationCap size={16} />,
    color: "#f59e0b",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    inventoryLabel: "Seats",
    totalField: (level) => {
      if (level === "Elementary") return "prev_total_seats_inventory";
      if (level === "JHS") return "total_jhs_seats";
      return "total_shs_seats";
    },
  },
  Textbooks: {
    icon: <BookOpen size={16} />,
    color: "#ef4444",
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
    inventoryLabel: "Shortage",
    totalField: "textbook_needs", // For textbooks, we primarily show needs/shortage
  },
};

function getNeeds(row, resourceType, level) {
  if (resourceType === "Teachers") {
    if (level === "Elementary") return (row.kinder_needs || 0) + (row.g1g6_needs || 0) + (row.sned_needs || 0);
    return row.teacher_needs || 0;
  }
  if (resourceType === "Classrooms") {
    if (level === "Elementary") return (row.kinder_needs || 0) + (row.g1g6_needs || 0) + (row.sned_needs || 0);
    return row.classroom_needs || 0;
  }
  if (resourceType === "Seats") {
    if (level === "Elementary") return (row.kinder_needs || 0) + (row.g1g6_needs || 0) + (row.sned_needs || 0);
    return row.seat_needs || 0;
  }
  if (resourceType === "Textbooks") {
    return row.textbook_needs || 0;
  }
  return 0;
}

function getTotalValue(row, resourceType, level) {
  const config = RESOURCE_CONFIGS[resourceType];
  const field = typeof config.totalField === "function" ? config.totalField(level) : config.totalField;
  return row[field] || 0;
}

// ── School List Row ───────────────────────────────────────────
function SchoolResourceRow({ school, resourceType, level, config, maxVal }) {
  const total = getTotalValue(school, resourceType, level);
  const needs = getNeeds(school, resourceType, level);
  const pct = maxVal > 0 ? (total / maxVal) * 100 : 0;

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 hover:shadow-sm transition-all duration-150">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-md ${config.bg}`}>
            <School size={11} style={{ color: config.color }} />
          </div>
          <p className="text-[0.75rem] font-semibold text-slate-700 truncate">{school.school_name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ color: config.color }} className="text-[0.78rem] font-bold tabular-nums text-right w-12">
            {total.toLocaleString()}
          </span>
          <span className="text-[0.6rem] text-slate-400 w-16 text-right">
             {resourceType === "Textbooks" ? "shortage" : `${needs.toLocaleString()} needs`}
          </span>
        </div>
      </div>
      <div className="flex rounded-full overflow-hidden h-1 bg-slate-100">
        <div style={{ width: `${pct}%`, backgroundColor: config.color, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

export function ResourcesByLevel({ resources }) {
  const [activeType, setActiveType] = useState("Teachers");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [search, setSearch] = useState("");

  const config = RESOURCE_CONFIGS[activeType];
  const resourceData = resources[activeType.toLowerCase()];
  
  // Levels data (Elementary, JHS, SHS)
  const levels = ["Elementary", "JHS", "SHS"].map(lvl => {
    const records = resourceData.data?.[lvl] || [];
    const totalInventory = records.reduce((acc, r) => acc + getTotalValue(r, activeType, lvl), 0);
    const totalNeeds = records.reduce((acc, r) => acc + getNeeds(r, activeType, lvl), 0);
    
    return {
      name: lvl,
      display: lvl === "Elementary" ? "Elementary" : lvl,
      total: totalInventory,
      needs: totalNeeds,
      records
    };
  });

  if (selectedLevel) {
    const levelInfo = levels.find(l => l.name === selectedLevel);
    const filteredSchools = (levelInfo?.records || [])
      .filter(s => s.school_name?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => getTotalValue(b, activeType, selectedLevel) - getTotalValue(a, activeType, selectedLevel));

    const maxVal = filteredSchools.length > 0 ? getTotalValue(filteredSchools[0], activeType, selectedLevel) : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setSelectedLevel(null); setSearch(""); }}
            className="flex items-center gap-1 text-[0.7rem] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Levels
          </button>
          <div className="flex items-center gap-2">
            <span style={{ color: config.color }} className="text-[0.7rem] font-bold uppercase tracking-wide">
              {selectedLevel} {activeType}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-wide text-slate-400">
            {filteredSchools.length} Schools
          </p>
          <div className="relative flex-1 max-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search school..."
              className="w-full text-[0.68rem] pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 placeholder-slate-300 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredSchools.map((school, i) => (
            <SchoolResourceRow 
              key={school.school_id || i} 
              school={school} 
              resourceType={activeType} 
              level={selectedLevel}
              config={config}
              maxVal={maxVal}
            />
          ))}
          {filteredSchools.length === 0 && (
            <div className="py-10 text-center text-slate-400 text-sm italic">
              No schools found matching your search.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
           Select Resource Type
        </h4>
        <DashboardFilters
          options={["Teachers", "Classrooms", "Seats", "Textbooks"]}
          active={activeType}
          onChange={(t) => { setActiveType(t); setSelectedLevel(null); }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {levels.map(lvl => (
          <button
            key={lvl.name}
            onClick={() => setSelectedLevel(lvl.name)}
            className={`group text-left rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[0.6rem] font-bold uppercase tracking-[0.1em] ${config.text}`}>
                {lvl.display}
              </span>
              <ChevronRight size={13} className={`${config.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>

            <p style={{ color: config.color }} className="text-2xl font-bold tabular-nums mb-0.5">
              {lvl.total.toLocaleString()}
            </p>
            <p className="text-[0.65rem] text-slate-400 mb-2">
               {activeType === "Textbooks" ? "Units Shortage" : `Total Inventory`}
            </p>
            
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[0.6rem] text-slate-400 font-medium italic">
                 {lvl.needs.toLocaleString()} {activeType === "Textbooks" ? "total gap" : "needs"}
               </span>
               <span className={`text-[0.55rem] font-bold uppercase py-0.5 px-1.5 rounded-md ${config.bg} ${config.text}`}>
                 Details →
               </span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-2 text-center text-[0.65rem] text-slate-400 flex items-center justify-center gap-1.5">
        <School size={12} /> Click on a level card to see the breakdown of individual schools.
      </div>
    </div>
  );
}
