import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../assets/one-data-logo.png";

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

function formatPerformedOn(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} ${time}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateStamp(date = new Date()) {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}`;
}

/** Make a filter value filename-safe: spaces → "-", drop unsafe chars, cap length. */
function slugify(value, maxLen = 30) {
  const slug = String(value || "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^A-Za-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen)
    .replace(/-$/g, "");
  return slug;
}

function fileDatePart(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || "").slice(0, 10));
  if (!m) return "";
  return `${m[2]}-${m[3]}-${m[1]}`;
}

/**
 * Build a descriptive filename from the active filters, e.g.
 * "Audit-Logs-Report-Upload-Success-09-17-2026.pdf".
 * Default (unfiltered) → "Audit-Logs-Report-All-MM-DD-YYYY.pdf".
 */
function buildExportFilename({ searchQuery, filterAction, filterStatus, dateFrom, dateTo }) {
  const parts = ["Audit-Logs-Report"];
  const actionSlug = filterAction && filterAction !== "All" ? slugify(filterAction, 20) : "";
  const statusSlug = filterStatus && filterStatus !== "All" ? slugify(filterStatus, 20) : "";
  const searchSlug = searchQuery?.trim() ? slugify(searchQuery, 30) : "";
  if (actionSlug) parts.push(actionSlug);
  if (statusSlug) parts.push(statusSlug);
  if (searchSlug) parts.push(searchSlug);
  const fromPart = fileDatePart(dateFrom);
  const toPart = fileDatePart(dateTo);
  if (fromPart || toPart) parts.push(`${fromPart || "Start"}-to-${toPart || "Today"}`);
  if (parts.length === 1) parts.push("All");
  parts.push(dateStamp());
  return `${parts.join("-").slice(0, 120)}.pdf`;
}

function isSuccess(status) {
  return status === "Success" || status === "Login Success" || status === "Verified";
}

function formatFilterDate(value) {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).slice(0, 10));
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Generate a minimal portrait-A4 audit logs PDF and trigger a direct download.
 * No new tab / no browser print preview.
 *
 * @param {Object} args
 * @param {Array} args.logs — already-filtered rows to export (filteredLogs when filters active, else all)
 * @param {Object} args.filters — { searchQuery, filterAction, filterStatus, dateFrom, dateTo }
 * @returns {string} saved filename
 */
export async function exportAuditLogsPdf({ logs = [], filters = {} } = {}) {
  if (!logs.length) {
    throw new Error("No audit logs match the current filters.");
  }

  const {
    searchQuery = "",
    filterAction = "All",
    filterStatus = "All",
    dateFrom = "",
    dateTo = "",
  } = filters;

  const successCount = logs.filter((l) => isSuccess(l.status)).length;
  const failedCount = logs.filter((l) => l.status === "Failed").length;
  const pendingCount = logs.filter((l) => l.status === "Pending").length;

  const isDefault =
    (!searchQuery || !searchQuery.trim()) &&
    (filterAction === "All" || !filterAction) &&
    (filterStatus === "All" || !filterStatus) &&
    !dateFrom &&
    !dateTo;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let y = 14;

  // ── Header: logo on top, title + meta centered, thin rule ──
  try {
    const logoData = await loadLogoDataUrl();
    const aspect = await getImageAspect(logoData);
    const logoH = 15;
    const logoW = Math.min(logoH * aspect, 60);
    doc.addImage(logoData, "PNG", (pageWidth - logoW) / 2, y, logoW, logoH);
    y += logoH + 4;
  } catch {
    // Logo unavailable — fall back to text title only.
  }
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("OneData — Audit Logs Report", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const exportedOn = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  doc.text(`Exported on ${exportedOn}  •  ${logs.length} record${logs.length === 1 ? "" : "s"}`, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── Applied Filters ──
  const q = (searchQuery || "").trim();
  const actionVal = filterAction || "All";
  const statusVal = filterStatus || "All";
  const fromLabel = formatFilterDate(dateFrom);
  const toLabel = formatFilterDate(dateTo);
  const dateVal = fromLabel || toLabel
    ? `${fromLabel || "Start"}  →  ${toLabel || "Today"}`
    : "All dates (default)";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Applied Filters", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isDefault ? "Scope: all records" : `Scope: filtered subset (${logs.length} record${logs.length === 1 ? "" : "s"})`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  y += 2.5;

  autoTable(doc, {
    startY: y,
    body: [
      ["Search keyword", q ? `"${q}"` : "No keyword (default)"],
      ["Action", actionVal],
      ["Status", statusVal],
      ["Date range", dateVal],
    ],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      overflow: "linebreak",
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: "bold", textColor: [100, 116, 139] },
      1: { cellWidth: "auto", textColor: [15, 23, 42] },
    },
    margin: { left: margin, right: margin },
    didParseCell(data) {
      if (data.section !== "body") return;
      const value = String(data.row.raw[1] ?? "");
      const isDefaultValue =
        value.includes("(default)") ||
        value === "All" ||
        value === "All dates (default)";
      if (data.column.index === 1 && isDefaultValue) {
        data.cell.styles.textColor = [148, 163, 184];
        data.cell.styles.fontStyle = "normal";
      } else if (data.column.index === 1) {
        data.cell.styles.textColor = [15, 23, 42];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = doc.lastAutoTable.finalY + 5;

  // ── Summary (plain text, no cards) ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Summary — Total: ${logs.length}  ·  Success: ${successCount}  ·  Failed: ${failedCount}  ·  Pending: ${pendingCount}`,
    margin,
    y
  );
  y += 6;

  // ── Table ──
  const body = logs.map((log) => [
    log.action ?? "—",
    log.fileName ?? "N/A",
    log.performedBy ?? "—",
    log.role ?? "—",
    formatPerformedOn(log.performedOn),
    log.status ?? "—",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Action", "File Name", "Performed By", "Role", "Performed On", "Status"]],
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
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 42 },
      2: { cellWidth: 34 },
      3: { cellWidth: 24 },
      4: { cellWidth: 36 },
      5: { cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 5) {
        const status = String(data.cell.raw ?? "");
        if (isSuccess(status)) data.cell.styles.textColor = [5, 150, 105];
        else if (status === "Failed") data.cell.styles.textColor = [220, 38, 38];
        else if (status === "Pending") data.cell.styles.textColor = [217, 119, 6];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ── Footer: page numbers + confidentiality ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "OneData · Confidential Audit Record",
      margin,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" }
    );
  }

  const filename = buildExportFilename({ searchQuery, filterAction, filterStatus, dateFrom, dateTo });
  doc.save(filename);
  return filename;
}
