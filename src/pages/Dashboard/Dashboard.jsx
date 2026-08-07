/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Info,
  BarChart3,
  Target,
  FileText,
  BookOpen,
  School,
  Users,
  GraduationCap,
  CalendarDays,
  ChevronDown,
  ArrowLeftRight,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import {
  DashboardOverview,
  DashboardFilters,
  DashboardAccordion,
  DashboardGrid,
  DataSummaryCard,
  MetricProgress,
  InsightCard,
  SectionDivider,
  EnrollmentChart,
  DropoutChart,
  PromotionChart,
  CohortChart,
  PerformanceCard,
  TrendCard,
  ResourcesInventoryChart,
  TextbooksChart,
  GenderCard,
  EnrollmentByLevel,
  ResourcesByLevel,
} from "../../components/DashboardComponents";
import { DEFAULT_CESPES_DATA } from "../../data/cespesTemplateData";
import { getAllSchoolYearsForSelector } from "../../utils/schoolYearsApi"; // adjust path as needed

// ─── Sample data ────────────────────────────────────────────
// In production this would come from Supabase or context/store.

const enrollmentTrendStatic = [
  { year: "22-2023", public: 25200, private: 12100 },
  { year: "23-2024", public: 26800, private: 12900 },
  { year: "24-2025", public: 27646, private: 13569 },
  { year: "25-2026*", public: 9200, private: 4100 },
];


// ─── Component ──────────────────────────────────────────────

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(null);
  const [rateView, setRateView] = useState("Dropout");
  const [enrollmentView, setEnrollmentView] = useState("Summary");
  
  const [schoolYears, setSchoolYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(true);
 

  // ── Crucial Resources State ────────────────────────────────
  const [resourceView, setResourceView] = useState("Summary");
  const [resourceType, setResourceType] = useState("Teachers");
  const [resources, setResources] = useState({
    teachers: { total: 0, needs: 0, breakdown: {}, loading: true },
    classrooms: { total: 0, needs: 0, breakdown: {}, loading: true },
    seats: { total: 0, needs: 0, breakdown: {}, loading: true },
    textbooks: { needs: 0, excess: 0, breakdown: {}, loading: true },
  });

  const [enrollmentSummary, setEnrollmentSummary] = useState({
    public: 0,
    private: 0,
    total: 0,
  });

  const [genderSummary, setGenderSummary] = useState({
    male: { total: 0, public: 0, private: 0 },
    female: { total: 0, public: 0, private: 0 },
  });

  const [enrollmentRows, setEnrollmentRows] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState(enrollmentTrendStatic);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── CESPES State ───────────────────────────────────────────
  const [cespes, setCespes] = useState({
    operations: [],
    supportOperations: [],
    generalAdmin: [],
    individualPerformance: [],
    innovation: [],
    loading: true,
  });
  const [activeCespesTab, setActiveCespesTab] = useState("Operations");

  // ── Year Dropdown State ─────────────────────────────────────
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Resolve the default (active) school year once on mount ──
  useEffect(() => {
  let cancelled = false;

  async function initYear() {
    try {
      // 1. Get the active year first — this is the one thing that
      //    actually determines what data loads, so resolve it before
      //    anything else touches state.
      const { data: activeRow, error: activeErr } = await supabase
        .from("school_years")
        .select("label")
        .eq("status", "active")
        .maybeSingle();

      if (cancelled) return;

      // 2. Get the full list for the dropdown (doesn't block selection)
      const yearsData = await getAllSchoolYearsForSelector();
      if (cancelled) return;

      setSchoolYears(yearsData);

      if (!activeErr && activeRow?.label) {
        setSelectedYear(activeRow.label);
      } else if (yearsData.length > 0) {
        // Fallback only if no active year is set in the DB
        setSelectedYear(yearsData[0].year);
      }
    } catch (err) {
      console.error("Error initializing school year:", err);
    } finally {
      if (!cancelled) setYearsLoading(false);
    }
  }

  initYear();
  return () => {
    cancelled = true;
  };
}, []);

  useEffect(() => {
    if (!selectedYear) return; // wait until the active year is resolved

    async function fetchEnrollmentSummary() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("enrollment_data")
        .select(
          "category, grand_total, school_name, elementary_data, junior_high_data, senior_high_s1_data, senior_high_s2_data",
        )
        .eq("school_year", selectedYear);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Fetch all enrollment data for trend chart
      const { data: allEnrollment } = await supabase.from("enrollment_data").select("school_year, category, grand_total");
      if (allEnrollment) {
        const trendYears = [...new Set(allEnrollment.map(d => d.school_year))].sort();
        const trendData = trendYears.map(year => {
          const yData = allEnrollment.filter(d => d.school_year === year);
          return {
            year,
            public: yData.filter(d => d.category === "PUBLIC").reduce((acc, row) => acc + (row.grand_total ?? 0), 0),
            private: yData.filter(d => d.category === "PRIVATE").reduce((acc, row) => acc + (row.grand_total ?? 0), 0),
          };
        });
        if (trendData.length > 0) setEnrollmentTrend(trendData);
      }

      setEnrollmentRows(data);

      // ── Enrollment by category ──────────────────────────────
      const publicTotal = data
        .filter((row) => row.category === "PUBLIC")
        .reduce((acc, row) => acc + (row.grand_total ?? 0), 0);

      const privateTotal = data
        .filter((row) => row.category === "PRIVATE")
        .reduce((acc, row) => acc + (row.grand_total ?? 0), 0);

      // ── Gender totals split by public / private ─────────────
      let malePublic = 0,
        malePrivate = 0;
      let femalePublic = 0,
        femalePrivate = 0;

      data.forEach((row) => {
        const isPublic = row.category === "PUBLIC";
        const cols = [
          row.elementary_data,
          row.junior_high_data,
          row.senior_high_s1_data,
          row.senior_high_s2_data,
        ];

        cols.forEach((col) => {
          if (col?.total) {
            const m = col.total.m ?? 0;
            const f = col.total.f ?? 0;
            if (isPublic) {
              malePublic += m;
              femalePublic += f;
            } else {
              malePrivate += m;
              femalePrivate += f;
            }
          }
        });
      });

      setEnrollmentSummary({
        public: publicTotal,
        private: privateTotal,
        total: publicTotal + privateTotal,
      });

      setGenderSummary({
        male: {
          total: malePublic + malePrivate,
          public: malePublic,
          private: malePrivate,
        },
        female: {
          total: femalePublic + femalePrivate,
          public: femalePublic,
          private: femalePrivate,
        },
      });

      setLoading(false);
    }

    async function fetchCrucialResources() {
      try {
        // ── FIX: every resource query below now filters by the selected
        // school year. Previously these ran `.select("*")` with no year
        // filter at all, so the Crucial Resources section always showed
        // the same totals across every table row in the DB regardless of
        // which school year was selected in the dropdown. ──

        // 1. Fetch Teachers
        const { data: tKes } = await supabase
          .from("teachers_kes")
          .select("*")
          .eq("school_year", selectedYear);
        const { data: tJhs } = await supabase
          .from("teachers_jhs")
          .select("*")
          .eq("school_year", selectedYear);
        const { data: tShs } = await supabase
          .from("teachers_shs")
          .select("*")
          .eq("school_year", selectedYear);

        const tKesTotal =
          tKes?.reduce(
            (acc, r) => acc + (r.prev_total_teachers_inventory || 0),
            0,
          ) || 0;
        const tJhsTotal =
          tJhs?.reduce(
            (acc, r) => acc + (r.prev_total_teachers_inventory || 0),
            0,
          ) || 0;
        const tShsTotal =
          tShs?.reduce(
            (acc, r) => acc + (r.prev_total_teachers_inventory || 0),
            0,
          ) || 0;

        const tKesNeeds =
          tKes?.reduce(
            (acc, r) =>
              acc +
              (r.kinder_needs || 0) +
              (r.g1g6_needs || 0) +
              (r.sned_needs || 0),
            0,
          ) || 0;
        const tJhsNeeds =
          tJhs?.reduce((acc, r) => acc + (r.teacher_needs || 0), 0) || 0;
        const tShsNeeds =
          tShs?.reduce((acc, r) => acc + (r.teacher_needs || 0), 0) || 0;

        // 2. Fetch Classrooms
        const { data: cKes } = await supabase.from("classrooms_kes").select("*");
        const { data: cJhs } = await supabase.from("classrooms_jhs").select("*");
        const { data: cShs } = await supabase.from("classrooms_shs").select("*");

        const cKesTotal = cKes?.reduce((acc, r) => acc + (r.prev_total_classroom_inventory || 0), 0) || 0;
        const cJhsTotal = cJhs?.reduce((acc, r) => acc + (r.total_classroom || 0), 0) || 0;
        const cShsTotal = cShs?.reduce((acc, r) => acc + (r.total_classroom || 0), 0) || 0;

        const cKesNeeds = cKes?.reduce((acc, r) => acc + (r.kinder_needs || 0) + (r.g1g6_needs || 0) + (r.sned_needs || 0), 0) || 0;
        const cJhsNeeds = cJhs?.reduce((acc, r) => acc + (r.classroom_needs || 0), 0) || 0;
        const cShsNeeds = cShs?.reduce((acc, r) => acc + (r.classroom_needs || 0), 0) || 0;

        // 3. Fetch Seats
        // seats_kes: prev_total_seats_inventory for total, kinder_needs/g1g6_needs/sned_needs for needs
        // seats_jhs: total_jhs_seats for total, seat_needs for needs
        // seats_shs: total_shs_seats for total, seat_needs for needs
        const { data: sKes } = await supabase.from("seats_kes").select("*");
        const { data: sJhs } = await supabase.from("seats_jhs").select("*");
        const { data: sShs } = await supabase.from("seats_shs").select("*");

        const sKesTotal = sKes?.reduce((acc, r) => acc + (r.prev_total_seats_inventory || 0), 0) || 0;
        const sJhsTotal = sJhs?.reduce((acc, r) => acc + (r.total_jhs_seats || 0), 0) || 0;
        const sShsTotal = sShs?.reduce((acc, r) => acc + (r.total_shs_seats || 0), 0) || 0;

        const sKesNeeds = sKes?.reduce((acc, r) => acc + (r.kinder_needs || 0) + (r.g1g6_needs || 0) + (r.sned_needs || 0), 0) || 0;
        const sJhsNeeds = sJhs?.reduce((acc, r) => acc + (r.seat_needs || 0), 0) || 0;
        const sShsNeeds = sShs?.reduce((acc, r) => acc + (r.seat_needs || 0), 0) || 0;

        // 4. Fetch Textbooks
        const { data: txKes } = await supabase.from("textbooks_kes").select("*");
        const { data: txJhs } = await supabase.from("textbooks_jhs").select("*");
        const { data: txShs } = await supabase.from("textbooks_shs").select("*");

        const txKesNeeds = txKes?.reduce((acc, r) => acc + (r.textbook_needs || 0), 0) || 0;
        const txJhsNeeds = txJhs?.reduce((acc, r) => acc + (r.textbook_needs || 0), 0) || 0;
        const txShsNeeds = txShs?.reduce((acc, r) => acc + (r.textbook_needs || 0), 0) || 0;

        setResources({
          teachers: {
            total: tKesTotal + tJhsTotal + tShsTotal,
            needs: tKesNeeds + tJhsNeeds + tShsNeeds,
            breakdown: {
              Elementary: tKesTotal,
              JHS: tJhsTotal,
              SHS: tShsTotal,
            },
            needsBreakdown: {
              Elementary: tKesNeeds,
              JHS: tJhsNeeds,
              SHS: tShsNeeds,
            },
            data: { Elementary: tKes, JHS: tJhs, SHS: tShs },
            loading: false,
          },
          classrooms: {
            total: cKesTotal + cJhsTotal + cShsTotal,
            needs: cKesNeeds + cJhsNeeds + cShsNeeds,
            breakdown: {
              Elementary: cKesTotal,
              JHS: cJhsTotal,
              SHS: cShsTotal,
            },
            needsBreakdown: {
              Elementary: cKesNeeds,
              JHS: cJhsNeeds,
              SHS: cShsNeeds,
            },
            data: { Elementary: cKes, JHS: cJhs, SHS: cShs },
            loading: false,
          },
          seats: {
            total: sKesTotal + sJhsTotal + sShsTotal,
            needs: sKesNeeds + sJhsNeeds + sShsNeeds,
            breakdown: {
              Elementary: sKesTotal,
              JHS: sJhsTotal,
              SHS: sShsTotal,
            },
            needsBreakdown: {
              Elementary: sKesNeeds,
              JHS: sJhsNeeds,
              SHS: sShsNeeds,
            },
            data: { Elementary: sKes, JHS: sJhs, SHS: sShs },
            loading: false,
          },
          textbooks: {
            needs: txKesNeeds + txJhsNeeds + txShsNeeds,
            breakdown: {
              Elementary: txKesNeeds,
              JHS: txJhsNeeds,
              SHS: txShsNeeds,
            },
            data: { Elementary: txKes, JHS: txJhs, SHS: txShs },
            loading: false,
          },
        });
      } catch (error) {
        console.error("Error fetching crucial resources:", error);
      }
    }

    async function fetchCespes() {
      try {
        const [ops, support, admin, perf, innov] = await Promise.all([
          supabase
            .from("cespes_operations")
            .select("*")
            .eq("school_year", selectedYear),
          supabase
            .from("cespes_support_operations")
            .select("*")
            .eq("school_year", selectedYear),
          supabase
            .from("cespes_general_admin")
            .select("*")
            .eq("school_year", selectedYear),
          supabase
            .from("cespes_individual_performance")
            .select("*")
            .eq("school_year", selectedYear),
          supabase
            .from("cespes_innovation")
            .select("*")
            .eq("school_year", selectedYear),
        ]);
        setCespes({
          operations: ops.data || [],
          supportOperations: support.data || [],
          generalAdmin: admin.data || [],
          individualPerformance: perf.data || [],
          innovation: innov.data || [],
          loading: false,
        });
      } catch (err) {
        console.error("Error fetching CESPES:", err);
        setCespes((prev) => ({ ...prev, loading: false }));
      }
    }

    async function fetchPerformanceIndicators() {
      const { data, error } = await supabase.from("performance_indicators_data").select("*");
      if (!error && data) {
        setKpiData(data);
      }
    }

    fetchEnrollmentSummary();
    fetchCrucialResources();
    fetchCespes();
    fetchPerformanceIndicators();
  }, [selectedYear]);

  // ── Derived KPI Calculations ───────────────────────────────
  const getKpiRate = (yearData, sheetName, headerSubstring) => {
    const sheet = yearData.find((r) => r.sheet_name.trim() === sheetName.trim());
    if (!sheet) return 0;
    const idx = sheet.headers_main.findIndex((h) => h && h.toString().includes(headerSubstring));
    if (idx !== -1 && sheet.total_row[idx] !== undefined && sheet.total_row[idx] !== null) {
      return parseFloat(sheet.total_row[idx]) * 100;
    }
    return 0;
  };

  const currentKpi = kpiData.filter((d) => d.school_year === selectedYear);

  const elemDropout = getKpiRate(currentKpi, "G1toG6 SLR_DR", "Ave. School Leaver Rate");
  const jhsDropout = getKpiRate(currentKpi, "JHS School Leaver Rate", "Ave. School Leaver Rate");
  const shsDropout = getKpiRate(currentKpi, " JHS to SHS SLR_DR", "Ave. School Leaver Rate");
  const overallDropout = (elemDropout + jhsDropout + shsDropout) / 3;

  const dropoutByLevel = [
    { label: "Overall", display: overallDropout.toFixed(2) + "%", value: overallDropout, color: "bg-rose-500" },
    { label: "Kinder", display: "—", value: 0, note: "Grouped with Elem K-G6 · See Elementary", color: "bg-gray-300" },
    { label: "Elementary", display: elemDropout.toFixed(2) + "%", value: elemDropout, color: "bg-amber-500" },
    { label: "JHS", display: jhsDropout.toFixed(2) + "%", value: jhsDropout, color: "bg-violet-500" },
    { label: "SHS", display: shsDropout.toFixed(2) + "%", value: shsDropout, color: "bg-emerald-500" },
  ];

  const elemPromo = getKpiRate(currentKpi, "G1toG6  Promo & Grad", "Ave. Promotion Rate");
  const jhsPromo = getKpiRate(currentKpi, "JHS Promo & Grad", "Ave. Promotion Rate");
  const shsPromo = getKpiRate(currentKpi, " JHS to SHS Promo & Grad", "Ave. Promotion Rate");
  const promotionByLevel = [
    { level: "Kinder", rate: 99.8 }, // Kept static if not available
    { level: "Elementary", rate: elemPromo || 0 },
    { level: "JHS", rate: jhsPromo || 0 },
    { level: "SHS", rate: shsPromo || 0 },
  ];

  const kpiYears = [...new Set(kpiData.map((d) => d.school_year))].sort();
  const dropoutTrend = kpiYears.length > 0 ? kpiYears.map((year) => {
    const yData = kpiData.filter((d) => d.school_year === year);
    const elem = getKpiRate(yData, "G1toG6 SLR_DR", "Ave. School Leaver Rate");
    const jhs = getKpiRate(yData, "JHS School Leaver Rate", "Ave. School Leaver Rate");
    const shs = getKpiRate(yData, " JHS to SHS SLR_DR", "Ave. School Leaver Rate");
    return {
      year,
      overall: parseFloat(((elem + jhs + shs) / 3).toFixed(2)),
      elementary: parseFloat(elem.toFixed(2)),
      jhs: parseFloat(jhs.toFixed(2)),
    };
  }) : [{ year: selectedYear, overall: 0, elementary: 0, jhs: 0 }];

  const cohortTrend = kpiYears.length > 0 ? kpiYears.map((year) => {
    const yData = kpiData.filter((d) => d.school_year === year);
    const elemCsr = getKpiRate(yData, "G1toG6 CSR & CompR", "CSR");
    return {
      year,
      rate: parseFloat(elemCsr.toFixed(2)),
    };
  }) : [{ year: selectedYear, rate: 0 }];

  const overviewData = {
    totalEnrollment: enrollmentSummary.total,
    overallDropout: overallDropout.toFixed(2) + "%",
    elemPromotion: elemPromo.toFixed(2) + "%",
    jhsDropout: jhsDropout.toFixed(2) + "%",
    enrollmentTrend: "—", 
    dropoutTrend: "—",
    promotionTrend: "—",
    jhsDropoutTrend: "—",
  };

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-6 sm:px-10 py-8">
        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
              Dashboard
            </h1>
            <p className="text-[0.78rem] text-slate-400 font-medium mt-1">
              SY {selectedYear} · SDO Baliwag Division
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-1">
            {/* Year selector */}
            <div
              ref={yearDropdownRef}
              className="relative"
            >
              <button
                id="dashboard-year-select-btn"
                onClick={() => !yearsLoading && setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="relative flex items-center gap-2 h-[38px] rounded-[10px] border border-slate-200/80 bg-white pl-3 pr-8 hover:border-slate-300 transition-colors w-[130px] shadow-sm cursor-pointer"
              >
                <CalendarDays size={14} className="text-blue-500 shrink-0" />
                <span className="text-[0.82rem] font-bold text-slate-700 select-none truncate">
                  {yearsLoading ? "Loading…" : selectedYear || "Select Year"}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`text-slate-400 pointer-events-none absolute right-3 transition-transform duration-200 ${
                    isYearDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Custom Dropdown Menu */}
              {isYearDropdownOpen && !yearsLoading && (
                <div className="absolute top-[calc(100%+6px)] right-0 w-full min-w-[130px] bg-white border border-slate-200 rounded-[10px] shadow-[0_8px_30px_rgba(15,23,42,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {schoolYears.map(({ year }) => {
                    const isSelected = selectedYear === year;
                    return (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full flex items-center px-3.5 py-2 text-[0.82rem] font-semibold transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {year}
                        {isSelected && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Compare button */}
            <button
              id="dashboard-compare-btn"
              onClick={() => {}}
              className="flex items-center gap-1.5 rounded-[10px] bg-blue-500 px-4 py-[7px] text-[0.78rem] font-semibold text-white hover:bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer"
              style={{ boxShadow: "0 2px 8px rgba(59,130,246,0.28)" }}
            >
              <ArrowLeftRight size={13} />
              Compare
            </button>
          </div>
        </div>

        {/* ── Overview KPIs ───────────────────────────────── */}
        <DashboardOverview data={overviewData} selectedYear={selectedYear} />

        {/* ── Data Categories header ──────────────────────── */}
        <div className="flex items-baseline justify-between mt-8 mb-4">
          <div>
            <h3 className="text-[0.9rem] font-bold text-slate-700">
              Data Categories
            </h3>
            <p className="text-[0.7rem] text-slate-400 mt-0.5">
              Expand a section to view detailed reports
            </p>
          </div>
          <span className="text-[0.72rem] font-medium text-slate-400">
            5 sections
          </span>
        </div>

        {/* ── Performance Indicators ─────────────────────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              <TrendingUp size={16} className="text-indigo-500" />
            </div>
          }
          title="Performance Indicators"
          subtitle="Enrollment · Dropout · Promotion · Cohort Survival"
          subtitleColor="#4f7df5"
          accentBg="rgba(239,246,255,0.7)"
          defaultOpen
        >
          {!loading && enrollmentSummary.total === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 opacity-25 text-indigo-400">
                <BarChart3 size={36} strokeWidth={1.5} />
              </div>
              <p
                className="text-[0.78rem] font-semibold"
                style={{ color: "rgba(79,125,245,0.6)" }}
              >
                No data available for SY {selectedYear}
              </p>
            </div>
          ) : (
            <>
              {/* Enrollment summary */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Overall Enrollment
                  </h4>
                  <DashboardFilters
                    options={["Summary", "By Level"]}
                    active={enrollmentView}
                    onChange={setEnrollmentView}
                  />
                </div>

                {enrollmentView === "Summary" && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <DataSummaryCard
                        label="Public"
                        value={enrollmentSummary.public.toLocaleString()}
                        accent="#4f7df5"
                      />
                      <DataSummaryCard
                        label="Private"
                        value={enrollmentSummary.private.toLocaleString()}
                        accent="#10b981"
                      />
                      <DataSummaryCard
                        label="Total"
                        value={enrollmentSummary.total.toLocaleString()}
                        accent="#334155"
                      />
                    </div>

                    <div className="mt-3">
                      <p className="text-[0.62rem] font-medium text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        Gender
                        <span className="normal-case tracking-normal font-normal text-slate-300">
                          · hover to see public / private split
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <GenderCard
                          label="Male"
                          total={loading ? 0 : genderSummary.male.total}
                          publicCount={loading ? 0 : genderSummary.male.public}
                          privateCount={
                            loading ? 0 : genderSummary.male.private
                          }
                          accent="#3b82f6"
                          hoverAccent="#60a5fa"
                        />
                        <GenderCard
                          label="Female"
                          total={loading ? 0 : genderSummary.female.total}
                          publicCount={
                            loading ? 0 : genderSummary.female.public
                          }
                          privateCount={
                            loading ? 0 : genderSummary.female.private
                          }
                          accent="#ec4899"
                          hoverAccent="#f472b6"
                        />
                      </div>
                    </div>
                  </>
                )}

                {enrollmentView === "By Level" && (
                  <EnrollmentByLevel rows={enrollmentRows} />
                )}
              </div>

              <SectionDivider />

              {/* Performance rates */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Performance Rates
                  </h4>
                  <DashboardFilters
                    options={["Dropout", "Promotion", "Cohort"]}
                    active={rateView}
                    onChange={setRateView}
                  />
                </div>

                {rateView === "Dropout" && (
                  <PerformanceCard>
                    <div className="space-y-0.5">
                      {dropoutByLevel.map((d) => (
                        <MetricProgress key={d.label} {...d} />
                      ))}
                    </div>
                  </PerformanceCard>
                )}

                {rateView === "Promotion" && (
                  <PromotionChart data={promotionByLevel} />
                )}

                {rateView === "Cohort" && <CohortChart data={cohortTrend} />}
              </div>

              <SectionDivider />

              {/* Charts grid */}
              <DashboardGrid cols={2}>
                <EnrollmentChart data={enrollmentTrend} />
                <DropoutChart data={dropoutTrend} />
              </DashboardGrid>

              {/* Insight */}
              <div className="mt-4">
                <InsightCard
                  icon={<Info size={14} />}
                  variant="info"
                  title="Dropout trend improving"
                  message="The overall dropout rate has decreased by 0.28% over the past three years, indicating positive retention outcomes."
                />
              </div>
            </>
          )}
        </DashboardAccordion>

        <div className="mt-3" />

        {/* ── CESPES (Single Accordion with Tabs) ────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
              <Target size={16} className="text-rose-500" />
            </div>
          }
          title="CESPES"
          subtitle="Comprehensive Evaluation of Schools' Performance and Effectiveness"
        >
          {cespes.loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400 text-[0.8rem]">
              Loading CESPES data…
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-100 mb-5 overflow-x-auto pb-2">
                {[
                  "Operations",
                  "Support to Operations",
                  "General Admin",
                  "Individual Performance",
                  "Innovation & Intervention",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCespesTab(tab)}
                    className={`whitespace-nowrap px-4 py-2 text-[0.75rem] font-semibold rounded-t-lg transition-colors ${
                      activeCespesTab === tab
                        ? "text-blue-600 bg-blue-50/50 border-b-2 border-blue-500"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[200px]">
                {activeCespesTab === "Operations" && (
                  <>
                    <InsightCard
                      icon={<Info size={14} />}
                      variant={
                        cespes.operations.length === 0 ? "info" : "warning"
                      }
                      title={
                        cespes.operations.length === 0
                          ? "Showing Template View"
                          : "2nd Semester logic"
                      }
                      message={
                        cespes.operations.length === 0
                          ? `No Operations data uploaded for SY ${selectedYear}. Displaying empty template structure.`
                          : "The 2nd semester target equals the 1st semester's actual accomplishment. The 2nd semester accomplishment column is pending submission."
                      }
                    />
                    <div className="mt-4 flex items-center gap-4 mb-5">
                      <span className="flex items-center gap-1.5 text-[0.68rem] font-medium text-blue-600">
                        <span className="h-[6px] w-[6px] rounded-full bg-blue-500" />
                        1st Semester
                      </span>
                      <span className="flex items-center gap-1.5 text-[0.68rem] font-medium text-emerald-600">
                        <span className="h-[6px] w-[6px] rounded-full bg-emerald-500" />
                        2nd Semester
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        // Group operations by program
                        const programs = [];
                        const programMap = new Map();
                        const dataSource =
                          cespes.operations.length > 0
                            ? cespes.operations
                            : DEFAULT_CESPES_DATA.operations;

                        dataSource.forEach((row) => {
                          const pName = row.program || "(No Program)";
                          if (!programMap.has(pName)) {
                            const prog = { name: pName, rows: [] };
                            programMap.set(pName, prog);
                            programs.push(prog);
                          }
                          const iType = (
                            row.indicator_type || ""
                          ).toUpperCase();
                          programMap.get(pName).rows.push({
                            type: iType.startsWith("OUTCOME")
                              ? "OUTCOME"
                              : "OUTPUT",
                            label: row.indicator,
                            sem1Target: row.sem1_target || "—",
                            sem1Accomp: row.sem1_accomplishment || "—",
                            sem2Target: row.sem2_target || "—",
                            sem2Accomp: row.sem2_accomplishment || "—",
                          });
                        });
                        // Count outcomes/outputs per program
                        programs.forEach((p) => {
                          p.outcomes = p.rows.filter(
                            (r) => r.type === "OUTCOME",
                          ).length;
                          p.outputs = p.rows.filter(
                            (r) => r.type === "OUTPUT",
                          ).length;
                          p.reported = `${p.rows.length}/${p.rows.length}`;
                        });
                        return programs.map((prog) => (
                          <CespesProgramRow key={prog.name} program={prog} />
                        ));
                      })()}
                    </div>
                  </>
                )}

                {activeCespesTab === "Support to Operations" && (
                  <div className="space-y-4">
                    {cespes.supportOperations.length === 0 && (
                      <div className="text-[0.75rem] text-slate-500 italic px-1">
                        Showing empty template format. Upload data for SY{" "}
                        {selectedYear} to populate values.
                      </div>
                    )}
                    <CespesSemesterTable
                      rows={
                        cespes.supportOperations.length > 0
                          ? cespes.supportOperations
                          : DEFAULT_CESPES_DATA.supportOperations
                      }
                      groupKey="service_activity"
                      showPerson
                    />
                  </div>
                )}

                {activeCespesTab === "General Admin" && (
                  <div className="space-y-4">
                    {cespes.generalAdmin.length === 0 && (
                      <div className="text-[0.75rem] text-slate-500 italic px-1">
                        Showing empty template format. Upload data for SY{" "}
                        {selectedYear} to populate values.
                      </div>
                    )}
                    <CespesSemesterTable
                      rows={
                        cespes.generalAdmin.length > 0
                          ? cespes.generalAdmin
                          : DEFAULT_CESPES_DATA.generalAdmin
                      }
                      groupKey="service_activity"
                      showPerson
                    />
                  </div>
                )}

                {activeCespesTab === "Individual Performance" && (
                  <div className="space-y-4">
                    {cespes.individualPerformance.length === 0 && (
                      <div className="text-[0.75rem] text-slate-500 italic px-1">
                        Showing empty template format. Upload data for SY{" "}
                        {selectedYear} to populate values.
                      </div>
                    )}
                    <CespesPerformanceTable
                      rows={
                        cespes.individualPerformance.length > 0
                          ? cespes.individualPerformance
                          : DEFAULT_CESPES_DATA.individualPerformance
                      }
                    />
                  </div>
                )}

                {activeCespesTab === "Innovation & Intervention" && (
                  <div className="space-y-4">
                    {cespes.innovation.length === 0 && (
                      <div className="text-[0.75rem] text-slate-500 italic px-1">
                        Showing empty template format. Upload data for SY{" "}
                        {selectedYear} to populate values.
                      </div>
                    )}
                    <CespesInnovationTable
                      rows={
                        cespes.innovation.length > 0
                          ? cespes.innovation
                          : DEFAULT_CESPES_DATA.innovation
                      }
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </DashboardAccordion>

        <div className="mt-3" />

        {/* ── Accomplishment Report ─────────────────────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <FileText size={16} className="text-emerald-500" />
            </div>
          }
          title="Accomplishment Report"
          subtitle="Program targets vs. actual performance"
          subtitleColor="#10b981"
          accentBg="rgba(236,253,245,0.7)"
        >
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 opacity-25 text-emerald-500">
              <FileText size={36} strokeWidth={1.5} />
            </div>
            <p
              className="text-[0.78rem] font-semibold"
              style={{ color: "rgba(16,185,129,0.55)" }}
            >
              No data available for SY {selectedYear}
            </p>
          </div>
        </DashboardAccordion>

        <div className="mt-3" />

        {/* ── Crucial Resources ─────────────────────────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <School size={16} className="text-amber-500" />
            </div>
          }
          title="Crucial Resources"
          subtitle="No. of Teachers · Classrooms · Seats · Textbooks"
          subtitleColor="#d97706"
          accentBg="rgba(255,251,235,0.7)"
        >
          {!resources.teachers.loading &&
          resources.teachers.total === 0 &&
          resources.classrooms.total === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 opacity-25 text-amber-500">
                <School size={36} strokeWidth={1.5} />
              </div>
              <p
                className="text-[0.78rem] font-semibold"
                style={{ color: "rgba(217,119,6,0.55)" }}
              >
                No data available for SY {selectedYear}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end mb-4">
                <DashboardFilters
                  options={["Summary", "Charts", "By Level", "Breakdown"]}
                  active={resourceView}
                  onChange={setResourceView}
                />
              </div>

              {/* ── Summary view ───────────────────────────── */}
              {resourceView === "Summary" && (
                <DashboardGrid cols={2}>
                  <TrendCard
                    label="Total Teachers"
                    value={
                      resources.teachers.loading
                        ? "..."
                        : (resources.teachers.total || 0).toLocaleString()
                    }
                    change={
                      resources.teachers.needs > 0
                        ? `-${resources.teachers.needs.toLocaleString()} needs`
                        : "No needs"
                    }
                    direction={resources.teachers.needs > 0 ? "down" : "up"}
                    period="Total Inventory"
                  />
                  <TrendCard
                    label="Total Classrooms"
                    value={
                      resources.classrooms.loading
                        ? "..."
                        : (resources.classrooms.total || 0).toLocaleString()
                    }
                    change={
                      resources.classrooms.needs > 0
                        ? `-${resources.classrooms.needs.toLocaleString()} needs`
                        : "No needs"
                    }
                    direction={resources.classrooms.needs > 0 ? "down" : "up"}
                    period="Total Inventory"
                  />
                  <TrendCard
                    label="Total Seats"
                    value={
                      resources.seats.loading
                        ? "..."
                        : (resources.seats.total || 0).toLocaleString()
                    }
                    change={
                      resources.seats.needs > 0
                        ? `-${resources.seats.needs.toLocaleString()} needs`
                        : "No needs"
                    }
                    direction={resources.seats.needs > 0 ? "down" : "up"}
                    period="Total Inventory"
                  />
                  <TrendCard
                    label="Textbooks Shortage"
                    value={
                      resources.textbooks.loading
                        ? "..."
                        : (resources.textbooks.needs || 0).toLocaleString()
                    }
                    change="Current total gap"
                    direction={resources.textbooks.needs > 0 ? "down" : "up"}
                    period="System-wide"
                  />
                </DashboardGrid>
              )}

              {/* ── Charts view ────────────────────────────── */}
              {resourceView === "Charts" &&
                (() => {
                  const teachersData = Object.entries(
                    resources.teachers.breakdown || {},
                  ).map(([level, val]) => ({
                    level,
                    inventory: val,
                    needs: resources.teachers.needsBreakdown?.[level] || 0,
                  }));
                  const classroomsData = Object.entries(
                    resources.classrooms.breakdown || {},
                  ).map(([level, val]) => ({
                    level,
                    inventory: val,
                    needs: resources.classrooms.needsBreakdown?.[level] || 0,
                  }));
                  const seatsData = Object.entries(
                    resources.seats.breakdown || {},
                  ).map(([level, val]) => ({
                    level,
                    inventory: val,
                    needs: resources.seats.needsBreakdown?.[level] || 0,
                  }));
                  const textbooksData = Object.entries(
                    resources.textbooks.breakdown || {},
                  ).map(([level, val]) => ({
                    level,
                    shortage: val,
                  }));
                  return (
                    <div className="space-y-4">
                      <DashboardGrid cols={2}>
                        <ResourcesInventoryChart
                          title="Teachers · Inventory vs Needs"
                          data={teachersData}
                        />
                        <ResourcesInventoryChart
                          title="Classrooms · Inventory vs Needs"
                          data={classroomsData}
                        />
                      </DashboardGrid>
                      <DashboardGrid cols={2}>
                        <ResourcesInventoryChart
                          title="Seats · Inventory vs Needs"
                          data={seatsData}
                        />
                        <TextbooksChart data={textbooksData} />
                      </DashboardGrid>
                    </div>
                  );
                })()}

              {/* ── By Level view (Drill-down) ──────────────── */}
              {resourceView === "By Level" && (
                <ResourcesByLevel resources={resources} />
              )}

              {/* ── Breakdown view ──────────────────────────── */}
              {resourceView === "Breakdown" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Detailed Resource Breakdown
                    </h4>
                    <DashboardFilters
                      options={["Teachers", "Classrooms", "Seats", "Textbooks"]}
                      active={resourceType}
                      onChange={setResourceType}
                    />
                  </div>

                  <PerformanceCard>
                    <div className="space-y-0.5">
                      {(() => {
                        const resKey = resourceType.toLowerCase();
                        const resource = resources[resKey];
                        const breakdown = resource.breakdown || {};
                        const needsBreakdown = resource.needsBreakdown || {};
                        const total = resource.total || 1;

                        return Object.entries(breakdown).map(([level, val]) => {
                          // Calculate percentage for progress bar
                          const percentage = (val / total) * 100;

                          let color = "bg-blue-500";
                          let icon = <Users size={12} />;

                          if (resKey === "classrooms") {
                            color = "bg-emerald-500";
                            icon = <School size={12} />;
                          } else if (resKey === "seats") {
                            color = "bg-amber-500";
                            icon = <GraduationCap size={12} />;
                          } else if (resKey === "textbooks") {
                            color = "bg-rose-500";
                            icon = <BookOpen size={12} />;
                          }

                          const needs = needsBreakdown[level] || 0;
                          const displayValue = val.toLocaleString();
                          const countText =
                            needs > 0
                              ? `${needs.toLocaleString()} needs`
                              : "No needs";

                          // For textbooks, display is the shortage itself
                          if (resKey === "textbooks") {
                            const totalNeeds = resource.needs || 1;
                            return (
                              <MetricProgress
                                key={level}
                                label={level}
                                display={`${val.toLocaleString()} shortage`}
                                value={(val / totalNeeds) * 100}
                                color="bg-rose-500"
                              />
                            );
                          }

                          return (
                            <MetricProgress
                              key={level}
                              label={level}
                              display={displayValue}
                              count={countText}
                              value={percentage}
                              color={color}
                            />
                          );
                        });
                      })()}
                    </div>
                  </PerformanceCard>

                  <InsightCard
                    icon={<Info size={14} />}
                    variant="info"
                    title={`${resourceType} Distribution`}
                    message={`Showing the distribution of ${resourceType.toLowerCase()} across Elementary, JHS, and SHS levels based on current inventory data.`}
                  />
                </div>
              )}
            </>
          )}
        </DashboardAccordion>

        <div className="mt-3" />

        {/* ── QBEDP ─────────────────────────────────────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <BarChart3 size={16} className="text-blue-500" />
            </div>
          }
          title="QBEDP"
          subtitle="Quality Basic Education Development Plan"
          subtitleColor="#6366f1"
          accentBg="rgba(238,242,255,0.7)"
        >
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 opacity-25 text-indigo-400">
              <BarChart3 size={36} strokeWidth={1.5} />
            </div>
            <p
              className="text-[0.78rem] font-semibold"
              style={{ color: "rgba(99,102,241,0.55)" }}
            >
              No data available for SY {selectedYear}
            </p>
          </div>
        </DashboardAccordion>

        <div className="mt-3" />

        {/* ── AIP ───────────────────────────────────────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <BookOpen size={16} className="text-red-500" />
            </div>
          }
          title="AIP"
          subtitle="Annual Implementation Plan"
          subtitleColor="#ef4444"
          accentBg="rgba(254,242,242,0.7)"
        >
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 opacity-25 text-red-400">
              <BookOpen size={36} strokeWidth={1.5} />
            </div>
            <p
              className="text-[0.78rem] font-semibold"
              style={{ color: "rgba(239,68,68,0.55)" }}
            >
              No data available for SY {selectedYear}
            </p>
          </div>
        </DashboardAccordion>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}

// ─── Sub-component: CESPES Program Row ──────────────────────

function CespesProgramRow({ program }) {
  const [open, setOpen] = useState(false);
  const hasRows = program.rows && program.rows.length > 0;

  // Parse reported fraction for color
  const [reported, total] = (program.reported || "0/0").split("/").map(Number);
  const isComplete = reported === total && total > 0;

  return (
    <div className="rounded-[10px] border border-slate-100/80 overflow-hidden">
      <button
        onClick={() => hasRows && setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
          hasRows ? "hover:bg-slate-50/50 cursor-pointer" : "cursor-default"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${
            isComplete ? "bg-emerald-400" : "bg-blue-400"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[0.78rem] font-semibold text-slate-700 truncate">
            {program.name}
          </p>
          <p className="text-[0.65rem] text-slate-400 mt-0.5">
            {program.outcomes} outcomes · {program.outputs} outputs
          </p>
        </div>
        <span
          className={`text-[0.7rem] font-semibold px-2.5 py-1 rounded-full ${
            isComplete
              ? "bg-emerald-50 text-emerald-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          {program.reported} reported
        </span>
        {hasRows && (
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Expanded table */}
      {open && hasRows && (
        <div className="border-t border-slate-100/60 overflow-x-auto">
          <table className="w-full text-[0.72rem]">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500 w-[35%]">
                  Outcome / Output Indicator
                </th>
                <th
                  className="px-3 py-2.5 text-center font-semibold text-blue-500"
                  colSpan={2}
                >
                  1st Semester
                </th>
                <th
                  className="px-3 py-2.5 text-center font-semibold text-emerald-500"
                  colSpan={2}
                >
                  2nd Semester
                </th>
              </tr>
              <tr className="bg-slate-50/30">
                <th />
                <th className="px-3 py-1.5 text-center text-slate-400 font-medium">
                  Target
                </th>
                <th className="px-3 py-1.5 text-center text-slate-400 font-medium">
                  Accomplishment
                </th>
                <th className="px-3 py-1.5 text-center text-slate-400 font-medium">
                  Target
                </th>
                <th className="px-3 py-1.5 text-center text-slate-400 font-medium">
                  Accomplishment
                </th>
              </tr>
            </thead>
            <tbody>
              {program.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-slate-100/60 hover:bg-blue-50/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 shrink-0 text-[0.6rem] font-bold px-1.5 py-0.5 rounded ${
                          row.type === "OUTCOME"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {row.type}
                      </span>
                      <span className="text-slate-600 leading-relaxed">
                        {row.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">
                    {row.sem1Target}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">
                    {row.sem1Accomp === "Pending" ? (
                      <span className="text-slate-400 italic text-[0.65rem]">
                        Accomplishment to be reported by DepEd CO
                      </span>
                    ) : (
                      row.sem1Accomp
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.carried ? (
                      <div>
                        <span className="text-emerald-600 font-semibold">
                          {row.sem2Target}
                        </span>
                        <p className="text-[0.58rem] text-slate-400 mt-0.5">
                          * carried from 1st sem
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-600">{row.sem2Target}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.sem2Accomp === "Awaiting" ? (
                      <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        ⏳ Awaiting
                      </span>
                    ) : row.sem2Accomp === "Pending" ? (
                      <span className="text-slate-400 italic text-[0.65rem]">
                        Accomplishment to be reported by DepEd CO
                      </span>
                    ) : (
                      row.sem2Accomp
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: CESPES Semester Table (Support / General Admin) ──

function CespesSemesterTable({ rows, groupKey, showPerson }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-slate-100/80">
      <table className="w-full text-[0.72rem]">
        <thead>
          <tr className="bg-slate-50/70">
            <th className="px-4 py-2.5 text-left font-semibold text-slate-500 w-[22%]">
              Service / Activity
            </th>
            <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-[22%]">
              Performance Indicator
            </th>
            <th
              className="px-3 py-2.5 text-center font-semibold text-blue-500"
              colSpan={2}
            >
              1st Semester
            </th>
            <th
              className="px-3 py-2.5 text-center font-semibold text-emerald-500"
              colSpan={2}
            >
              2nd Semester
            </th>
            {showPerson && (
              <th className="px-3 py-2.5 text-center font-semibold text-slate-500">
                Person
              </th>
            )}
          </tr>
          <tr className="bg-slate-50/30">
            <th />
            <th />
            <th className="px-3 py-1.5 text-center text-slate-400 font-medium">
              Target
            </th>
            <th className="px-3 py-1.5 text-center text-slate-400 font-medium">
              Accomplishment
            </th>
            <th className="px-3 py-1.5 text-center text-slate-400 font-medium">
              Target
            </th>
            <th className="px-3 py-1.5 text-center text-slate-400 font-medium">
              Accomplishment
            </th>
            {showPerson && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t border-slate-100/60 hover:bg-blue-50/20 transition-colors"
            >
              <td className="px-4 py-3 text-slate-600">
                {row[groupKey] || ""}
              </td>
              <td className="px-3 py-3 text-slate-600">
                {row.indicator || ""}
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {row.sem1_target || "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {row.sem1_accomplishment || "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {row.sem2_target || "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {row.sem2_accomplishment || "—"}
              </td>
              {showPerson && (
                <td className="px-3 py-3 text-center text-slate-500 text-[0.65rem]">
                  {row.person_involved || ""}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-component: CESPES Individual Performance Table ─────

function CespesPerformanceTable({ rows }) {
  const formatIndicatorList = (text) => {
    if (!text) return "";

    // Split by the key performance dimensions
    const regex = /(QUALITY|EFFICIENCY|TIMELINESS)/gi;
    const parts = text.split(regex);

    if (parts.length <= 1) {
      return text;
    }

    const items = [];
    for (let i = 1; i < parts.length; i += 2) {
      const keyword = parts[i].toUpperCase();
      let content = (parts[i + 1] || "").trim();

      // Clean up leading dashes that might have been left
      if (content.startsWith("-")) {
        content = content.substring(1).trim();
      }

      items.push({ keyword, content });
    }

    return (
      <ul className="list-disc pl-4 space-y-1.5 marker:text-slate-400">
        {items.map((item, idx) => (
          <li key={idx} className="pl-1">
            <span className="font-semibold text-slate-700">{item.keyword}</span>
            {item.content ? ` - ${item.content}` : ""}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="overflow-x-auto rounded-[10px] border border-slate-100/80">
      <table className="w-full text-[0.72rem]">
        <thead>
          <tr className="bg-slate-50/70">
            <th className="px-4 py-2.5 text-left font-semibold text-slate-500 w-[20%]">
              Program Output
            </th>
            <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-[20%]">
              Process Output
            </th>
            <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-[35%]">
              Performance Indicator
            </th>
            <th className="px-3 py-2.5 text-center font-semibold text-blue-500">
              Target
            </th>
            <th className="px-3 py-2.5 text-center font-semibold text-emerald-500">
              Accomplishment
            </th>
            <th className="px-3 py-2.5 text-center font-semibold text-amber-500">
              Rating
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t border-slate-100/60 hover:bg-blue-50/20 transition-colors"
            >
              <td className="px-4 py-3 text-slate-600 leading-relaxed">
                {row.program_output || ""}
              </td>
              <td className="px-3 py-3 text-slate-600 leading-relaxed">
                {row.process_output || ""}
              </td>
              <td className="px-3 py-3 text-slate-600 leading-relaxed">
                {formatIndicatorList(row.performance_indicator)}
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {row.target || "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {row.accomplishment || "—"}
              </td>
              <td className="px-3 py-3 text-center">
                {row.rating ? (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-semibold bg-amber-50 text-amber-700">
                    {row.rating}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-component: CESPES Innovation Table ─────────────────

function CespesInnovationTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-slate-100/80">
      <table className="w-full text-[0.72rem]">
        <thead>
          <tr className="bg-slate-50/70">
            <th className="px-4 py-2.5 text-left font-semibold text-slate-500 w-[40%]">
              Output / Outcomes
            </th>
            <th className="px-3 py-2.5 text-center font-semibold text-blue-500">
              Quality
            </th>
            <th className="px-3 py-2.5 text-center font-semibold text-emerald-500">
              Quantity
            </th>
            <th className="px-3 py-2.5 text-center font-semibold text-amber-500">
              Timeliness
            </th>
            <th className="px-3 py-2.5 text-center font-semibold text-purple-500">
              Average
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t border-slate-100/60 hover:bg-blue-50/20 transition-colors"
            >
              <td className="px-4 py-3 text-slate-600 leading-relaxed">
                {row.output_outcomes || ""}
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {row.quality || "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {row.quantity || "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-600">
                {row.timeliness || "—"}
              </td>
              <td className="px-3 py-3 text-center">
                {row.average ? (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-semibold bg-purple-50 text-purple-700">
                    {row.average}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
