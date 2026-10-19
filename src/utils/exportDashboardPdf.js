import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../assets/one-data-logo.png";

// ─── Shared helpers (clean document style: logo on top, plain tables) ───

async function loadLogoDataUrl() {
  const res = await fetch(logoUrl);
  if (!res.ok) throw new Error("logo fetch failed");
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageAspect(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 1);
    img.onerror = () => resolve(1);
    img.src = dataUrl;
  });
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateStamp(date = new Date()) {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}`;
}

function slugify(value, maxLen = 30) {
  return String(value || "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^A-Za-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen)
    .replace(/-$/g, "");
}

/** Safe table cell: numbers localized, null → "—", objects JSON-truncated. */
function cell(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") {
    if (!isFinite(v)) return "—";
    return Number.isInteger(v) ? v.toLocaleString() : String(Math.round(v * 100) / 100);
  }
  if (typeof v === "object") {
    try {
      const s = JSON.stringify(v);
      return s.length > 60 ? `${s.slice(0, 57)}...` : s;
    } catch {
      return "—";
    }
  }
  return String(v);
}

function num(v) {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function pct(v) {
  const n = Number(v);
  return isFinite(n) ? `${n.toFixed(2)}%` : "—";
}

function createDoc(orientation) {
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  return { doc, pageWidth: doc.internal.pageSize.getWidth(), pageHeight: doc.internal.pageSize.getHeight() };
}

async function renderHeader(doc, pageWidth, margin, y, title, metaLines) {
  try {
    const logoData = await loadLogoDataUrl();
    const aspect = await getImageAspect(logoData);
    const logoH = 14;
    const logoW = Math.min(logoH * aspect, 60);
    doc.addImage(logoData, "PNG", (pageWidth - logoW) / 2, y, logoW, logoH);
    y += logoH + 4;
  } catch {
    // Logo unavailable — text title only.
  }
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  metaLines.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 4;
  });
  y += 1;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  return y + 6;
}

function sectionTitle(doc, pageWidth, pageHeight, margin, y, title) {
  if (y > pageHeight - 30) {
    doc.addPage();
    y = margin;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title, margin, y);
  return y + 5;
}

function addTable(doc, pageHeight, margin, y, head, body) {
  if (!body || body.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("No data available.", margin, y);
    return y + 6;
  }
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2,
      overflow: "linebreak",
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    margin: { left: margin, right: margin },
  });
  return doc.lastAutoTable.finalY + 7;
}

function renderFooter(doc, pageWidth, margin) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("OneData · Confidential Report", margin, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, { align: "right" });
  }
}

function syFilename(category, selectedYear, compareYear) {
  const parts = [`Dashboard-${category}`, `SY-${slugify(selectedYear, 20) || "NA"}`];
  if (compareYear) parts.push(`vs-${slugify(compareYear, 20)}`);
  parts.push(dateStamp());
  return `${parts.join("-").slice(0, 120)}.pdf`;
}

function metaFor(selectedYear, compareYear) {
  const exported = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  if (compareYear) {
    return [`SY ${selectedYear} vs SY ${compareYear}`, `Exported ${exported} · Both school years included`];
  }
  return [`SY ${selectedYear || "N/A"}`, `Exported ${exported}`];
}

// ─── Performance Indicators ───

function kpiSheetTables(kpiRows) {
  return (kpiRows || []).map((sheet) => {
    const headers = (sheet.headers_main || []).map((h) => cell(h));
    const totalRow = (sheet.total_row || []).map((v) => cell(v));
    return { title: sheet.sheet_name || "Untitled Sheet", headers, rows: totalRow.length ? [totalRow] : [] };
  });
}

export async function exportPerformancePdf({
  selectedYear,
  compareYear = null,
  enrollmentSummary = {},
  compareEnrollmentSummary = {},
  genderSummary = {},
  dropoutByLevel = [],
  dropoutByLevelCompare = [],
  promotionByLevel = [],
  promotionByLevelCompare = [],
  cohortTrend = [],
  currentKpi = [],
  currentKpiCompare = [],
  enrollmentRows = [],
  compareEnrollmentRows = [],
} = {}) {
  const comparing = !!compareYear;
  const { doc, pageWidth, pageHeight } = createDoc("portrait");
  const margin = 12;
  let y = 14;

  y = await renderHeader(doc, pageWidth, margin, y, "OneData — Performance Indicators Report", metaFor(selectedYear, compareYear));

  // Overall enrollment
  y = sectionTitle(doc, pageWidth, pageHeight, margin, y, "Overall Enrollment");
  const enrollHead = comparing ? ["Category", `SY ${selectedYear}`, `SY ${compareYear}`] : ["Category", "Total"];
  const enrollBody = ["Public", "Private", "Total"].map((label) => {
    const key = label.toLowerCase();
    const row = [label, cell(num(enrollmentSummary[key]))];
    if (comparing) row.push(cell(num(compareEnrollmentSummary[key])));
    return row;
  });
  y = addTable(doc, pageHeight, margin, y, enrollHead, enrollBody);

  // Gender breakdown (primary SY; compare rows lack gender columns)
  y = sectionTitle(doc, pageWidth, pageHeight, margin, y, `Enrollment by Gender — SY ${selectedYear}`);
  y = addTable(
    doc, pageHeight, margin, y,
    ["Gender", "Total", "Public", "Private"],
    ["Male", "Female"].map((g) => {
      const gs = genderSummary[g.toLowerCase()] || {};
      return [g, cell(num(gs.total)), cell(num(gs.public)), cell(num(gs.private))];
    })
  );

  // Dropout by level
  y = sectionTitle(doc, pageWidth, pageHeight, margin, y, "Dropout Rate by Level");
  const dropHead = comparing ? ["Level", `SY ${selectedYear}`, `SY ${compareYear}`] : ["Level", "Rate"];
  const dropBody = dropoutByLevel.map((d, i) => {
    const row = [d.label, d.display || pct(d.value)];
    if (comparing) row.push(dropoutByLevelCompare[i]?.display || "—");
    return row;
  });
  y = addTable(doc, pageHeight, margin, y, dropHead, dropBody);

  // Promotion by level
  y = sectionTitle(doc, pageWidth, pageHeight, margin, y, "Promotion Rate by Level");
  const promoHead = comparing ? ["Level", `SY ${selectedYear}`, `SY ${compareYear}`] : ["Level", "Rate (%)"];
  const promoBody = promotionByLevel.map((p, i) => {
    const row = [p.level, pct(p.rate)];
    if (comparing) row.push(promotionByLevelCompare[i] ? pct(promotionByLevelCompare[i].rate) : "—");
    return row;
  });
  y = addTable(doc, pageHeight, margin, y, promoHead, promoBody);

  // Cohort trend
  y = sectionTitle(doc, pageWidth, pageHeight, margin, y, "Cohort Survival Rate (Elementary Trend)");
  y = addTable(
    doc, pageHeight, margin, y,
    ["School Year", "Rate (%)"],
    (cohortTrend || []).map((c) => [cell(c.year), pct(c.rate)])
  );

  // KPI sheets — primary SY, then compare SY
  kpiSheetTables(currentKpi).forEach((t) => {
    y = sectionTitle(doc, pageWidth, pageHeight, margin, y, `KPI — ${t.title} (SY ${selectedYear})`);
    y = addTable(doc, pageHeight, margin, y, t.headers.length ? t.headers : ["Value"], t.rows);
  });
  if (comparing) {
    kpiSheetTables(currentKpiCompare).forEach((t) => {
      y = sectionTitle(doc, pageWidth, pageHeight, margin, y, `KPI — ${t.title} (SY ${compareYear})`);
      y = addTable(doc, pageHeight, margin, y, t.headers.length ? t.headers : ["Value"], t.rows);
    });
  }

  // Enrollment by school
  y = sectionTitle(doc, pageWidth, pageHeight, margin, y, `Enrollment by School — SY ${selectedYear}`);
  y = addTable(
    doc, pageHeight, margin, y,
    ["School Name", "Category", "Grand Total"],
    (enrollmentRows || []).map((r) => [cell(r.school_name), cell(r.category), cell(num(r.grand_total))])
  );
  if (comparing) {
    y = sectionTitle(doc, pageWidth, pageHeight, margin, y, `Enrollment by School — SY ${compareYear}`);
    y = addTable(
      doc, pageHeight, margin, y,
      ["School Name", "Category", "Grand Total"],
      (compareEnrollmentRows || []).map((r) => [cell(r.school_name), cell(r.category), cell(num(r.grand_total))])
    );
  }

  renderFooter(doc, pageWidth, margin);
  const filename = syFilename("Performance", selectedYear, compareYear);
  doc.save(filename);
  return filename;
}

// ─── CESPES ───

const CESPES_TABS = [
  {
    key: "operations",
    label: "Operations",
    headers: ["Program", "Indicator Type", "Indicator", "Sem1 Target", "Sem1 Accomplishment", "Sem2 Target", "Sem2 Accomplishment"],
    pick: (r) => [r.program, r.indicator_type, r.indicator, r.sem1_target, r.sem1_accomplishment, r.sem2_target, r.sem2_accomplishment],
  },
  {
    key: "supportOperations",
    label: "Support to Operations",
    headers: ["Service/Activity", "Indicator", "Sem1 Target", "Sem1 Accomplishment", "Sem2 Target", "Sem2 Accomplishment", "Person Involved"],
    pick: (r) => [r.service_activity, r.indicator, r.sem1_target, r.sem1_accomplishment, r.sem2_target, r.sem2_accomplishment, r.person_involved],
  },
  {
    key: "generalAdmin",
    label: "General Admin",
    headers: ["Service/Activity", "Indicator", "Sem1 Target", "Sem1 Accomplishment", "Sem2 Target", "Sem2 Accomplishment", "Person Involved"],
    pick: (r) => [r.service_activity, r.indicator, r.sem1_target, r.sem1_accomplishment, r.sem2_target, r.sem2_accomplishment, r.person_involved],
  },
  {
    key: "individualPerformance",
    label: "Individual Performance",
    headers: ["Program Output", "Process Output", "Performance Indicator", "Target", "Accomplishment", "Rating"],
    pick: (r) => [r.program_output, r.process_output, r.performance_indicator, r.target, r.accomplishment, r.rating],
  },
  {
    key: "innovation",
    label: "Innovation & Intervention",
    headers: ["Output/Outcomes", "Quality", "Quantity", "Timeliness", "Average"],
    pick: (r) => [r.output_outcomes, r.quality, r.quantity, r.timeliness, r.average],
  },
];

export function countCespesRows(cespes = {}) {
  return CESPES_TABS.reduce((n, t) => n + ((cespes[t.key] || []).length), 0);
}

export async function exportCespesPdf({ selectedYear, compareYear = null, cespes = {}, compareCespes = {} } = {}) {
  const comparing = !!compareYear;
  const { doc, pageWidth, pageHeight } = createDoc("landscape");
  const margin = 12;
  let y = 14;

  y = await renderHeader(doc, pageWidth, margin, y, "OneData — CESPES Report", [...metaFor(selectedYear, compareYear), "All tabs included"]);

  CESPES_TABS.forEach((tab) => {
    y = sectionTitle(doc, pageWidth, pageHeight, margin, y, `${tab.label} — SY ${selectedYear}`);
    y = addTable(doc, pageHeight, margin, y, tab.headers, (cespes[tab.key] || []).map((r) => tab.pick(r).map(cell)));
    if (comparing) {
      y = sectionTitle(doc, pageWidth, pageHeight, margin, y, `${tab.label} — SY ${compareYear}`);
      y = addTable(doc, pageHeight, margin, y, tab.headers, ((compareCespes[tab.key]) || []).map((r) => tab.pick(r).map(cell)));
    }
  });

  renderFooter(doc, pageWidth, margin);
  const filename = syFilename("CESPES", selectedYear, compareYear);
  doc.save(filename);
  return filename;
}

// ─── Crucial Resources ───

const RESOURCE_TYPES = [
  { key: "teachers", label: "Teachers" },
  { key: "classrooms", label: "Classrooms" },
  { key: "seats", label: "Seats" },
  { key: "textbooks", label: "Textbooks" },
];

function summaryRows(resources = {}) {
  return [
    ["Teachers", cell(num(resources.teachers?.total)), cell(num(resources.teachers?.needs))],
    ["Classrooms", cell(num(resources.classrooms?.total)), cell(num(resources.classrooms?.needs))],
    ["Seats", cell(num(resources.seats?.total)), cell(num(resources.seats?.needs))],
    ["Textbooks (Shortage)", "—", cell(num(resources.textbooks?.needs))],
  ];
}

function breakdownRows(resData = {}, isTextbooks = false) {
  const breakdown = resData?.breakdown || {};
  const needsBreakdown = resData?.needsBreakdown || {};
  return Object.entries(breakdown).map(([level, val]) => [
    cell(level),
    cell(num(val)),
    isTextbooks ? "—" : cell(num(needsBreakdown[level])),
  ]);
}

function rawDataSections(resData = {}, label) {
  const dataByLevel = resData?.data || {};
  return Object.entries(dataByLevel)
    .filter(([, rows]) => rows && rows.length > 0)
    .map(([level, rows]) => {
      const keys = Array.from(rows.reduce((set, row) => {
        Object.keys(row || {}).forEach((k) => set.add(k));
        return set;
      }, new Set()));
      return {
        title: `${label} — ${level} (Full Raw Data)`,
        headers: keys.map(cell),
        rows: rows.map((row) => keys.map((k) => cell(row?.[k]))),
      };
    });
}

export async function exportResourcesPdf({ selectedYear, compareYear = null, resources = {}, compareResources = {} } = {}) {
  const comparing = !!compareYear;
  const { doc, pageWidth, pageHeight } = createDoc("landscape");
  const margin = 12;
  let y = 14;

  y = await renderHeader(doc, pageWidth, margin, y, "OneData — Crucial Resources Report", metaFor(selectedYear, compareYear));

  y = renderResourceSet(doc, pageHeight, margin, y, selectedYear, resources);
  if (comparing) {
    y = renderResourceSet(doc, pageHeight, margin, y, compareYear, compareResources);
  }

  renderFooter(doc, pageWidth, margin);
  const filename = syFilename("Resources", selectedYear, compareYear);
  doc.save(filename);
  return filename;
}

function renderResourceSet(doc, pageHeight, margin, y, yearLabel, resources) {
  const w = doc.internal.pageSize.getWidth();
  y = sectionTitle(doc, w, pageHeight, margin, y, `Summary — SY ${yearLabel}`);
  y = addTable(doc, pageHeight, margin, y, ["Resource", "Total Inventory", "Total Needs"], summaryRows(resources));
  RESOURCE_TYPES.forEach((rt) => {
    const resData = resources[rt.key];
    y = sectionTitle(doc, w, pageHeight, margin, y, `${rt.label} — Breakdown by Level (SY ${yearLabel})`);
    y = addTable(doc, pageHeight, margin, y, ["Level", "Inventory", "Needs"], breakdownRows(resData, rt.key === "textbooks"));
    rawDataSections(resData, rt.label).forEach((s) => {
      y = sectionTitle(doc, w, pageHeight, margin, y, `${s.title} — SY ${yearLabel}`);
      y = addTable(doc, pageHeight, margin, y, s.headers, s.rows);
    });
  });
  return y;
}
