/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
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
  Download,
  ArrowRight,
  X,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
  PerformanceCard,
  TrendCard,
  GenderCard,
} from "../../components/DashboardComponents";

const EnrollmentChart = lazy(() =>
  import("../../components/DashboardComponents/EnrollmentChart.jsx").then(
    (m) => ({
      default: m.EnrollmentChart,
    }),
  ),
);
const DropoutChart = lazy(() =>
  import("../../components/DashboardComponents/DropoutChart.jsx").then((m) => ({
    default: m.DropoutChart,
  })),
);
const PromotionChart = lazy(() =>
  import("../../components/DashboardComponents/PromotionChart.jsx").then(
    (m) => ({
      default: m.PromotionChart,
    }),
  ),
);
const CohortChart = lazy(() =>
  import("../../components/DashboardComponents/CohortChart.jsx").then((m) => ({
    default: m.CohortChart,
  })),
);
const ResourcesInventoryChart = lazy(() =>
  import("../../components/DashboardComponents/ResourcesInventoryChart.jsx").then(
    (m) => ({
      default: m.ResourcesInventoryChart,
    }),
  ),
);
const TextbooksChart = lazy(() =>
  import("../../components/DashboardComponents/TextbooksChart.jsx").then(
    (m) => ({
      default: m.TextbooksChart,
    }),
  ),
);
const EnrollmentByLevel = lazy(() =>
  import("../../components/DashboardComponents/EnrollmentByLevel.jsx").then(
    (m) => ({
      default: m.EnrollmentByLevel,
    }),
  ),
);
const ResourcesByLevel = lazy(() =>
  import("../../components/DashboardComponents/ResourcesByLevel.jsx").then(
    (m) => ({
      default: m.ResourcesByLevel,
    }),
  ),
);

function ChartFallback() {
  return <div className="h-[220px] animate-pulse rounded-xl bg-slate-100/80" />;
}
import { DEFAULT_CESPES_DATA } from "../../data/cespesTemplateData";
import { getAllSchoolYearsForSelector } from "../../utils/schoolYearsApi"; // adjust path as needed
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";

// ─── Sample data ────────────────────────────────────────────
// In production this would come from Supabase or context/store.

const enrollmentTrendStatic = [
  { year: "22-2023", public: 25200, private: 12100 },
  { year: "23-2024", public: 26800, private: 12900 },
  { year: "24-2025", public: 27646, private: 13569 },
  { year: "25-2026*", public: 9200, private: 4100 },
];

// ─── Helper: compute enrollment totals from raw rows ─────────
// Extracted so both the primary-year fetch and the compare-year
// fetch can share the exact same aggregation logic.
function computeEnrollmentTotals(data) {
  const publicTotal = data
    .filter((row) => row.category === "PUBLIC")
    .reduce((acc, row) => acc + (row.grand_total ?? 0), 0);

  const privateTotal = data
    .filter((row) => row.category === "PRIVATE")
    .reduce((acc, row) => acc + (row.grand_total ?? 0), 0);

  return {
    public: publicTotal,
    private: privateTotal,
    total: publicTotal + privateTotal,
  };
}

function formatTransitionDate(dateStr) {
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
}

function getDaysUntilLabel(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  const days = Math.round(diffMs / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

async function fetchResourcesForYear(year) {
  const [
    { data: tKes },
    { data: tJhs },
    { data: tShs },
    { data: cKes },
    { data: cJhs },
    { data: cShs },
    { data: sKes },
    { data: sJhs },
    { data: sShs },
    { data: txKes },
    { data: txJhs },
    { data: txShs },
  ] = await Promise.all([
    supabase.from("teachers_kes").select("*").eq("school_year", year),
    supabase.from("teachers_jhs").select("*").eq("school_year", year),
    supabase.from("teachers_shs").select("*").eq("school_year", year),
    supabase.from("classrooms_kes").select("*").eq("school_year", year),
    supabase.from("classrooms_jhs").select("*").eq("school_year", year),
    supabase.from("classrooms_shs").select("*").eq("school_year", year),
    supabase.from("seats_kes").select("*").eq("school_year", year),
    supabase.from("seats_jhs").select("*").eq("school_year", year),
    supabase.from("seats_shs").select("*").eq("school_year", year),
    supabase.from("textbooks_kes").select("*").eq("school_year", year),
    supabase.from("textbooks_jhs").select("*").eq("school_year", year),
    supabase.from("textbooks_shs").select("*").eq("school_year", year),
  ]);

  const tKesTotal =
    tKes?.reduce((acc, r) => acc + (r.prev_total_teachers_inventory || 0), 0) ||
    0;
  const tJhsTotal =
    tJhs?.reduce((acc, r) => acc + (r.prev_total_teachers_inventory || 0), 0) ||
    0;
  const tShsTotal =
    tShs?.reduce((acc, r) => acc + (r.prev_total_teachers_inventory || 0), 0) ||
    0;

  const tKesNeeds =
    tKes?.reduce(
      (acc, r) =>
        acc + (r.kinder_needs || 0) + (r.g1g6_needs || 0) + (r.sned_needs || 0),
      0,
    ) || 0;
  const tJhsNeeds =
    tJhs?.reduce((acc, r) => acc + (r.teacher_needs || 0), 0) || 0;
  const tShsNeeds =
    tShs?.reduce((acc, r) => acc + (r.teacher_needs || 0), 0) || 0;

  const cKesTotal =
    cKes?.reduce(
      (acc, r) => acc + (r.prev_total_classroom_inventory || 0),
      0,
    ) || 0;
  const cJhsTotal =
    cJhs?.reduce((acc, r) => acc + (r.total_classroom || 0), 0) || 0;
  const cShsTotal =
    cShs?.reduce((acc, r) => acc + (r.total_classroom || 0), 0) || 0;

  const cKesNeeds =
    cKes?.reduce(
      (acc, r) =>
        acc + (r.kinder_needs || 0) + (r.g1g6_needs || 0) + (r.sned_needs || 0),
      0,
    ) || 0;
  const cJhsNeeds =
    cJhs?.reduce((acc, r) => acc + (r.classroom_needs || 0), 0) || 0;
  const cShsNeeds =
    cShs?.reduce((acc, r) => acc + (r.classroom_needs || 0), 0) || 0;

  const sKesTotal =
    sKes?.reduce((acc, r) => acc + (r.prev_total_seats_inventory || 0), 0) || 0;
  const sJhsTotal =
    sJhs?.reduce((acc, r) => acc + (r.total_jhs_seats || 0), 0) || 0;
  const sShsTotal =
    sShs?.reduce((acc, r) => acc + (r.total_shs_seats || 0), 0) || 0;

  const sKesNeeds =
    sKes?.reduce(
      (acc, r) =>
        acc + (r.kinder_needs || 0) + (r.g1g6_needs || 0) + (r.sned_needs || 0),
      0,
    ) || 0;
  const sJhsNeeds = sJhs?.reduce((acc, r) => acc + (r.seat_needs || 0), 0) || 0;
  const sShsNeeds = sShs?.reduce((acc, r) => acc + (r.seat_needs || 0), 0) || 0;

  const txKesNeeds =
    txKes?.reduce((acc, r) => acc + (r.textbook_needs || 0), 0) || 0;
  const txJhsNeeds =
    txJhs?.reduce((acc, r) => acc + (r.textbook_needs || 0), 0) || 0;
  const txShsNeeds =
    txShs?.reduce((acc, r) => acc + (r.textbook_needs || 0), 0) || 0;

  return {
    teachers: {
      total: tKesTotal + tJhsTotal + tShsTotal,
      needs: tKesNeeds + tJhsNeeds + tShsNeeds,
      breakdown: { Elementary: tKesTotal, JHS: tJhsTotal, SHS: tShsTotal },
      needsBreakdown: { Elementary: tKesNeeds, JHS: tJhsNeeds, SHS: tShsNeeds },
      data: { Elementary: tKes, JHS: tJhs, SHS: tShs },
      loading: false,
    },
    classrooms: {
      total: cKesTotal + cJhsTotal + cShsTotal,
      needs: cKesNeeds + cJhsNeeds + cShsNeeds,
      breakdown: { Elementary: cKesTotal, JHS: cJhsTotal, SHS: cShsTotal },
      needsBreakdown: { Elementary: cKesNeeds, JHS: cJhsNeeds, SHS: cShsNeeds },
      data: { Elementary: cKes, JHS: cJhs, SHS: cShs },
      loading: false,
    },
    seats: {
      total: sKesTotal + sJhsTotal + sShsTotal,
      needs: sKesNeeds + sJhsNeeds + sShsNeeds,
      breakdown: { Elementary: sKesTotal, JHS: sJhsTotal, SHS: sShsTotal },
      needsBreakdown: { Elementary: sKesNeeds, JHS: sJhsNeeds, SHS: sShsNeeds },
      data: { Elementary: sKes, JHS: sJhs, SHS: sShs },
      loading: false,
    },
    textbooks: {
      needs: txKesNeeds + txJhsNeeds + txShsNeeds,
      breakdown: { Elementary: txKesNeeds, JHS: txJhsNeeds, SHS: txShsNeeds },
      data: { Elementary: txKes, JHS: txJhs, SHS: txShs },
      loading: false,
    },
  };
}

// ─── Missing Components ─────────────────────────────────────
function ResourcesChartsPanel({ color, year, ongoing, resources }) {
  const teachersData = Object.entries(resources.teachers.breakdown || {}).map(
    ([level, val]) => ({
      level,
      inventory: val,
      needs: resources.teachers.needsBreakdown?.[level] || 0,
    }),
  );
  const classroomsData = Object.entries(
    resources.classrooms.breakdown || {},
  ).map(([level, val]) => ({
    level,
    inventory: val,
    needs: resources.classrooms.needsBreakdown?.[level] || 0,
  }));
  const seatsData = Object.entries(resources.seats.breakdown || {}).map(
    ([level, val]) => ({
      level,
      inventory: val,
      needs: resources.seats.needsBreakdown?.[level] || 0,
    }),
  );
  const textbooksData = Object.entries(resources.textbooks.breakdown || {}).map(
    ([level, val]) => ({
      level,
      shortage: val,
    }),
  );

  const colorClasses = {
    blue: "text-blue-600 bg-blue-500",
    orange: "text-orange-600 bg-orange-500",
  };
  const [textColor, bgColor] = colorClasses[color]
    ? colorClasses[color].split(" ")
    : ["text-slate-600", "bg-slate-500"];

  return (
    <div className="space-y-3">
      <p
        className={`flex items-center gap-1.5 text-[0.72rem] font-bold ${textColor}`}
      >
        <span className={`h-[6px] w-[6px] rounded-full ${bgColor}`} />
        {year}
        {ongoing && <Clock size={11} className="text-orange-400" />}
      </p>
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
    </div>
  );
}

function renderBreakdownRows(resourceType, resources) {
  const resourceKey = resourceType.toLowerCase();
  const resData = resources[resourceKey];
  if (!resData) return null;

  return Object.entries(resData.breakdown || {}).map(([level, val]) => (
    <div
      key={level}
      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
    >
      <span className="text-[0.75rem] font-medium text-slate-600">{level}</span>
      <div className="text-right">
        <span className="text-[0.8rem] font-bold text-slate-800">{val}</span>
        <p className="text-[0.65rem] text-slate-400">
          {resourceType === "Textbooks" ? "Shortage: " : "Needs: "}
          {resourceType === "Textbooks"
            ? val
            : resData.needsBreakdown?.[level] || 0}
        </p>
      </div>
    </div>
  ));
}

// ─── Component ──────────────────────────────────────────────
export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useUser();

  const performanceSectionRef = useRef(null);
  const resourcesSectionRef = useRef(null);
  const navStateHandledRef = useRef(false);

  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const welcomeToastShownRef = useRef(false);

  useEffect(() => {
    if (location.state?.justLoggedIn && !welcomeToastShownRef.current) {
      welcomeToastShownRef.current = true;
      setShowWelcomeToast(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!location.state?.scrollToSection || navStateHandledRef.current) return;
    navStateHandledRef.current = true;

    const { scrollToSection, resourceView, resourceType } = location.state;

    if (resourceView) setResourceView(resourceView);
    if (resourceType) setResourceType(resourceType);

    const targetRef =
      scrollToSection === "performance"
        ? performanceSectionRef
        : scrollToSection === "resources"
          ? resourcesSectionRef
          : null;

    const scrollTimer = setTimeout(() => {
      targetRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);

    navigate(location.pathname, { replace: true, state: {} });

    return () => clearTimeout(scrollTimer);
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!showWelcomeToast) return;
    const t = setTimeout(() => setShowWelcomeToast(false), 5000);
    return () => clearTimeout(t);
  }, [showWelcomeToast]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [rateView, setRateView] = useState("Dropout");
  const [enrollmentView, setEnrollmentView] = useState("Summary");

  // ── Year & Dropdowns
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef(null);

  const [compareMode, setCompareMode] = useState(false);
  const [compareYear, setCompareYear] = useState(null);
  const [isCompareYearDropdownOpen, setIsCompareYearDropdownOpen] =
    useState(false);
  const compareYearDropdownRef = useRef(null);

  // ── Crucial Resources Views
  const [resourceView, setResourceView] = useState("Summary");
  const [resourceType, setResourceType] = useState("Teachers");

  const [activeCespesTab, setActiveCespesTab] = useState("Operations");

  // --- useQuery logic replaces all the fetching useEffects ---
  const { data: yearData, isLoading: yearsLoading } = useQuery({
    queryKey: ["schoolYears"],
    queryFn: async () => {
      const { data: activeRow } = await supabase
        .from("school_years")
        .select("label")
        .eq("status", "active")
        .maybeSingle();
      const years = await getAllSchoolYearsForSelector();
      return {
        years,
        defaultYear:
          years.length > 0 ? years[0].year : activeRow?.label || null,
      };
    },
  });

  const schoolYears = yearData?.years || [];

  useEffect(() => {
    if (yearData && !selectedYear) setSelectedYear(yearData.defaultYear);
  }, [yearData, selectedYear]);

  // Enrollment
  const {
    data: enrollmentObj,
    isLoading: isEnrollmentLoading,
    error: enrollmentError,
  } = useQuery({
    queryKey: ["enrollment", selectedYear],
    enabled: !!selectedYear,
    queryFn: async ({ queryKey }) => {
      const [, year] = queryKey;
      const { data, error } = await supabase
        .from("enrollment_data")
        .select(
          "category, grand_total, school_name, elementary_data, junior_high_data, senior_high_s1_data, senior_high_s2_data",
        )
        .eq("school_year", year);
      if (error) throw error;

      const { data: allEnrollment } = await supabase
        .from("enrollment_data")
        .select("school_year, category, grand_total");
      let trendData = enrollmentTrendStatic;
      if (allEnrollment) {
        const trendYears = [
          ...new Set(allEnrollment.map((d) => d.school_year)),
        ].sort();
        trendData = trendYears.map((year) => {
          const yData = allEnrollment.filter((d) => d.school_year === year);
          return {
            year,
            public: yData
              .filter((d) => d.category === "PUBLIC")
              .reduce((acc, row) => acc + (row.grand_total ?? 0), 0),
            private: yData
              .filter((d) => d.category === "PRIVATE")
              .reduce((acc, row) => acc + (row.grand_total ?? 0), 0),
          };
        });
      }

      const totals = computeEnrollmentTotals(data || []);
      let malePublic = 0,
        malePrivate = 0,
        femalePublic = 0,
        femalePrivate = 0;
      (data || []).forEach((row) => {
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

      return {
        rows: data,
        summary: totals,
        gender: {
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
        },
        trend: trendData,
      };
    },
  });

  const enrollmentRows = enrollmentObj?.rows || [];
  const enrollmentSummary = enrollmentObj?.summary || {
    public: 0,
    private: 0,
    total: 0,
  };
  const genderSummary = enrollmentObj?.gender || {
    male: { total: 0, public: 0, private: 0 },
    female: { total: 0, public: 0, private: 0 },
  };
  const enrollmentTrend = enrollmentObj?.trend || enrollmentTrendStatic;

  const loading = isEnrollmentLoading || !selectedYear;
  const error = enrollmentError?.message || null;

  // Crucial Resources
  const { data: resourcesObj, isLoading: resourcesLoading } = useQuery({
    queryKey: ["resources", selectedYear],
    enabled: !!selectedYear,
    queryFn: ({ queryKey }) => fetchResourcesForYear(queryKey[1]),
  });

  const resources = resourcesObj || {
    teachers: { total: 0, needs: 0, breakdown: {}, loading: true },
    classrooms: { total: 0, needs: 0, breakdown: {}, loading: true },
    seats: { total: 0, needs: 0, breakdown: {}, loading: true },
    textbooks: { needs: 0, excess: 0, breakdown: {}, loading: true },
  };

  // CESPES
  const { data: cespesObj } = useQuery({
    queryKey: ["cespes", selectedYear],
    enabled: !!selectedYear,
    queryFn: async ({ queryKey }) => {
      const [, year] = queryKey;
      const [ops, support, admin, perf, innov] = await Promise.all([
        supabase.from("cespes_operations").select("*").eq("school_year", year),
        supabase
          .from("cespes_support_operations")
          .select("*")
          .eq("school_year", year),
        supabase
          .from("cespes_general_admin")
          .select("*")
          .eq("school_year", year),
        supabase
          .from("cespes_individual_performance")
          .select("*")
          .eq("school_year", year),
        supabase.from("cespes_innovation").select("*").eq("school_year", year),
      ]);
      return {
        operations: ops.data || [],
        supportOperations: support.data || [],
        generalAdmin: admin.data || [],
        individualPerformance: perf.data || [],
        innovation: innov.data || [],
        loading: false,
      };
    },
  });

  const cespes = cespesObj || {
    operations: [],
    supportOperations: [],
    generalAdmin: [],
    individualPerformance: [],
    innovation: [],
    loading: true,
  };

  // KPIs
  const { data: kpiDataObj } = useQuery({
    queryKey: ["kpiData"],
    queryFn: async () => {
      const { data } = await supabase
        .from("performance_indicators_data")
        .select("*");
      return data || [];
    },
  });
  const kpiData = kpiDataObj || [];

  // Compare Enrollment
  const { data: compareEnrollmentObj, isLoading: compareLoading } = useQuery({
    queryKey: ["enrollment", compareYear],
    enabled: !!compareMode && !!compareYear,
    queryFn: async ({ queryKey }) => {
      const [, year] = queryKey;
      const { data } = await supabase
        .from("enrollment_data")
        .select(
          "category, grand_total, school_name, elementary_data, junior_high_data, senior_high_s1_data, senior_high_s2_data",
        )
        .eq("school_year", year);
      return {
        rows: data || [],
        summary: computeEnrollmentTotals(data || []),
      };
    },
  });

  const compareEnrollmentRows = compareEnrollmentObj?.rows || [];
  const compareEnrollmentSummary = compareEnrollmentObj?.summary || {
    public: 0,
    private: 0,
    total: 0,
  };

  // Compare Resources
  const { data: compareResourcesObj, isLoading: compareResourcesLoading } =
    useQuery({
      queryKey: ["resources", compareYear],
      enabled: !!compareMode && !!compareYear,
      queryFn: ({ queryKey }) => fetchResourcesForYear(queryKey[1]),
    });

  const compareResources = compareResourcesObj || {
    teachers: { total: 0, needs: 0, breakdown: {}, loading: false },
    classrooms: { total: 0, needs: 0, breakdown: {}, loading: false },
    seats: { total: 0, needs: 0, breakdown: {}, loading: false },
    textbooks: { needs: 0, excess: 0, breakdown: {}, loading: false },
  };

  // Compare Cespes
  const { data: compareCespesObj } = useQuery({
    queryKey: ["cespes", compareYear],
    enabled: !!compareMode && !!compareYear,
    queryFn: async ({ queryKey }) => {
      const [, year] = queryKey;
      const [ops, support, admin, perf, innov] = await Promise.all([
        supabase.from("cespes_operations").select("*").eq("school_year", year),
        supabase
          .from("cespes_support_operations")
          .select("*")
          .eq("school_year", year),
        supabase
          .from("cespes_general_admin")
          .select("*")
          .eq("school_year", year),
        supabase
          .from("cespes_individual_performance")
          .select("*")
          .eq("school_year", year),
        supabase.from("cespes_innovation").select("*").eq("school_year", year),
      ]);
      return {
        operations: ops.data || [],
        supportOperations: support.data || [],
        generalAdmin: admin.data || [],
        individualPerformance: perf.data || [],
        innovation: innov.data || [],
        loading: false,
      };
    },
  });

  const compareCespes = compareCespesObj || {
    operations: [],
    supportOperations: [],
    generalAdmin: [],
    individualPerformance: [],
    innovation: [],
    loading: false,
  };

  // Scheduled transition
  const { data: scheduledTransitionObj } = useQuery({
    queryKey: ["scheduledTransition"],
    queryFn: async () => {
      const { data } = await supabase
        .from("school_years")
        .select("id, label, activation_date")
        .eq("status", "scheduled")
        .order("activation_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const [showTransitionBanner, setShowTransitionBanner] = useState(false);
  useEffect(() => {
    if (scheduledTransitionObj) {
      const dismissedKey = `transitionBannerDismissed:${scheduledTransitionObj.id}`;
      if (sessionStorage.getItem(dismissedKey) !== "1") {
        setShowTransitionBanner(true);
      }
    }
  }, [scheduledTransitionObj]);

  const scheduledTransition = scheduledTransitionObj || null;

  const dismissTransitionBanner = () => {
    if (scheduledTransition) {
      sessionStorage.setItem(
        `transitionBannerDismissed:${scheduledTransition.id}`,
        "1",
      );
    }
    setShowTransitionBanner(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target)
      )
        setIsYearDropdownOpen(false);
      if (
        compareYearDropdownRef.current &&
        !compareYearDropdownRef.current.contains(event.target)
      )
        setIsCompareYearDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Derived KPI Calculations ───────────────────────────────
  const getKpiRate = (yearData, sheetName, headerSubstring) => {
    const sheet = yearData.find(
      (r) => r.sheet_name.trim() === sheetName.trim(),
    );
    if (!sheet) return 0;
    const idx = sheet.headers_main.findIndex(
      (h) => h && h.toString().includes(headerSubstring),
    );
    if (
      idx !== -1 &&
      sheet.total_row[idx] !== undefined &&
      sheet.total_row[idx] !== null
    ) {
      return parseFloat(sheet.total_row[idx]) * 100;
    }
    return 0;
  };

  const currentKpi = kpiData.filter((d) => d.school_year === selectedYear);
  const currentKpiCompare = compareYear
    ? kpiData.filter((d) => d.school_year === compareYear)
    : [];
  const compareHasData = currentKpiCompare.length > 0;

  // Best-effort "is this year still in progress" check. Assumes the
  // school-year selector returns years ordered newest-first, so the
  // first entry is the active/ongoing year. Adjust if your data shape
  // exposes an explicit `status`/`archived` flag instead.
  const isOngoing = (year) =>
    !!year && schoolYears.length > 0 && year === schoolYears[0].year;

  const elemDropout = getKpiRate(
    currentKpi,
    "G1toG6 SLR_DR",
    "Ave. School Leaver Rate",
  );
  const jhsDropout = getKpiRate(
    currentKpi,
    "JHS School Leaver Rate",
    "Ave. School Leaver Rate",
  );
  const shsDropout = getKpiRate(
    currentKpi,
    " JHS to SHS SLR_DR",
    "Ave. School Leaver Rate",
  );
  const overallDropout = (elemDropout + jhsDropout + shsDropout) / 3;

  const elemDropoutCompare = getKpiRate(
    currentKpiCompare,
    "G1toG6 SLR_DR",
    "Ave. School Leaver Rate",
  );
  const jhsDropoutCompare = getKpiRate(
    currentKpiCompare,
    "JHS School Leaver Rate",
    "Ave. School Leaver Rate",
  );
  const shsDropoutCompare = getKpiRate(
    currentKpiCompare,
    " JHS to SHS SLR_DR",
    "Ave. School Leaver Rate",
  );
  const overallDropoutCompare =
    (elemDropoutCompare + jhsDropoutCompare + shsDropoutCompare) / 3;

  const dropoutByLevel = [
    {
      label: "Overall",
      display: overallDropout.toFixed(2) + "%",
      value: overallDropout,
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
      display: elemDropout.toFixed(2) + "%",
      value: elemDropout,
      color: "bg-amber-500",
    },
    {
      label: "JHS",
      display: jhsDropout.toFixed(2) + "%",
      value: jhsDropout,
      color: "bg-violet-500",
    },
    {
      label: "SHS",
      display: shsDropout.toFixed(2) + "%",
      value: shsDropout,
      color: "bg-emerald-500",
    },
  ];

  // Mirrors dropoutByLevel above, but for the compare year. Shown side
  // by side with dropoutByLevel when compare mode is active.
  const dropoutByLevelCompare = [
    {
      label: "Overall",
      display: compareHasData
        ? overallDropoutCompare.toFixed(2) + "%"
        : "N/A (ongoing)",
      value: compareHasData ? overallDropoutCompare : 0,
      color: "bg-orange-500",
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
      display: compareHasData
        ? elemDropoutCompare.toFixed(2) + "%"
        : "N/A (ongoing)",
      value: compareHasData ? elemDropoutCompare : 0,
      color: "bg-orange-400",
    },
    {
      label: "JHS",
      display: compareHasData
        ? jhsDropoutCompare.toFixed(2) + "%"
        : "N/A (ongoing)",
      value: compareHasData ? jhsDropoutCompare : 0,
      color: "bg-orange-500",
    },
    {
      label: "SHS",
      display: compareHasData
        ? shsDropoutCompare.toFixed(2) + "%"
        : "N/A (ongoing)",
      value: compareHasData ? shsDropoutCompare : 0,
      color: "bg-orange-600",
    },
  ];

  const kToElemPromo = getKpiRate(
    currentKpi,
    "K to 6  Promo & Grad",
    "Ave. Promotion Rate",
  );
  const jhsPromo = getKpiRate(
    currentKpi,
    "JHS Promo & Grad",
    "Ave. Promotion Rate",
  );
  const shsPromo = getKpiRate(
    currentKpi,
    " JHS to SHS Promo & Grad",
    "Ave. Promotion Rate",
  );
  const promotionByLevel = [
    { level: "Kinder", rate: kToElemPromo || 0 },
    { level: "Elementary", rate: kToElemPromo || 0 },
    { level: "JHS", rate: jhsPromo || 0 },
    { level: "SHS", rate: shsPromo || 0 },
  ];

  const kToElemPromoCompare = getKpiRate(
    currentKpiCompare,
    "K to 6  Promo & Grad",
    "Ave. Promotion Rate",
  );
  const jhsPromoCompare = getKpiRate(
    currentKpiCompare,
    "JHS Promo & Grad",
    "Ave. Promotion Rate",
  );
  const shsPromoCompare = getKpiRate(
    currentKpiCompare,
    " JHS to SHS Promo & Grad",
    "Ave. Promotion Rate",
  );

  const promotionByLevelCompare = [
    { level: "Kinder", rate: compareHasData ? kToElemPromoCompare || 0 : 0 },
    {
      level: "Elementary",
      rate: compareHasData ? kToElemPromoCompare || 0 : 0,
    },
    { level: "JHS", rate: compareHasData ? jhsPromoCompare || 0 : 0 },
    { level: "SHS", rate: compareHasData ? shsPromoCompare || 0 : 0 },
  ];

  const kpiYears = [...new Set(kpiData.map((d) => d.school_year))].sort();
  const dropoutTrend =
    kpiYears.length > 0
      ? kpiYears.map((year) => {
        const yData = kpiData.filter((d) => d.school_year === year);
        const elem = getKpiRate(
          yData,
          "G1toG6 SLR_DR",
          "Ave. School Leaver Rate",
        );
        const jhs = getKpiRate(
          yData,
          "JHS School Leaver Rate",
          "Ave. School Leaver Rate",
        );
        const shs = getKpiRate(
          yData,
          " JHS to SHS SLR_DR",
          "Ave. School Leaver Rate",
        );
        return {
          year,
          overall: parseFloat(((elem + jhs + shs) / 3).toFixed(2)),
          elementary: parseFloat(elem.toFixed(2)),
          jhs: parseFloat(jhs.toFixed(2)),
        };
      })
      : [{ year: selectedYear, overall: 0, elementary: 0, jhs: 0 }];

  const cohortTrend =
    kpiYears.length > 0
      ? kpiYears.map((year) => {
        const yData = kpiData.filter((d) => d.school_year === year);
        const elemCsr = getKpiRate(yData, "G1toG6 CSR & CompR", "CSR");
        return {
          year,
          rate: parseFloat(elemCsr.toFixed(2)),
        };
      })
      : [{ year: selectedYear, rate: 0 }];

  const elemCsrCurrent = getKpiRate(currentKpi, "G1toG6 CSR & CompR", "CSR");
  const elemCsrCompare = getKpiRate(
    currentKpiCompare,
    "G1toG6 CSR & CompR",
    "CSR",
  );

  const overviewData = {
    totalEnrollment: enrollmentSummary.total,
    overallDropout: overallDropout.toFixed(2) + "%",
    elemPromotion: kToElemPromo.toFixed(2) + "%",
    jhsDropout: jhsDropout.toFixed(2) + "%",
    enrollmentTrend: "—",
    dropoutTrend: "—",
    promotionTrend: "—",
    jhsDropoutTrend: "—",
  };

  // Passed to DashboardOverview only while actively comparing.
  const compareOverviewData =
    compareMode && compareYear
      ? {
        totalEnrollment: compareEnrollmentSummary.total,
        overallDropout: compareHasData
          ? overallDropoutCompare.toFixed(2) + "%"
          : "N/A",
        elemPromotion: compareHasData
          ? kToElemPromoCompare.toFixed(2) + "%"
          : "N/A",
        jhsDropout: compareHasData
          ? jhsDropoutCompare.toFixed(2) + "%"
          : "N/A",
      }
      : null;

  const isComparing = compareMode && !!compareYear;

  return (
    <div className="min-h-full bg-slate-50/40">
      {/* ── Welcome toast (top-right) ─────────────────────── */}
      <div
        className={`fixed top-4 left-4 right-4 z-50 flex flex-col bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] sm:left-auto sm:right-8 sm:w-[380px] ${showWelcomeToast
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "translate-x-[120%] opacity-0 pointer-events-none"
          }`}
        style={{
          minHeight: "76px",
          borderRadius: "16px",
          boxShadow: showWelcomeToast
            ? "0 4px 24px rgba(16, 185, 129, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
            : "0 12px 30px rgba(0,0,0,0)",
          fontFamily: "Poppins, sans-serif",
          border: "1px solid rgba(241, 245, 249, 1)",
        }}
      >
        <div className="absolute top-0 left-0 bottom-0 w-32 pointer-events-none bg-gradient-to-r from-emerald-100/60 to-transparent" />

        <div
          className="flex items-center relative z-10 py-4 flex-1"
          style={{ padding: "0 20px", gap: "16px", minHeight: "76px" }}
        >
          <div
            className="flex items-center justify-center shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06),_0_1px_3px_rgba(0,0,0,0.03)]"
            style={{ width: "42px", height: "42px" }}
          >
            <CheckCircle
              size={22}
              className="text-emerald-500"
              strokeWidth={2.5}
            />
          </div>

          <div className="flex flex-col justify-center flex-1">
            <p
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Welcome
              {userProfile?.full_name ? `, ${userProfile.full_name}!` : "!"}
            </p>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#64748B",
                marginTop: "3px",
                margin: 0,
              }}
            >
              You've successfully logged in.
            </p>
          </div>

          <button
            onClick={() => setShowWelcomeToast(false)}
            className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
            aria-label="Close notification"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {showTransitionBanner && scheduledTransition && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3">
          {/* Local styles for the marquee — scoped via unique class names,
        safe to leave inline since this banner is the only place
        that uses them. */}
          <style>{`
      @keyframes marqueeScrollTransitionBanner {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .transition-banner-marquee-track {
        animation: marqueeScrollTransitionBanner 13s linear infinite;
        width: max-content;
      }
      .transition-banner-marquee-wrap:hover .transition-banner-marquee-track,
      .transition-banner-marquee-wrap:active .transition-banner-marquee-track {
        animation-play-state: paused;
      }
      @media (prefers-reduced-motion: reduce) {
        .transition-banner-marquee-track {
          animation: none;
          transform: none;
          white-space: normal;
        }
        .transition-banner-marquee-track > p:last-child {
          display: none; /* don't show the duplicate copy when static */
        }
      }
    `}</style>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <Clock size={14} className="text-orange-600" />
          </div>

          {/* ── Desktop / tablet: static, truncated single line ── */}
          <p className="hidden min-w-0 flex-1 truncate text-[0.8rem] text-slate-600 sm:block">
            <span className="font-bold text-orange-700">
              S.Y. {scheduledTransition.label} transition{" "}
              {getDaysUntilLabel(scheduledTransition.activation_date)}
            </span>{" "}
            <span className="text-slate-300">—</span>{" "}
            <span className="font-semibold text-slate-700">
              {formatTransitionDate(scheduledTransition.activation_date)}
            </span>
          </p>

          {/* ── Mobile: auto-scrolling marquee ── */}
          <div className="transition-banner-marquee-wrap relative min-w-0 flex-1 overflow-hidden sm:hidden">
            {/* edge fades so the scrolling text doesn't look clipped */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-orange-50/70 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-gradient-to-l from-orange-50/70 to-transparent" />

            <div className="transition-banner-marquee-track flex whitespace-nowrap">
              {[0, 1].map((i) => (
                <p
                  key={i}
                  className="flex shrink-0 items-center pr-8 text-[0.78rem] text-slate-600"
                >
                  <span className="font-bold text-orange-700">
                    S.Y. {scheduledTransition.label} transition{" "}
                    {getDaysUntilLabel(scheduledTransition.activation_date)}
                  </span>
                  <span className="mx-1.5 text-slate-300">—</span>
                  <span className="font-semibold text-slate-700">
                    {formatTransitionDate(scheduledTransition.activation_date)}
                  </span>
                </p>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={dismissTransitionBanner}
              title="Dismiss"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-orange-100/60 hover:text-orange-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[1.4rem] sm:text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
              Dashboard
            </h1>
            <p className="hidden lg:block text-[0.78rem] text-slate-400 font-medium mt-1">
              SY {selectedYear} · SDO Baliwag Division
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Primary year selector */}
            <div ref={yearDropdownRef} className="relative">
              <button
                id="dashboard-year-select-btn"
                onClick={() =>
                  !yearsLoading && setIsYearDropdownOpen(!isYearDropdownOpen)
                }
                className="relative flex items-center gap-2 h-[38px] rounded-[10px] border border-slate-200/80 bg-white pl-3 pr-8 hover:border-slate-300 transition-colors min-w-[130px] w-max shadow-sm cursor-pointer"
              >
                <span className="h-[7px] w-[7px] rounded-full shrink-0 bg-blue-500" />
                <span className="text-[0.82rem] font-bold text-slate-700 select-none whitespace-nowrap">
                  {yearsLoading ? "Loading…" : selectedYear || "Select Year"}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`text-slate-400 pointer-events-none absolute right-3 transition-transform duration-200 ${isYearDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Custom Dropdown Menu */}
              {isYearDropdownOpen && !yearsLoading && (
                <div className="absolute top-[calc(100%+6px)] right-0 w-full min-w-[150px] bg-white border border-slate-200 rounded-[10px] shadow-[0_8px_30px_rgba(15,23,42,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {schoolYears.map(({ year }) => {
                    const isSelected = selectedYear === year;
                    const isDisabled = compareMode && year === compareYear;
                    return (
                      <button
                        key={year}
                        disabled={isDisabled}
                        onClick={() => {
                          if (isDisabled) return;
                          setSelectedYear(year);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full flex items-center px-3.5 py-2 text-[0.82rem] font-semibold transition-colors ${isSelected
                          ? "bg-blue-50 text-blue-700"
                          : isDisabled
                            ? "text-slate-300 cursor-not-allowed"
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

            {/* Compare mode: secondary year selector + exit button */}
            {compareMode && (
              <>
                <span className="text-[0.75rem] font-semibold text-slate-400">
                  vs
                </span>

                <div ref={compareYearDropdownRef} className="relative">
                  <button
                    id="dashboard-compare-year-select-btn"
                    onClick={() => setIsCompareYearDropdownOpen((v) => !v)}
                    className="relative flex items-center gap-2 h-[38px] rounded-[10px] border border-orange-200 bg-orange-50/60 pl-3 pr-8 hover:border-orange-300 transition-colors min-w-[130px] w-max shadow-sm cursor-pointer"
                  >
                    <span className="h-[7px] w-[7px] rounded-full shrink-0 bg-orange-500" />
                    <span className="text-[0.82rem] font-bold text-orange-700 select-none whitespace-nowrap">
                      {compareYear || "Select year"}
                    </span>
                    {compareYear && isOngoing(compareYear) && (
                      <Clock size={12} className="text-orange-500 shrink-0" />
                    )}
                    <ChevronDown
                      size={14}
                      strokeWidth={2.5}
                      className={`text-orange-400 pointer-events-none absolute right-3 transition-transform duration-200 ${isCompareYearDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {isCompareYearDropdownOpen && (
                    <div className="absolute top-[calc(100%+6px)] right-0 w-full min-w-[150px] bg-white border border-slate-200 rounded-[10px] shadow-[0_8px_30px_rgba(15,23,42,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      {schoolYears.map(({ year }) => {
                        const isSelected = compareYear === year;
                        const isDisabled = year === selectedYear;
                        return (
                          <button
                            key={year}
                            disabled={isDisabled}
                            onClick={() => {
                              if (isDisabled) return;
                              setCompareYear(year);
                              setIsCompareYearDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-1.5 px-3.5 py-2 text-[0.82rem] font-semibold transition-colors ${isSelected
                              ? "bg-orange-50 text-orange-700"
                              : isDisabled
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                          >
                            {year}
                            {isOngoing(year) && (
                              <Clock size={11} className="text-orange-400" />
                            )}
                            {isSelected && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  id="dashboard-compare-exit-btn"
                  onClick={() => {
                    setCompareMode(false);
                    setCompareYear(null);
                    setIsCompareYearDropdownOpen(false);
                  }}
                  title="Exit compare"
                  className="flex items-center justify-center h-[30px] w-[30px] rounded-full bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </>
            )}

            {/* Compare button (only when not already comparing) */}
            {!compareMode && (
              <button
                id="dashboard-compare-btn"
                onClick={() => setCompareMode(true)}
                className="flex items-center gap-1.5 rounded-[10px] bg-blue-500 px-4 py-[7px] text-[0.78rem] font-semibold text-white hover:bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer"
                style={{ boxShadow: "0 2px 8px rgba(59,130,246,0.28)" }}
              >
                <ArrowLeftRight size={13} />
                Compare
              </button>
            )}
          </div>
        </div>

        {/* ── Comparing summary bar ───────────────────────── */}
        {compareMode && compareYear && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-sm w-max">
                <span className="flex items-center gap-1.5 text-[0.75rem] font-bold text-blue-600">
                  <span className="h-[6px] w-[6px] rounded-full bg-blue-500" />
                  SY {selectedYear}
                </span>
                <span className="text-[0.7rem] font-medium text-slate-300">
                  vs
                </span>
                <span className="flex items-center gap-1.5 text-[0.75rem] font-bold text-orange-600">
                  <span className="h-[6px] w-[6px] rounded-full bg-orange-500" />
                  SY {compareYear}
                </span>
                {isOngoing(compareYear) && (
                  <span className="flex items-center gap-1 text-[0.65rem] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Clock size={10} />
                    Ongoing
                  </span>
                )}
              </div>

              <span className="flex items-center gap-1.5 rounded-full bg-orange-50 text-orange-600 px-3.5 py-1.5 text-[0.75rem] font-semibold">
                <ArrowLeftRight size={12} />
                Comparing
              </span>
            </div>

            {isOngoing(compareYear) && (
              <div className="flex items-start gap-2 rounded-[10px] border border-amber-100 bg-amber-50/70 px-4 py-3">
                <Clock size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[0.75rem] text-amber-800 leading-relaxed">
                  <span className="font-bold">
                    SY {compareYear} is currently ongoing.
                  </span>{" "}
                  Data shown are provisional and subject to change as the school
                  year progresses.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Overview KPIs ───────────────────────────────── */}
        <DashboardOverview
          data={overviewData}
          selectedYear={selectedYear}
          compareYear={isComparing ? compareYear : null}
          compareData={compareOverviewData}
        />

        <Suspense
          fallback={
            <div className="mt-8">
              <ChartFallback />
            </div>
          }
        >
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
              4 sections
            </span>
          </div>

          {/* ── Performance Indicators ─────────────────────── */}
          <div ref={performanceSectionRef} className="scroll-mt-24">
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
              badge={
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    printPerformanceReport({
                      selectedYear,
                      currentKpi,
                      dropoutByLevel,
                      promotionByLevel,
                      cohortTrend,
                      enrollmentSummary,
                      genderSummary,
                      enrollmentRows,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[0.72rem] font-bold transition-all cursor-pointer border border-indigo-200/60"
                  title="Export Performance Indicators Data"
                >
                  <Download size={12} className="text-indigo-600" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              }
            >
              {!loading &&
                enrollmentSummary.total === 0 &&
                !(isComparing && compareEnrollmentSummary.total > 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 opacity-25 text-indigo-400">
                    <BarChart3 size={36} strokeWidth={1.5} />
                  </div>
                  <p
                    className="text-[0.78rem] font-semibold"
                    style={{ color: "rgba(79,125,245,0.6)" }}
                  >
                    {isComparing
                      ? `No data available for SY ${selectedYear} or SY ${compareYear}`
                      : `No data available for SY ${selectedYear}`}
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
                      {!isComparing && (
                        <DashboardFilters
                          options={["Summary", "By Level"]}
                          active={enrollmentView}
                          onChange={setEnrollmentView}
                        />
                      )}
                    </div>

                    {isComparing ? (
                      <div className="space-y-2">
                        <ComparisonRow
                          label="Public"
                          primary={enrollmentSummary.public}
                          secondary={compareEnrollmentSummary.public}
                        />
                        <ComparisonRow
                          label="Private"
                          primary={enrollmentSummary.private}
                          secondary={compareEnrollmentSummary.private}
                        />
                        <ComparisonRow
                          label="Total"
                          primary={enrollmentSummary.total}
                          secondary={compareEnrollmentSummary.total}
                          bold
                        />
                      </div>
                    ) : (
                      <>
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
                                  publicCount={
                                    loading ? 0 : genderSummary.male.public
                                  }
                                  privateCount={
                                    loading ? 0 : genderSummary.male.private
                                  }
                                  accent="#3b82f6"
                                  hoverAccent="#60a5fa"
                                />
                                <GenderCard
                                  label="Female"
                                  total={
                                    loading ? 0 : genderSummary.female.total
                                  }
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
                      </>
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

                    {rateView === "Dropout" &&
                      (isComparing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="flex items-center gap-1.5 text-[0.72rem] font-bold text-blue-600 mb-2">
                              <span className="h-[6px] w-[6px] rounded-full bg-blue-500" />
                              {selectedYear}
                            </p>
                            <PerformanceCard>
                              <div className="space-y-0.5">
                                {dropoutByLevel.map((d) => (
                                  <MetricProgress key={d.label} {...d} />
                                ))}
                              </div>
                            </PerformanceCard>
                          </div>
                          <div>
                            <p className="flex items-center gap-1.5 text-[0.72rem] font-bold text-orange-600 mb-2">
                              <span className="h-[6px] w-[6px] rounded-full bg-orange-500" />
                              {compareYear}
                              {isOngoing(compareYear) && (
                                <Clock size={11} className="text-orange-400" />
                              )}
                            </p>
                            <PerformanceCard>
                              <div className="space-y-0.5">
                                {dropoutByLevelCompare.map((d) => (
                                  <MetricProgress key={d.label} {...d} />
                                ))}
                              </div>
                            </PerformanceCard>
                          </div>
                        </div>
                      ) : (
                        <PerformanceCard>
                          <div className="space-y-0.5">
                            {dropoutByLevel.map((d) => (
                              <MetricProgress key={d.label} {...d} />
                            ))}
                          </div>
                        </PerformanceCard>
                      ))}

                    {rateView === "Promotion" &&
                      (isComparing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="flex items-center gap-1.5 text-[0.72rem] font-bold text-blue-600 mb-2">
                              <span className="h-[6px] w-[6px] rounded-full bg-blue-500" />
                              {selectedYear}
                            </p>
                            <PromotionChart data={promotionByLevel} />
                          </div>
                          <div>
                            <p className="flex items-center gap-1.5 text-[0.72rem] font-bold text-orange-600 mb-2">
                              <span className="h-[6px] w-[6px] rounded-full bg-orange-500" />
                              {compareYear}
                              {isOngoing(compareYear) && (
                                <Clock size={11} className="text-orange-400" />
                              )}
                            </p>
                            {compareHasData ? (
                              <PromotionChart data={promotionByLevelCompare} />
                            ) : (
                              <div className="flex items-center justify-center h-[220px] rounded-[10px] border border-dashed border-orange-100 bg-orange-50/30 text-[0.75rem] text-orange-400 font-medium text-center px-4">
                                No promotion data yet for SY {compareYear}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <PromotionChart data={promotionByLevel} />
                      ))}

                    {rateView === "Cohort" && (
                      <div>
                        {isComparing && (
                          <div className="mb-3">
                            <ComparisonRow
                              label="Elementary Cohort Survival Rate"
                              primary={parseFloat(elemCsrCurrent.toFixed(2))}
                              secondary={
                                compareHasData
                                  ? parseFloat(elemCsrCompare.toFixed(2))
                                  : 0
                              }
                              suffix="%"
                            />
                            {!compareHasData && (
                              <p className="mt-1.5 text-[0.68rem] text-amber-600 font-medium px-1">
                                SY {compareYear} cohort data isn't fully
                                reported yet — shown as 0% until available.
                              </p>
                            )}
                          </div>
                        )}
                        <CohortChart data={cohortTrend} />
                      </div>
                    )}
                  </div>

                  <SectionDivider />

                  {/* Charts grid */}
                  <DashboardGrid cols={2}>
                    <EnrollmentChart data={enrollmentTrend} />
                    <DropoutChart data={dropoutTrend} />
                  </DashboardGrid>

                  {/* Insight */}
                  {/* Insight */}
                  <div className="mt-4">
                    {isComparing && compareHasData ? (
                      <InsightCard
                        icon={<Info size={14} />}
                        variant={
                          overallDropoutCompare <= overallDropout
                            ? "info"
                            : "warning"
                        }
                        title={
                          overallDropoutCompare <= overallDropout
                            ? "Dropout rate improved"
                            : "Dropout rate increased"
                        }
                        message={`Overall dropout moved from ${overallDropout.toFixed(2)}% in SY ${selectedYear} to ${overallDropoutCompare.toFixed(2)}% in SY ${compareYear}, a ${Math.abs(overallDropoutCompare - overallDropout).toFixed(2)} pt ${overallDropoutCompare <= overallDropout ? "decrease" : "increase"}.`}
                      />
                    ) : isComparing && !compareHasData ? (
                      <InsightCard
                        icon={<Clock size={14} />}
                        variant="warning"
                        title="Comparison data incomplete"
                        message={`SY ${compareYear} performance indicators haven't been fully submitted yet, so comparison figures may show as 0% or N/A.`}
                      />
                    ) : (
                      <InsightCard
                        icon={<Info size={14} />}
                        variant="info"
                        title="Dropout trend improving"
                        message="The overall dropout rate has decreased by 0.28% over the past three years, indicating positive retention outcomes."
                      />
                    )}
                  </div>
                </>
              )}
            </DashboardAccordion>
          </div>

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
            badge={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  printCespesReport({ selectedYear, cespes });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[0.72rem] font-bold transition-all cursor-pointer border border-rose-200/60"
                title="Export CESPES Data"
              >
                <Download size={12} className="text-rose-600" />
                <span className="hidden sm:inline">Export</span>
              </button>
            }
          >
            {cespes.loading || (isComparing && compareCespes.loading) ? (
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
                      className={`whitespace-nowrap px-4 py-2 text-[0.75rem] font-semibold rounded-t-lg transition-colors ${activeCespesTab === tab
                        ? "text-blue-600 bg-blue-50/50 border-b-2 border-blue-500"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Comparing header */}
                {isComparing && (
                  <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    <span className="flex items-center gap-1.5 text-[0.72rem] font-bold text-blue-600">
                      <span className="h-[6px] w-[6px] rounded-full bg-blue-500" />
                      SY {selectedYear}
                    </span>
                    <span className="text-[0.68rem] font-medium text-slate-300">
                      vs
                    </span>
                    <span className="flex items-center gap-1.5 text-[0.72rem] font-bold text-orange-600">
                      <span className="h-[6px] w-[6px] rounded-full bg-orange-500" />
                      SY {compareYear}
                    </span>
                    {isOngoing(compareYear) && (
                      <span className="flex items-center gap-1 text-[0.62rem] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Clock size={10} />
                        Ongoing
                      </span>
                    )}
                  </div>
                )}

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

                      {isComparing ? (
                        <div className="space-y-4">
                          <CespesYearPanel
                            color="blue"
                            year={selectedYear}
                            tab="Operations"
                            rows={cespes.operations}
                            fallbackToTemplate
                          />
                          <CespesYearPanel
                            color="orange"
                            year={compareYear}
                            ongoing={isOngoing(compareYear)}
                            tab="Operations"
                            rows={compareCespes.operations}
                            fallbackToTemplate={false}
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {groupOperationsByProgram(
                            cespes.operations.length > 0
                              ? cespes.operations
                              : DEFAULT_CESPES_DATA.operations,
                          ).map((prog) => (
                            <CespesProgramRow key={prog.name} program={prog} />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {activeCespesTab === "Support to Operations" &&
                    (isComparing ? (
                      <div className="space-y-4">
                        <CespesYearPanel
                          color="blue"
                          year={selectedYear}
                          tab="Support to Operations"
                          rows={cespes.supportOperations}
                          fallbackToTemplate
                        />
                        <CespesYearPanel
                          color="orange"
                          year={compareYear}
                          ongoing={isOngoing(compareYear)}
                          tab="Support to Operations"
                          rows={compareCespes.supportOperations}
                          fallbackToTemplate={false}
                        />
                      </div>
                    ) : (
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
                    ))}

                  {activeCespesTab === "General Admin" &&
                    (isComparing ? (
                      <div className="space-y-4">
                        <CespesYearPanel
                          color="blue"
                          year={selectedYear}
                          tab="General Admin"
                          rows={cespes.generalAdmin}
                          fallbackToTemplate
                        />
                        <CespesYearPanel
                          color="orange"
                          year={compareYear}
                          ongoing={isOngoing(compareYear)}
                          tab="General Admin"
                          rows={compareCespes.generalAdmin}
                          fallbackToTemplate={false}
                        />
                      </div>
                    ) : (
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
                    ))}

                  {activeCespesTab === "Individual Performance" &&
                    (isComparing ? (
                      <div className="space-y-4">
                        <CespesYearPanel
                          color="blue"
                          year={selectedYear}
                          tab="Individual Performance"
                          rows={cespes.individualPerformance}
                          fallbackToTemplate
                        />
                        <CespesYearPanel
                          color="orange"
                          year={compareYear}
                          ongoing={isOngoing(compareYear)}
                          tab="Individual Performance"
                          rows={compareCespes.individualPerformance}
                          fallbackToTemplate={false}
                        />
                      </div>
                    ) : (
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
                    ))}

                  {activeCespesTab === "Innovation & Intervention" &&
                    (isComparing ? (
                      <div className="space-y-4">
                        <CespesYearPanel
                          color="blue"
                          year={selectedYear}
                          tab="Innovation & Intervention"
                          rows={cespes.innovation}
                          fallbackToTemplate
                        />
                        <CespesYearPanel
                          color="orange"
                          year={compareYear}
                          ongoing={isOngoing(compareYear)}
                          tab="Innovation & Intervention"
                          rows={compareCespes.innovation}
                          fallbackToTemplate={false}
                        />
                      </div>
                    ) : (
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
                    ))}
                </div>
              </>
            )}
          </DashboardAccordion>

          <div className="mt-3" />

          {/* ── Accomplishment Report ─────────────────────── */}
          {/* <DashboardAccordion
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
        </DashboardAccordion> */}

          <div className="mt-3" />

          {/* ── Crucial Resources ─────────────────────────── */}
          <div ref={resourcesSectionRef} className="scroll-mt-24">
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
              badge={
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    printResourcesReport({ selectedYear, resources });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[0.72rem] font-bold transition-all cursor-pointer border border-amber-200/60"
                  title="Export Crucial Resources Data"
                >
                  <Download size={12} className="text-amber-600" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              }
            >
              {!resources.teachers.loading &&
                resources.teachers.total === 0 &&
                resources.classrooms.total === 0 &&
                !(
                  isComparing &&
                  (compareResources.teachers.total > 0 ||
                    compareResources.classrooms.total > 0)
                ) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 opacity-25 text-amber-500">
                    <School size={36} strokeWidth={1.5} />
                  </div>
                  <p
                    className="text-[0.78rem] font-semibold"
                    style={{ color: "rgba(217,119,6,0.55)" }}
                  >
                    {isComparing
                      ? `No data available for SY ${selectedYear} or SY ${compareYear}`
                      : `No data available for SY ${selectedYear}`}
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

                  {/* Comparing header */}
                  {isComparing && (
                    <div className="flex flex-wrap items-center gap-2.5 mb-4">
                      <span className="flex items-center gap-1.5 text-[0.72rem] font-bold text-blue-600">
                        <span className="h-[6px] w-[6px] rounded-full bg-blue-500" />
                        SY {selectedYear}
                      </span>
                      <span className="text-[0.68rem] font-medium text-slate-300">
                        vs
                      </span>
                      <span className="flex items-center gap-1.5 text-[0.72rem] font-bold text-orange-600">
                        <span className="h-[6px] w-[6px] rounded-full bg-orange-500" />
                        SY {compareYear}
                      </span>
                      {isOngoing(compareYear) && (
                        <span className="flex items-center gap-1 text-[0.62rem] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Clock size={10} />
                          Ongoing
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Summary view ───────────────────────────── */}
                  {resourceView === "Summary" &&
                    (isComparing ? (
                      <div className="space-y-2">
                        <ComparisonRow
                          label="Total Teachers"
                          primary={resources.teachers.total}
                          secondary={compareResources.teachers.total}
                        />
                        <ComparisonRow
                          label="Total Classrooms"
                          primary={resources.classrooms.total}
                          secondary={compareResources.classrooms.total}
                        />
                        <ComparisonRow
                          label="Total Seats"
                          primary={resources.seats.total}
                          secondary={compareResources.seats.total}
                        />
                        <ComparisonRow
                          label="Textbooks Shortage"
                          primary={resources.textbooks.needs}
                          secondary={compareResources.textbooks.needs}
                          bold
                        />
                      </div>
                    ) : (
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
                          direction={
                            resources.teachers.needs > 0 ? "down" : "up"
                          }
                          period="Total Inventory"
                        />
                        <TrendCard
                          label="Total Classrooms"
                          value={
                            resources.classrooms.loading
                              ? "..."
                              : (
                                resources.classrooms.total || 0
                              ).toLocaleString()
                          }
                          change={
                            resources.classrooms.needs > 0
                              ? `-${resources.classrooms.needs.toLocaleString()} needs`
                              : "No needs"
                          }
                          direction={
                            resources.classrooms.needs > 0 ? "down" : "up"
                          }
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
                              : (
                                resources.textbooks.needs || 0
                              ).toLocaleString()
                          }
                          change="Current total gap"
                          direction={
                            resources.textbooks.needs > 0 ? "down" : "up"
                          }
                          period="System-wide"
                        />
                      </DashboardGrid>
                    ))}

                  {/* ── Charts view ────────────────────────────── */}
                  {resourceView === "Charts" &&
                    (isComparing ? (
                      <div className="space-y-5">
                        <ResourcesChartsPanel
                          color="blue"
                          year={selectedYear}
                          resources={resources}
                        />
                        <ResourcesChartsPanel
                          color="orange"
                          year={compareYear}
                          ongoing={isOngoing(compareYear)}
                          resources={compareResources}
                        />
                      </div>
                    ) : (
                      (() => {
                        const teachersData = Object.entries(
                          resources.teachers.breakdown || {},
                        ).map(([level, val]) => ({
                          level,
                          inventory: val,
                          needs:
                            resources.teachers.needsBreakdown?.[level] || 0,
                        }));
                        const classroomsData = Object.entries(
                          resources.classrooms.breakdown || {},
                        ).map(([level, val]) => ({
                          level,
                          inventory: val,
                          needs:
                            resources.classrooms.needsBreakdown?.[level] || 0,
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
                        ).map(([level, val]) => ({ level, shortage: val }));
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
                      })()
                    ))}

                  {/* ── By Level view (Drill-down) ──────────────── */}
                  {resourceView === "By Level" &&
                    (isComparing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="flex items-center gap-1.5 text-[0.72rem] font-bold text-blue-600 mb-2">
                            <span className="h-[6px] w-[6px] rounded-full bg-blue-500" />
                            {selectedYear}
                          </p>
                          <ResourcesByLevel resources={resources} />
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5 text-[0.72rem] font-bold text-orange-600 mb-2">
                            <span className="h-[6px] w-[6px] rounded-full bg-orange-500" />
                            {compareYear}
                            {isOngoing(compareYear) && (
                              <Clock size={11} className="text-orange-400" />
                            )}
                          </p>
                          <ResourcesByLevel resources={compareResources} />
                        </div>
                      </div>
                    ) : (
                      <ResourcesByLevel resources={resources} />
                    ))}

                  {/* ── Breakdown view ──────────────────────────── */}
                  {resourceView === "Breakdown" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                          Detailed Resource Breakdown
                        </h4>
                        <DashboardFilters
                          options={[
                            "Teachers",
                            "Classrooms",
                            "Seats",
                            "Textbooks",
                          ]}
                          active={resourceType}
                          onChange={setResourceType}
                        />
                      </div>

                      {isComparing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="flex items-center gap-1.5 text-[0.72rem] font-bold text-blue-600 mb-2">
                              <span className="h-[6px] w-[6px] rounded-full bg-blue-500" />
                              {selectedYear}
                            </p>
                            <PerformanceCard>
                              <div className="space-y-0.5">
                                {renderBreakdownRows(resourceType, resources)}
                              </div>
                            </PerformanceCard>
                          </div>
                          <div>
                            <p className="flex items-center gap-1.5 text-[0.72rem] font-bold text-orange-600 mb-2">
                              <span className="h-[6px] w-[6px] rounded-full bg-orange-500" />
                              {compareYear}
                              {isOngoing(compareYear) && (
                                <Clock size={11} className="text-orange-400" />
                              )}
                            </p>
                            <PerformanceCard>
                              <div className="space-y-0.5">
                                {renderBreakdownRows(
                                  resourceType,
                                  compareResources,
                                )}
                              </div>
                            </PerformanceCard>
                          </div>
                        </div>
                      ) : (
                        <PerformanceCard>
                          <div className="space-y-0.5">
                            {renderBreakdownRows(resourceType, resources)}
                          </div>
                        </PerformanceCard>
                      )}

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
          </div>

          <div className="mt-3" />

          {/* ── Institutional Plans & Reports ──────────────── */}
          <InstitutionalPlansCard selectedYear={selectedYear} />

          {/* Footer spacing */}
          <div className="h-8" />
        </Suspense>
      </div>
    </div>
  );
}


// ─── Sub-component: Comparison Row ──────────────────────────
// Shared inline row used to compare a single metric between two
// school years: label, primary (blue), "vs", secondary (orange),
// and a delta with an up/down arrow.

function ComparisonRow({ label, primary, secondary, bold, suffix = "" }) {
  const delta = (secondary || 0) - (primary || 0);
  const deltaUp = delta >= 0;
  const fmt = (n) => `${(n || 0).toLocaleString()}${suffix}`;

  return (
    <div className="flex items-center justify-between rounded-[10px] bg-slate-50/70 px-4 py-3">
      <span
        className={`text-[0.8rem] ${bold ? "font-bold text-slate-700" : "font-semibold text-slate-600"
          }`}
      >
        {label}
      </span>
      <div className="flex items-center gap-2.5 flex-wrap justify-end">
        <span className="text-[0.85rem] font-bold text-blue-600">
          {fmt(primary)}
        </span>
        <span className="text-[0.7rem] font-medium text-slate-300">vs</span>
        <span className="text-[0.85rem] font-bold text-orange-600">
          {fmt(secondary)}
        </span>
        <span
          className={`flex items-center gap-0.5 text-[0.72rem] font-semibold ${deltaUp ? "text-emerald-600" : "text-rose-500"
            }`}
        >
          {deltaUp ? "↗" : "↘"} {Math.abs(delta).toLocaleString()}
          {suffix}
        </span>
      </div>
    </div>
  );
}

// ─── Sub-component: CESPES Program Row ──────────────────────

function groupOperationsByProgram(rows) {
  const programs = [];
  const programMap = new Map();

  rows.forEach((row) => {
    const pName = row.program || "(No Program)";
    if (!programMap.has(pName)) {
      const prog = { name: pName, rows: [] };
      programMap.set(pName, prog);
      programs.push(prog);
    }
    const iType = (row.indicator_type || "").toUpperCase();
    programMap.get(pName).rows.push({
      type: iType.startsWith("OUTCOME") ? "OUTCOME" : "OUTPUT",
      label: row.indicator,
      sem1Target: row.sem1_target || "—",
      sem1Accomp: row.sem1_accomplishment || "—",
      sem2Target: row.sem2_target || "—",
      sem2Accomp: row.sem2_accomplishment || "—",
    });
  });

  programs.forEach((p) => {
    p.outcomes = p.rows.filter((r) => r.type === "OUTCOME").length;
    p.outputs = p.rows.filter((r) => r.type === "OUTPUT").length;
    p.reported = `${p.rows.length}/${p.rows.length}`;
  });

  return programs;
}

function CespesYearPanel({
  color,
  year,
  ongoing,
  tab,
  rows,
  fallbackToTemplate,
}) {
  const hasRows = rows && rows.length > 0;
  const isBlue = color === "blue";
  const dotColor = isBlue ? "bg-blue-500" : "bg-orange-500";
  const textColor = isBlue ? "text-blue-600" : "text-orange-600";
  const borderColor = isBlue ? "border-blue-100" : "border-orange-100";
  const bgTint = isBlue ? "bg-blue-50/20" : "bg-orange-50/20";

  const renderBody = () => {
    if (!hasRows && !fallbackToTemplate) return null;

    const source = hasRows
      ? rows
      : {
        Operations: DEFAULT_CESPES_DATA.operations,
        "Support to Operations": DEFAULT_CESPES_DATA.supportOperations,
        "General Admin": DEFAULT_CESPES_DATA.generalAdmin,
        "Individual Performance": DEFAULT_CESPES_DATA.individualPerformance,
        "Innovation & Intervention": DEFAULT_CESPES_DATA.innovation,
      }[tab];

    switch (tab) {
      case "Operations":
        return (
          <div className="space-y-3">
            {groupOperationsByProgram(source).map((prog) => (
              <CespesProgramRow key={prog.name} program={prog} />
            ))}
          </div>
        );
      case "Support to Operations":
      case "General Admin":
        return (
          <CespesSemesterTable
            rows={source}
            groupKey="service_activity"
            showPerson
          />
        );
      case "Individual Performance":
        return <CespesPerformanceTable rows={source} />;
      case "Innovation & Intervention":
        return <CespesInnovationTable rows={source} />;
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-[12px] border ${borderColor} ${bgTint} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <p
          className={`flex items-center gap-1.5 text-[0.72rem] font-bold ${textColor}`}
        >
          <span className={`h-[6px] w-[6px] rounded-full ${dotColor}`} />
          SY {year}
          {ongoing && <Clock size={11} className="text-orange-400" />}
        </p>
        {!hasRows && (
          <span className="text-[0.6rem] font-semibold text-slate-400 italic">
            {fallbackToTemplate ? "Template view" : "No data yet"}
          </span>
        )}
      </div>

      {!hasRows && !fallbackToTemplate ? (
        <div className="flex items-center justify-center py-8 text-center">
          <p className="text-[0.72rem] text-slate-400 italic max-w-[280px]">
            No {tab} data uploaded for SY {year} yet.
          </p>
        </div>
      ) : (
        renderBody()
      )}
    </div>
  );
}

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

// ─── Sub-component: Institutional Plans Card ────────────────

function InstitutionalPlansCard({ selectedYear }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedYear) return;

    async function fetchFiles() {
      setLoading(true);
      const { data, error } = await supabase
        .from("files")
        .select(
          `
          id, file_name, file_path, created_at, uploaded_by_name, data_category,
          sections ( name ), divisions ( name )
        `,
        )
        .in("data_category", [
          "aip_school",
          "aip_sdo",
          "qbedp",
          "accomplishment_report",
        ])
        .eq("school_year", selectedYear)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFiles(data);
      }
      setLoading(false);
    }

    fetchFiles();
  }, [selectedYear]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const FolderUserIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z"
        fill="#475569"
      />
      <path
        d="M12.5 11.5C12.5 12.8807 11.3807 14 10 14C8.61929 14 7.5 12.8807 7.5 11.5C7.5 10.1193 8.61929 9 10 9C11.3807 9 12.5 10.1193 12.5 11.5ZM14.5 17.5C14.5 16.6716 12.4853 15 10 15C7.51472 15 5.5 16.6716 5.5 17.5V18H14.5V17.5Z"
        fill="white"
      />
    </svg>
  );

  // Must stay in sync with STRUCTURED_UPLOAD_TYPES in UploadFilesPage.jsx.
  const EXCEL_BUCKET_TYPES = new Set([
    "enrollment", "classrooms", "seats", "teachers_inventory",
    "textbook_inventory", "cespes", "performance_indicators",
    "aip_school", "aip_sdo", "qbedp", "accomplishment_report",
  ]);
  const getDashboardBucket = (category) =>
    EXCEL_BUCKET_TYPES.has(category) ? "excel-files" : "repository-files";

  const getPublicUrl = (path, category) => {
    if (!path) return "#";
    const { data } = supabase.storage
      .from(getDashboardBucket(category))
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const downloadFile = async (path, filename, category) => {
    if (!path) return;
    const { data, error } = await supabase.storage
      .from(getDashboardBucket(category))
      .download(path);
    if (error) {
      console.error("Error downloading file:", error);
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const renderSection = (id, title, categoryType) => {
    const isOpen = expandedSection === id;
    const sectionFiles = files.filter((f) => f.data_category === categoryType);

    return (
      <div className="rounded-[10px] border border-slate-100/80 overflow-hidden mb-3 last:mb-0">
        <button
          onClick={() => toggleSection(id)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/50 cursor-pointer"
        >
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <FolderUserIcon />
            <p className="text-[0.78rem] font-bold text-slate-700 truncate">
              {title}
            </p>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>

        {isOpen && (
          <div className="border-t border-slate-100/60 overflow-x-auto bg-white p-1">
            <table className="w-full text-[0.72rem]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100/60">
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-500">
                    File Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400 text-xs">
                      Loading files...
                    </td>
                  </tr>
                ) : sectionFiles.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400 text-xs italic">
                      No files uploaded for {title} yet.
                    </td>
                  </tr>
                ) : (
                  sectionFiles.map((file, i) => (
                    <tr
                      key={file.id || i}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <a
                          href={getPublicUrl(file.file_path, file.data_category)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <FileText
                            size={14}
                            className="text-red-500 shrink-0"
                          />
                          <span
                            className="text-slate-700 font-medium truncate group-hover:text-blue-600 group-hover:underline transition-colors"
                            title={file.file_name}
                          >
                            {file.file_name}
                          </span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardAccordion
      icon={
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
          <BookOpen size={16} className="text-rose-500" />
        </div>
      }
      title="Institutional Plans & Reports"
      subtitle={
        <span className="flex items-center gap-1.5">
          <span
            onClick={(e) => e.stopPropagation()}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            AIP
          </span>
          <span className="text-slate-300">•</span>
          <span
            onClick={(e) => e.stopPropagation()}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            QBEDP
          </span>
          <span className="text-slate-300">•</span>
          <span
            onClick={(e) => e.stopPropagation()}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            Accomplishment Report
          </span>
        </span>
      }
      accentBg="rgba(254, 242, 242, 0.15)"
    >
      <div className="flex flex-col gap-2">
        {renderSection("aip-school", "Approved School AIP 2026", "aip_school")}
        {renderSection(
          "aip-sdo",
          "Approved SDO AIP 2026 (Per Functional Division)",
          "aip_sdo",
        )}
        {renderSection(
          "qbedp",
          "Quality Basic Education Development Plan (QBEDP)",
          "qbedp",
        )}
        {renderSection(
          "accomp",
          "Accomplishment Report",
          "accomplishment_report",
        )}
      </div>
    </DashboardAccordion>
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

// ─── Shared print-report shell (matches AuditLogs export style) ──

function buildReportShell({ title, subtitle, badgeText, bodyHtml }) {
  return `
  <html>
    <head>
      <title>OneData: ${title}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f1f5f9;
          color: #1e293b;
          padding: 36px;
          margin: 0;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 16px;
          padding: 28px 32px;
          color: #ffffff;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .header-left h1 {
          font-size: 22px;
          margin: 0 0 4px 0;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .header-left p {
          font-size: 12.5px;
          margin: 0;
          color: #e0e7ff;
          font-weight: 500;
        }
        .header-right .badge {
          display: inline-block;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 11.5px;
          font-weight: 700;
          white-space: nowrap;
        }
        .section {
          background: #ffffff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          border: 1px solid #f1f5f9;
          margin-bottom: 18px;
        }
        .section-title {
          padding: 14px 18px 10px 18px;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          border-bottom: 1px solid #f1f5f9;
        }
        .section-empty {
          padding: 18px;
          font-size: 12px;
          color: #94a3b8;
          font-style: italic;
        }
        .summary-row {
          display: flex;
          gap: 14px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .summary-card {
          flex: 1;
          min-width: 140px;
          background: #ffffff;
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
          border: 1px solid #f1f5f9;
        }
        .summary-card .value {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }
        .summary-card .label {
          font-size: 10.5px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }
        thead th {
          background: #0f172a;
          color: #ffffff;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 10px 12px;
          text-align: left;
          font-weight: 700;
          white-space: nowrap;
        }
        tbody td {
          padding: 10px 12px;
          font-size: 11.5px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        .pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
        }
        .pill-blue { background: #eff6ff; color: #2563eb; }
        .pill-orange { background: #fff7ed; color: #d97706; }
        .pill-amber { background: #fffbeb; color: #d97706; }
        .table-scroll {
          overflow-x: auto;
        }
        .footer {
          margin-top: 8px;
          font-size: 11px;
          color: #94a3b8;
          text-align: right;
          font-weight: 500;
        }
        @page { size: landscape; margin: 14mm; }
        @media print {
          body { background: #ffffff; padding: 14px; }
          .header, thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .summary-card, .pill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .section { break-inside: avoid; }
          tbody tr { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>OneData: ${title}</h1>
          <p>${subtitle}</p>
        </div>
        <div class="header-right">
          <span class="badge">${badgeText}</span>
        </div>
      </div>
      ${bodyHtml}
      <div class="footer">OneData: Confidential Report</div>
    </body>
  </html>`;
}

function renderTable(headers, rows) {
  if (!rows || rows.length === 0) {
    return `<div class="section-empty">No data available.</div>`;
  }
  const headHtml = headers.map((h) => `<th>${h}</th>`).join("");
  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${cell ?? "—"}</td>`).join("")}</tr>`,
    )
    .join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr>${headHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>`;
}

function printReport(html) {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
}

// ─── Performance Indicators report ──

function printPerformanceReport({
  selectedYear,
  currentKpi,
  dropoutByLevel,
  promotionByLevel,
  cohortTrend,
  enrollmentSummary,
  genderSummary,
  enrollmentRows,
}) {
  const summaryCards = `
    <div class="summary-row">
      <div class="summary-card"><div class="value">${(enrollmentSummary.public || 0).toLocaleString()}</div><div class="label">Public</div></div>
      <div class="summary-card"><div class="value">${(enrollmentSummary.private || 0).toLocaleString()}</div><div class="label">Private</div></div>
      <div class="summary-card"><div class="value">${(enrollmentSummary.total || 0).toLocaleString()}</div><div class="label">Total Enrollment</div></div>
      <div class="summary-card"><div class="value">${(genderSummary.male.total || 0).toLocaleString()}</div><div class="label">Male</div></div>
      <div class="summary-card"><div class="value">${(genderSummary.female.total || 0).toLocaleString()}</div><div class="label">Female</div></div>
    </div>`;

  const dropoutTable = renderTable(
    ["Level", "Rate"],
    dropoutByLevel.map((d) => [d.label, d.display]),
  );

  const promotionTable = renderTable(
    ["Level", "Rate (%)"],
    promotionByLevel.map((p) => [p.level, `${p.rate.toFixed(2)}%`]),
  );

  const cohortTable = renderTable(
    ["Year", "Rate (%)"],
    cohortTrend.map((c) => [c.year, `${c.rate}%`]),
  );

  const kpiSheetsHtml = (currentKpi || [])
    .map((sheet) => {
      const headers = (sheet.headers_main || []).map((h) => String(h ?? ""));
      const totalRow = (sheet.total_row || []).map((v) => String(v ?? ""));
      return `
        <div class="section">
          <div class="section-title">${sheet.sheet_name || "Untitled Sheet"}</div>
          ${renderTable(headers, totalRow.length ? [totalRow] : [])}
        </div>`;
    })
    .join("");

  const enrollmentRowsTable = renderTable(
    ["School Name", "Category", "Grand Total"],
    (enrollmentRows || []).map((r) => [
      r.school_name || "",
      r.category || "",
      (r.grand_total ?? 0).toLocaleString(),
    ]),
  );

  const bodyHtml = `
    ${summaryCards}
    <div class="section"><div class="section-title">Dropout Rate by Level</div>${dropoutTable}</div>
    <div class="section"><div class="section-title">Promotion Rate by Level</div>${promotionTable}</div>
    <div class="section"><div class="section-title">Cohort Survival Rate (Elementary Trend)</div>${cohortTable}</div>
    ${kpiSheetsHtml}
    <div class="section"><div class="section-title">Enrollment by School (Full Data)</div>${enrollmentRowsTable}</div>
  `;

  const html = buildReportShell({
    title: "Performance Indicators Report",
    subtitle: `SY ${selectedYear || "N/A"} · Exported ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`,
    badgeText: `SY ${selectedYear || "N/A"}`,
    bodyHtml,
  });

  printReport(html);
}

// ─── CESPES report ──

function printCespesReport({ selectedYear, cespes }) {
  const opsRows = (cespes.operations || []).map((r) => [
    r.program,
    r.indicator_type,
    r.indicator,
    r.sem1_target,
    r.sem1_accomplishment,
    r.sem2_target,
    r.sem2_accomplishment,
  ]);
  const opsTable = renderTable(
    ["Program", "Indicator Type", "Indicator", "Sem1 Target", "Sem1 Accomplishment", "Sem2 Target", "Sem2 Accomplishment"],
    opsRows,
  );

  const supportRows = (cespes.supportOperations || []).map((r) => [
    r.service_activity, r.indicator, r.sem1_target, r.sem1_accomplishment, r.sem2_target, r.sem2_accomplishment, r.person_involved,
  ]);
  const supportTable = renderTable(
    ["Service/Activity", "Indicator", "Sem1 Target", "Sem1 Accomplishment", "Sem2 Target", "Sem2 Accomplishment", "Person Involved"],
    supportRows,
  );

  const adminRows = (cespes.generalAdmin || []).map((r) => [
    r.service_activity, r.indicator, r.sem1_target, r.sem1_accomplishment, r.sem2_target, r.sem2_accomplishment, r.person_involved,
  ]);
  const adminTable = renderTable(
    ["Service/Activity", "Indicator", "Sem1 Target", "Sem1 Accomplishment", "Sem2 Target", "Sem2 Accomplishment", "Person Involved"],
    adminRows,
  );

  const perfRows = (cespes.individualPerformance || []).map((r) => [
    r.program_output, r.process_output, r.performance_indicator, r.target, r.accomplishment, r.rating,
  ]);
  const perfTable = renderTable(
    ["Program Output", "Process Output", "Performance Indicator", "Target", "Accomplishment", "Rating"],
    perfRows,
  );

  const innovRows = (cespes.innovation || []).map((r) => [
    r.output_outcomes, r.quality, r.quantity, r.timeliness, r.average,
  ]);
  const innovTable = renderTable(
    ["Output/Outcomes", "Quality", "Quantity", "Timeliness", "Average"],
    innovRows,
  );

  const bodyHtml = `
    <div class="section"><div class="section-title">Operations</div>${opsTable}</div>
    <div class="section"><div class="section-title">Support to Operations</div>${supportTable}</div>
    <div class="section"><div class="section-title">General Admin</div>${adminTable}</div>
    <div class="section"><div class="section-title">Individual Performance</div>${perfTable}</div>
    <div class="section"><div class="section-title">Innovation & Intervention</div>${innovTable}</div>
  `;

  const html = buildReportShell({
    title: "CESPES Report",
    subtitle: `SY ${selectedYear || "N/A"} · Exported ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`,
    badgeText: `SY ${selectedYear || "N/A"}`,
    bodyHtml,
  });

  printReport(html);
}

// ─── Crucial Resources report ──

function printResourcesReport({ selectedYear, resources }) {
  const summaryTable = renderTable(
    ["Resource", "Total Inventory", "Total Needs"],
    [
      ["Teachers", (resources.teachers.total || 0).toLocaleString(), (resources.teachers.needs || 0).toLocaleString()],
      ["Classrooms", (resources.classrooms.total || 0).toLocaleString(), (resources.classrooms.needs || 0).toLocaleString()],
      ["Seats", (resources.seats.total || 0).toLocaleString(), (resources.seats.needs || 0).toLocaleString()],
      ["Textbooks (Shortage)", "—", (resources.textbooks.needs || 0).toLocaleString()],
    ],
  );

  const resourceTypes = [
    { key: "teachers", label: "Teachers" },
    { key: "classrooms", label: "Classrooms" },
    { key: "seats", label: "Seats" },
    { key: "textbooks", label: "Textbooks" },
  ];

  const breakdownHtml = resourceTypes
    .map((rt) => {
      const resData = resources[rt.key];
      const breakdown = resData?.breakdown || {};
      const needsBreakdown = resData?.needsBreakdown || {};
      const rows = Object.entries(breakdown).map(([level, val]) => [
        level,
        String(val),
        rt.key === "textbooks" ? "—" : String(needsBreakdown[level] || 0),
      ]);
      return `
        <div class="section">
          <div class="section-title">${rt.label} — Breakdown by Level</div>
          ${renderTable(["Level", "Inventory", "Needs"], rows)}
        </div>`;
    })
    .join("");

  const rawDataHtml = resourceTypes
    .map((rt) => {
      const resData = resources[rt.key];
      const dataByLevel = resData?.data || {};
      return Object.entries(dataByLevel)
        .map(([level, rows]) => {
          if (!rows || rows.length === 0) return "";
          const allKeys = Array.from(
            rows.reduce((set, row) => {
              Object.keys(row).forEach((k) => set.add(k));
              return set;
            }, new Set()),
          );
          const tableRows = rows.map((row) => allKeys.map((k) => row[k]));
          return `
            <div class="section">
              <div class="section-title">${rt.label} — ${level} (Full Raw Data)</div>
              ${renderTable(allKeys, tableRows)}
            </div>`;
        })
        .join("");
    })
    .join("");

  const bodyHtml = `
    <div class="section"><div class="section-title">Summary</div>${summaryTable}</div>
    ${breakdownHtml}
    ${rawDataHtml}
  `;

  const html = buildReportShell({
    title: "Crucial Resources Report",
    subtitle: `SY ${selectedYear || "N/A"} · Exported ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`,
    badgeText: `SY ${selectedYear || "N/A"}`,
    bodyHtml,
  });

  printReport(html);
}
