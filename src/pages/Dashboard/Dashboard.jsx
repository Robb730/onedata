/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { TrendingUp, Info, BarChart3, Target, FileText, BookOpen, School, Users, GraduationCap } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import {
  TrendingUp,
  Info,
  BarChart3,
  Target,
  FileText,
  BookOpen,
  School,
  Users,
  GraduationCap
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import {
  DashboardHeader,
  DashboardOverview,
  DashboardSection,
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

// ─── Sample data ────────────────────────────────────────────
// In production this would come from Supabase or context/store.

const overviewData = {
  totalEnrollment: 41215,
  overallDropout: "1.22%",
  elemPromotion: "99.22%",
  jhsDropout: "2.26%",
  enrollmentTrend: "+3.1%",
  dropoutTrend: "0.15%",
  promotionTrend: "0.4%",
  jhsDropoutTrend: "0.12%",
};

const enrollmentSummary = {
  public: 27646,
  private: 13569,
  total: 41215,
};

const dropoutByLevel = [
  {
    label: "Overall",
    display: "1.22%",
    value: 12.2,
    count: "320",
    color: "bg-rose-500",
  },
  {
    label: "Kinder",
    display: "—",
    value: 0,
    note: "Grouped with Elem K-G6 · See Elementary",
    color: "bg-gray-300",
  },
  {
    label: "Elementary",
    display: "0.82%",
    value: 8.2,
    count: "150",
    color: "bg-amber-500",
  },
  {
    label: "JHS",
    display: "2.26%",
    value: 22.6,
    count: "167",
    color: "bg-violet-500",
  },
  {
    label: "SHS",
    display: "0.47%",
    value: 4.7,
    count: "3",
    color: "bg-emerald-500",
  },
];

const promotionByLevel = [
  { level: "Kinder", rate: 99.8 },
  { level: "Elementary", rate: 99.22 },
  { level: "JHS", rate: 98.5 },
  { level: "SHS", rate: 97.9 },
];

const enrollmentTrend = [
  { year: "22-2023", public: 25200, private: 12100 },
  { year: "23-2024", public: 26800, private: 12900 },
  { year: "24-2025", public: 27646, private: 13569 },
  { year: "25-2026*", public: 9200, private: 4100 },
];

const dropoutTrend = [
  { year: "22-2023", overall: 1.5, elementary: 0.95, jhs: 2.6 },
  { year: "23-2024", overall: 1.35, elementary: 0.88, jhs: 2.4 },
  { year: "24-2025", overall: 1.22, elementary: 0.82, jhs: 2.26 },
];

const cohortTrend = [
  { year: "20-2021", rate: 82 },
  { year: "21-2022", rate: 85 },
  { year: "22-2023", rate: 87 },
  { year: "23-2024", rate: 89 },
  { year: "24-2025", rate: 91 },
];

const cespesPrograms = [
  {
    name: "Education Policy Development Program",
    outcomes: 2,
    outputs: 3,
    reported: "2/5",
    rows: [
      {
        type: "OUTCOME",
        label:
          "Percentage of completed education researches used for policy development",
        sem1Target: "—",
        sem1Accomp: "Pending",
        sem2Target: "—",
        sem2Accomp: "Pending",
      },
      {
        type: "OUTCOME",
        label:
          "Percentage of satisfactory feedback from clients on issued policies",
        sem1Target: "5",
        sem1Accomp: "4.99",
        sem2Target: "4.99",
        sem2Accomp: "Awaiting",
        carried: true,
      },
      {
        type: "OUTPUT",
        label: "Number of policies formulated, reviewed, and issued",
        sem1Target: "—",
        sem1Accomp: "Pending",
        sem2Target: "—",
        sem2Accomp: "Pending",
      },
      {
        type: "OUTPUT",
        label: "Number of education researches completed",
        sem1Target: "52",
        sem1Accomp: "60",
        sem2Target: "60",
        sem2Accomp: "Awaiting",
        carried: true,
      },
      {
        type: "OUTPUT",
        label: "Number of proposed policies reviewed",
        sem1Target: "—",
        sem1Accomp: "Pending",
        sem2Target: "—",
        sem2Accomp: "Pending",
      },
    ],
  },
  {
    name: "Basic Education Inputs Program",
    outcomes: 8,
    outputs: 7,
    reported: "15/15",
  },
  {
    name: "Inclusive Education Program",
    outcomes: 5,
    outputs: 5,
    reported: "10/10",
  },
  {
    name: "Support to Schools and Learners Program",
    outcomes: 7,
    outputs: 4,
    reported: "11/11",
  },
  {
    name: "Education Human Resource Development Program",
    outcomes: 1,
    outputs: 1,
    reported: "2/2",
  },
];

// ─── Component ──────────────────────────────────────────────

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [rateView, setRateView] = useState("Dropout");
  const [enrollmentView, setEnrollmentView] = useState("Summary");

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        // 1. Fetch Teachers
        const { data: tKes } = await supabase.from("teachers_kes").select("*");
        const { data: tJhs } = await supabase.from("teachers_jhs").select("*");
        const { data: tShs } = await supabase.from("teachers_shs").select("*");

        const tKesTotal = tKes?.reduce((acc, r) => acc + (r.prev_total_teachers_inventory || 0), 0) || 0;
        const tJhsTotal = tJhs?.reduce((acc, r) => acc + (r.prev_total_teachers_inventory || 0), 0) || 0;
        const tShsTotal = tShs?.reduce((acc, r) => acc + (r.prev_total_teachers_inventory || 0), 0) || 0;

        const tKesNeeds = tKes?.reduce((acc, r) => acc + (r.kinder_needs || 0) + (r.g1g6_needs || 0) + (r.sned_needs || 0), 0) || 0;
        const tJhsNeeds = tJhs?.reduce((acc, r) => acc + (r.teacher_needs || 0), 0) || 0;
        const tShsNeeds = tShs?.reduce((acc, r) => acc + (r.teacher_needs || 0), 0) || 0;

        // 2. Fetch Classrooms
        const { data: cKes } = await supabase.from("classrooms_kes").select("prev_total_classroom_inventory, kinder_needs, g1g6_needs, sned_needs");
        const { data: cJhs } = await supabase.from("classrooms_jhs").select("total_classroom, classroom_needs");
        const { data: cShs } = await supabase.from("classrooms_shs").select("total_classroom, classroom_needs");

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
        const { data: sKes } = await supabase.from("seats_kes").select("prev_total_seats_inventory, kinder_needs, g1g6_needs, sned_needs");
        const { data: sJhs } = await supabase.from("seats_jhs").select("total_jhs_seats, seat_needs");
        const { data: sShs } = await supabase.from("seats_shs").select("total_shs_seats, seat_needs");

        const sKesTotal = sKes?.reduce((acc, r) => acc + (r.prev_total_seats_inventory || 0), 0) || 0;
        const sJhsTotal = sJhs?.reduce((acc, r) => acc + (r.total_jhs_seats || 0), 0) || 0;
        const sShsTotal = sShs?.reduce((acc, r) => acc + (r.total_shs_seats || 0), 0) || 0;

        const sKesNeeds = sKes?.reduce((acc, r) => acc + (r.kinder_needs || 0) + (r.g1g6_needs || 0) + (r.sned_needs || 0), 0) || 0;
        const sJhsNeeds = sJhs?.reduce((acc, r) => acc + (r.seat_needs || 0), 0) || 0;
        const sShsNeeds = sShs?.reduce((acc, r) => acc + (r.seat_needs || 0), 0) || 0;

        // 4. Fetch Textbooks
        const { data: txKes } = await supabase.from("textbooks_kes").select("textbook_needs, textbook_excess");
        const { data: txJhs } = await supabase.from("textbooks_jhs").select("textbook_needs, textbook_excess");
        const { data: txShs } = await supabase.from("textbooks_shs").select("textbook_needs, textbook_excess");

        const txKesNeeds = txKes?.reduce((acc, r) => acc + (r.textbook_needs || 0), 0) || 0;
        const txJhsNeeds = txJhs?.reduce((acc, r) => acc + (r.textbook_needs || 0), 0) || 0;
        const txShsNeeds = txShs?.reduce((acc, r) => acc + (r.textbook_needs || 0), 0) || 0;

        setResources({
          teachers: { 
            total: tKesTotal + tJhsTotal + tShsTotal, 
            needs: tKesNeeds + tJhsNeeds + tShsNeeds, 
            breakdown: { Elementary: tKesTotal, JHS: tJhsTotal, SHS: tShsTotal },
            needsBreakdown: { Elementary: tKesNeeds, JHS: tJhsNeeds, SHS: tShsNeeds },
            data: { Elementary: tKes, JHS: tJhs, SHS: tShs },
            loading: false 
          },
          classrooms: { 
            total: cKesTotal + cJhsTotal + cShsTotal, 
            needs: cKesNeeds + cJhsNeeds + cShsNeeds, 
            breakdown: { Elementary: cKesTotal, JHS: cJhsTotal, SHS: cShsTotal },
            needsBreakdown: { Elementary: cKesNeeds, JHS: cJhsNeeds, SHS: cShsNeeds },
            data: { Elementary: cKes, JHS: cJhs, SHS: cShs },
            loading: false 
          },
          seats: { 
            total: sKesTotal + sJhsTotal + sShsTotal, 
            needs: sKesNeeds + sJhsNeeds + sShsNeeds, 
            breakdown: { Elementary: sKesTotal, JHS: sJhsTotal, SHS: sShsTotal },
            needsBreakdown: { Elementary: sKesNeeds, JHS: sJhsNeeds, SHS: sShsNeeds },
            data: { Elementary: sKes, JHS: sJhs, SHS: sShs },
            loading: false 
          },
          textbooks: { 
            needs: txKesNeeds + txJhsNeeds + txShsNeeds, 
            breakdown: { Elementary: txKesNeeds, JHS: txJhsNeeds, SHS: txShsNeeds },
            data: { Elementary: txKes, JHS: txJhs, SHS: txShs },
            loading: false 
          },
        });

      } catch (error) {
        console.error("Error fetching crucial resources:", error);
      }
    }

    fetchEnrollmentSummary();
    fetchCrucialResources();
  }, [selectedYear]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1100px] px-5 py-7">
        {/* ── Header ──────────────────────────────────── */}
        <DashboardHeader
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onCompare={() => { }}
        />

        {/* ── Title ───────────────────────────────────── */}
        <DashboardSection title="Dashboard" subtitle={`SY ${selectedYear}`}>
          {/* ── Overview KPIs ────────────────────────── */}
          <DashboardOverview data={overviewData} selectedYear={selectedYear} />
        </DashboardSection>

        <SectionDivider />

        {/* ── Performance Indicators (accordion) ─────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              <TrendingUp size={16} className="text-indigo-500" />
            </div>
          }
          title="Performance Indicators"
          subtitle="Enrollment · Dropout · Promotion · Cohort Survival"
          defaultOpen
        >
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
                      privateCount={loading ? 0 : genderSummary.male.private}
                      accent="#3b82f6"
                      hoverAccent="#60a5fa"
                    />
                    <GenderCard
                      label="Female"
                      total={loading ? 0 : genderSummary.female.total}
                      publicCount={loading ? 0 : genderSummary.female.public}
                      privateCount={loading ? 0 : genderSummary.female.private}
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
        </DashboardAccordion>

        <div className="mt-4" />

        {/* ── CESPES (accordion) ──────────────────────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
              <Target size={16} className="text-rose-500" />
            </div>
          }
          title="CESPES"
          subtitle="Part I Operations · Program Targets & Accomplishments"
        >
          <InsightCard
            icon={<Info size={14} />}
            variant="warning"
            title="2nd Semester logic"
            message="The 2nd semester target equals the 1st semester's actual accomplishment. The 2nd semester accomplishment column is pending submission."
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
            <span className="flex items-center gap-1.5 text-[0.68rem] font-medium text-amber-600">
              <span className="h-[6px] w-[6px] rounded-full bg-amber-500" />
              Awaiting 2nd Sem Accomplishment
            </span>
          </div>

          <div className="space-y-3">
            {cespesPrograms.map((prog) => (
              <CespesProgramRow key={prog.name} program={prog} />
            ))}
          </div>
        </DashboardAccordion>

        <div className="mt-4" />

        {/* ── Accomplishment Report (accordion) ──────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <FileText size={16} className="text-emerald-500" />
            </div>
          }
          title="Accomplishment Report"
          subtitle="Program targets vs. actual performance"
        >
          <div className="flex items-center justify-center py-10 text-slate-400 text-[0.8rem]">
            Accomplishment data will appear here once uploaded.
          </div>
        </DashboardAccordion>

        <div className="mt-4" />

        {/* ── Crucial Resources (accordion) ──────────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <School size={16} className="text-amber-500" />
            </div>
          }
          title="Crucial Resources"
          subtitle="No. of Teachers · Classrooms · Seats · Textbooks"
        >
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
                value={resources.teachers.loading ? "..." : (resources.teachers.total || 0).toLocaleString()}
                change={resources.teachers.needs > 0 ? `-${resources.teachers.needs.toLocaleString()} needs` : "No needs"}
                direction={resources.teachers.needs > 0 ? "down" : "up"}
                period="Total Inventory"
              />
              <TrendCard
                label="Total Classrooms"
                value={resources.classrooms.loading ? "..." : (resources.classrooms.total || 0).toLocaleString()}
                change={resources.classrooms.needs > 0 ? `-${resources.classrooms.needs.toLocaleString()} needs` : "No needs"}
                direction={resources.classrooms.needs > 0 ? "down" : "up"}
                period="Total Inventory"
              />
              <TrendCard
                label="Total Seats"
                value={resources.seats.loading ? "..." : (resources.seats.total || 0).toLocaleString()}
                change={resources.seats.needs > 0 ? `-${resources.seats.needs.toLocaleString()} needs` : "No needs"}
                direction={resources.seats.needs > 0 ? "down" : "up"}
                period="Total Inventory"
              />
              <TrendCard
                label="Textbooks Shortage"
                value={resources.textbooks.loading ? "..." : (resources.textbooks.needs || 0).toLocaleString()}
                change="Current total gap"
                direction={resources.textbooks.needs > 0 ? "down" : "up"}
                period="System-wide"
              />
            </DashboardGrid>
          )}

          {/* ── Charts view ────────────────────────────── */}
          {resourceView === "Charts" && (() => {
            const teachersData = Object.entries(resources.teachers.breakdown || {}).map(([level, val]) => ({
              level,
              inventory: val,
              needs: resources.teachers.needsBreakdown?.[level] || 0,
            }));
            const classroomsData = Object.entries(resources.classrooms.breakdown || {}).map(([level, val]) => ({
              level,
              inventory: val,
              needs: resources.classrooms.needsBreakdown?.[level] || 0,
            }));
            const seatsData = Object.entries(resources.seats.breakdown || {}).map(([level, val]) => ({
              level,
              inventory: val,
              needs: resources.seats.needsBreakdown?.[level] || 0,
            }));
            const textbooksData = Object.entries(resources.textbooks.breakdown || {}).map(([level, val]) => ({
              level,
              shortage: val,
            }));
            return (
              <div className="space-y-4">
                <DashboardGrid cols={2}>
                  <ResourcesInventoryChart title="Teachers · Inventory vs Needs" data={teachersData} />
                  <ResourcesInventoryChart title="Classrooms · Inventory vs Needs" data={classroomsData} />
                </DashboardGrid>
                <DashboardGrid cols={2}>
                  <ResourcesInventoryChart title="Seats · Inventory vs Needs" data={seatsData} />
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
                      const countText = needs > 0 ? `${needs.toLocaleString()} needs` : "No needs";

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
        </DashboardAccordion>

        <div className="mt-4" />

        {/* ── QBEDP (accordion) ──────────────────────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <BarChart3 size={16} className="text-blue-500" />
            </div>
          }
          title="QBEDP"
          subtitle="Quality Basic Education Development Plan"
        >
          <div className="flex items-center justify-center py-10 text-slate-400 text-[0.8rem]">
            QBEDP data will appear here once uploaded.
          </div>
        </DashboardAccordion>

        <div className="mt-4" />

        {/* ── AIP (accordion) ────────────────────────── */}
        <DashboardAccordion
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <BookOpen size={16} className="text-red-500" />
            </div>
          }
          title="AIP"
          subtitle="Annual Implementation Plan"
        >
          <div className="flex items-center justify-center py-10 text-slate-400 text-[0.8rem]">
            AIP data will appear here once uploaded.
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
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${hasRows ? "hover:bg-slate-50/50 cursor-pointer" : "cursor-default"
          }`}
      >
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${isComplete ? "bg-emerald-400" : "bg-blue-400"
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
          className={`text-[0.7rem] font-semibold px-2.5 py-1 rounded-full ${isComplete
              ? "bg-emerald-50 text-emerald-600"
              : "bg-blue-50 text-blue-600"
            }`}
        >
          {program.reported} reported
        </span>
        {hasRows && (
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""
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
                        className={`mt-0.5 shrink-0 text-[0.6rem] font-bold px-1.5 py-0.5 rounded ${row.type === "OUTCOME"
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
{/* ── Crucial Resources (accordion) ──────────── */ }
