/* eslint-disable no-unused-vars */
import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { supabase } from "../../lib/supabaseClient";

// ─── constants ────────────────────────────────────────────────────────────────

const BUCKET = "excel-files";
const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#0891b2"];

// ─── excel helpers ─────────────────────────────────────────────────────────────

function isRate(val) {
  return typeof val === "number" && Math.abs(val) < 10 && !Number.isInteger(val);
}

function fmt(val) {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "number") {
    if (isRate(val)) return (val * 100).toFixed(2) + "%";
    return val.toLocaleString();
  }
  return String(val);
}

function detectHeaderRow(rows) {
  for (let i = 0; i < Math.min(12, rows.length); i++) {
    const nonNull = rows[i].filter((v) => v !== null && v !== undefined && v !== "");
    if (nonNull.length >= 3) {
      const strs = nonNull.map((v) => String(v).toLowerCase());
      if (strs.some((s) => s.includes("division") || s.includes("region") || s.includes("sex"))) return i;
    }
  }
  for (let i = 0; i < Math.min(12, rows.length); i++) {
    const nonNull = rows[i].filter((v) => v !== null && v !== undefined && v !== "");
    if (nonNull.length >= 3 && typeof rows[i][0] === "string") return i;
  }
  return -1;
}

function extractBaliwag(rows) {
  const matched = [];
  let currentDivision = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const first = row[0];
    if (first && typeof first === "string" && first.trim() !== "") {
      currentDivision = first.trim();
    }
    if (currentDivision && currentDivision.toLowerCase().includes("baliwag")) {
      matched.push({ division: currentDivision, row });
    }
  }
  return matched;
}

function buildFinalHeaders(data, hIdx) {
  const h1 = data[hIdx] || [];
  const h2 = data[hIdx + 1] || [];
  let lastTop = "";
  return h1.map((v, i) => {
    const top = v ? String(v).trim() : "";
    const sub = h2[i] ? String(h2[i]).trim() : "";
    // eslint-disable-next-line no-useless-assignment
    let label = "";
    if (top && sub && top !== sub) label = `${top} — ${sub}`;
    else label = top || sub;
    if (label) { lastTop = label; return label; }
    if (h2[i]) return `${lastTop} — ${String(h2[i]).trim()}`;
    return lastTop ? `${lastTop} (${i})` : `Col ${i}`;
  });
}

/** Parse every sheet of a workbook and extract Baliwag data for each */
function parseWorkbook(wb) {
  const sheets = [];
  for (const name of wb.SheetNames) {
    if (name.trim() === "Sheet1") continue;
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    const hIdx = detectHeaderRow(data);
    if (hIdx === -1) continue;
    const headers = buildFinalHeaders(data, hIdx);
    const h2 = data[hIdx + 1] || [];
    const dataStart = hIdx + (h2.some((v) => v) ? 2 : 1);
    const baliwagRows = extractBaliwag(data.slice(dataStart));
    if (!baliwagRows.length) continue;

    // grab sheet title from first rows
    const titleLines = data.slice(0, 5)
      .map((r) => r.find((v) => v && typeof v === "string" && v.length > 5))
      .filter(Boolean);
    const title = titleLines[1] || titleLines[0] || name;

    sheets.push({ name, title, headers, rows: baliwagRows });
  }
  return sheets;
}

// ─── chart helpers ─────────────────────────────────────────────────────────────

function buildChartData(headers, baliwagRows) {
  const numericCols = [];
  baliwagRows.forEach(({ row }) => {
    row.forEach((v, i) => {
      if (typeof v === "number" && !numericCols.includes(i)) numericCols.push(i);
    });
  });
  return baliwagRows.map(({ row }) => {
    const label = row[0] && String(row[0]).trim()
      ? String(row[0]).replace(/city of /i, "")
      : row[1] ? String(row[1]).trim() : "Baliwag";
    const entry = { name: label };
    numericCols.forEach((ci) => {
      const key = headers[ci] ? String(headers[ci]).trim() : `Col ${ci}`;
      const val = row[ci];
      if (typeof val === "number") {
        entry[key] = isRate(val) ? parseFloat((val * 100).toFixed(2)) : val;
      }
    });
    return entry;
  });
}

// ─── sub-components ───────────────────────────────────────────────────────────

function DataTable({ headers, baliwagRows }) {
  const colCount = Math.max(...baliwagRows.map((r) => r.row.length), headers.length);
  const visHeaders = headers.slice(0, colCount);
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {visHeaders.map((h, i) => (
              <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {h || `Col ${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baliwagRows.map(({ row, division }, ri) => {
            const isMain = row[0] && String(row[0]).trim() !== "";
            return (
              <tr key={ri} style={{ background: isMain ? "#eff6ff" : "white", borderBottom: "1px solid #f1f5f9" }}>
                {visHeaders.map((_, ci) => (
                  <td key={ci} style={{ padding: "8px 14px", color: isMain ? "#1d4ed8" : "#334155", fontWeight: isMain && ci === 0 ? 600 : 400, whiteSpace: "nowrap" }}>
                    {ci === 0 && !row[0] ? division : fmt(row[ci])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Charts({ headers, baliwagRows }) {
  const chartData = buildChartData(headers, baliwagRows);
  if (!chartData.length) return null;
  const allKeys = Array.from(new Set(chartData.flatMap((d) => Object.keys(d).filter((k) => k !== "name"))));
  const rateKeys = allKeys.filter((k) => chartData.some((d) => d[k] !== undefined && d[k] <= 200 && d[k] >= 0));
  const countKeys = allKeys.filter((k) => chartData.some((d) => d[k] !== undefined && d[k] > 200));
  const radarData = rateKeys.slice(0, 6).map((key) => ({
    subject: key.length > 22 ? key.slice(0, 22) + "…" : key,
    value: chartData[0]?.[key] ?? 0,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {countKeys.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Enrollment Counts</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {countKeys.slice(0, 6).map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={56} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {rateKeys.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rates & Percentages (%)</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v + "%"} domain={[0, 120]} />
              <Tooltip formatter={(v) => v.toFixed(2) + "%"} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {rateKeys.slice(0, 5).map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 5 }} activeDot={{ r: 7 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {radarData.length >= 3 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rates Overview — Total MF</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
              <PolarRadiusAxis angle={30} domain={[0, 120]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Radar name="Baliwag" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.18} strokeWidth={2} />
              <Tooltip formatter={(v) => v.toFixed(2) + "%"} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ExcelViewer({ publicUrl }) {
  const encoded = encodeURIComponent(publicUrl);
  const src = `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
  return (
    <div style={{ width: "100%", height: 620, borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <iframe
        src={src}
        title="Excel Viewer"
        width="100%"
        height="100%"
        style={{ border: "none", display: "block" }}
        allow="fullscreen"
      />
    </div>
  );
}

// ─── upload progress bar ───────────────────────────────────────────────────────

function ProgressBar({ value, label }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: "#2563eb", borderRadius: 99, transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}

// ─── file history card ─────────────────────────────────────────────────────────

function FileCard({ file, isActive, onClick }) {
  const date = new Date(file.uploaded_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const size = file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : "";
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px", borderRadius: 10, cursor: "pointer",
        border: `1.5px solid ${isActive ? "#2563eb" : "#e2e8f0"}`,
        background: isActive ? "#eff6ff" : "white",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>📊</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#1d4ed8" : "#1e293b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.file_name}
          </p>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{date}{size ? ` · ${size}` : ""}</p>
        </div>
        {isActive && <span style={{ fontSize: 10, background: "#2563eb", color: "white", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>ACTIVE</span>}
      </div>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export default function BaliwagExtractor() {
  const [tab, setTab] = useState("upload");           // "upload" | "viewer" | "data"
  const [dataView, setDataView] = useState("chart");  // "chart" | "table"
  const [dragging, setDragging] = useState(false);
  const [uploadState, setUploadState] = useState("idle"); // "idle"|"uploading"|"parsing"|"saving"|"done"|"error"
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // active file
  const [activeFile, setActiveFile] = useState(null);   // row from uploaded_files
  const [sheets, setSheets] = useState([]);              // parsed sheets with Baliwag data
  const [selectedSheet, setSelectedSheet] = useState(0); // index into sheets[]

  // history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fileRef = useRef();

  // load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("uploaded_files")
      .select("id, file_name, file_size, public_url, uploaded_at, extracted_data")
      .order("uploaded_at", { ascending: false })
      .limit(20);
    if (!error && data) setHistory(data);
    setHistoryLoading(false);
  }

  function selectFromHistory(file) {
    setActiveFile(file);
    const parsed = file.extracted_data?.sheets || [];
    setSheets(parsed);
    setSelectedSheet(0);
    setTab("viewer");
  }

  async function handleFile(file) {
    if (!file) return;
    setErrorMsg("");

    try {
      // 1. upload to supabase storage
      setUploadState("uploading");
      setProgress(10);
      const ext = file.name.split(".").pop();
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(safeName, file, { contentType: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", upsert: false });

      if (storageError) throw new Error(`Storage: ${storageError.message}`);
      setProgress(40);

      // 2. get public URL
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(safeName);
      const publicUrl = urlData.publicUrl;

      // 3. parse workbook client-side
      setUploadState("parsing");
      setProgress(55);
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const parsedSheets = parseWorkbook(wb);
      setProgress(75);

      // 4. save to database
      setUploadState("saving");
      const { data: dbData, error: dbError } = await supabase
        .from("uploaded_files")
        .insert({
          file_name: file.name,
          file_path: safeName,
          public_url: publicUrl,
          file_size: file.size,
          extracted_data: { sheets: parsedSheets },
        })
        .select()
        .single();

      if (dbError) throw new Error(`Database: ${dbError.message}`);
      setProgress(100);
      setUploadState("done");

      // 5. activate
      setActiveFile(dbData);
      setSheets(parsedSheets);
      setSelectedSheet(0);

      // refresh history
      loadHistory();

      // switch to viewer after short delay
      setTimeout(() => setTab("viewer"), 800);

    } catch (err) {
      setUploadState("error");
      setErrorMsg(err.message);
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetUpload = () => {
    setUploadState("idle");
    setProgress(0);
    setErrorMsg("");
  };

  const currentSheet = sheets[selectedSheet];
  const uploadIdle = uploadState === "idle" || uploadState === "error";

  const stateLabel = {
    uploading: "Uploading to Supabase storage…",
    parsing: "Extracting Baliwag data…",
    saving: "Saving to database…",
    done: "All done! Opening viewer…",
    error: "Something went wrong.",
  }[uploadState] || "";

  // ── render ──

  const TAB_STYLE = (active) => ({
    padding: "8px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer",
    border: "none", background: "none", borderBottom: `2px solid ${active ? "#2563eb" : "transparent"}`,
    color: active ? "#2563eb" : "#94a3b8", transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── top bar ── */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 32px", display: "flex", alignItems: "stretch", gap: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 32, borderRight: "1px solid #e2e8f0" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: 16 }}>📊</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>ONEDATA</span>
        </div>

        <div style={{ display: "flex", alignItems: "stretch", paddingLeft: 8 }}>
          {[
            { key: "upload", label: "⬆ Upload" },
            { key: "viewer", label: "📄 Viewer", disabled: !activeFile },
            { key: "data", label: "📈 Data", disabled: !activeFile },
          ].map(({ key, label, disabled }) => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => !disabled && setTab(key)}
              style={{ ...TAB_STYLE(tab === key), opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeFile && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Active:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8", background: "#eff6ff", padding: "3px 10px", borderRadius: 20 }}>
              {activeFile.file_name}
            </span>
          </div>
        )}
      </div>

      {/* ── body ── */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>

        {/* ── sidebar: history ── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Upload History
          </p>
          {historyLoading ? (
            <p style={{ fontSize: 13, color: "#94a3b8" }}>Loading…</p>
          ) : history.length === 0 ? (
            <p style={{ fontSize: 13, color: "#cbd5e1" }}>No uploads yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((f) => (
                <FileCard
                  key={f.id}
                  file={f}
                  isActive={activeFile?.id === f.id}
                  onClick={() => selectFromHistory(f)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── main content ── */}
        <div>

          {/* UPLOAD TAB */}
          {tab === "upload" && (
            <div>
              {uploadIdle && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? "#2563eb" : "#cbd5e1"}`,
                    borderRadius: 16, padding: "72px 32px", textAlign: "center",
                    cursor: "pointer", background: dragging ? "#eff6ff" : "white",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 44, marginBottom: 14 }}>📂</div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 6px" }}>Drop your Excel file here</p>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px" }}>or click to browse · .xlsx / .xls supported</p>
                  <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    {["Uploads to Supabase Storage", "Saves to Database", "Extracts Baliwag Data", "MS Office Viewer"].map((f) => (
                      <span key={f} style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", padding: "4px 10px", borderRadius: 20, fontWeight: 500 }}>{f}</span>
                    ))}
                  </div>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
                </div>
              )}

              {uploadState === "error" && (
                <div style={{ marginTop: 16, background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", margin: 0 }}>Upload failed</p>
                    <p style={{ fontSize: 12, color: "#ef4444", margin: "2px 0 0" }}>{errorMsg}</p>
                  </div>
                  <button onClick={resetUpload} style={{ fontSize: 12, color: "#dc2626", background: "none", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>Try again</button>
                </div>
              )}

              {!uploadIdle && uploadState !== "error" && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 28, marginTop: uploadIdle ? 20 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: 24 }}>{uploadState === "done" ? "✅" : "⏳"}</span>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0 }}>{stateLabel}</p>
                  </div>
                  <ProgressBar value={progress} label={stateLabel} />
                  {uploadState !== "done" && (
                    <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
                      {[
                        { label: "Storage", done: progress >= 40 },
                        { label: "Parse", done: progress >= 75 },
                        { label: "Database", done: progress >= 100 },
                      ].map(({ label, done }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "#16a34a" : "#cbd5e1" }} />
                          <span style={{ fontSize: 12, color: done ? "#16a34a" : "#94a3b8", fontWeight: done ? 600 : 400 }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEWER TAB */}
          {tab === "viewer" && activeFile && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>{activeFile.file_name}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
                    Viewing via Microsoft Office Online · read-only
                  </p>
                </div>
                <button
                  onClick={() => setTab("data")}
                  style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #2563eb", background: "#2563eb", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                >
                  View Extracted Data →
                </button>
              </div>
              <ExcelViewer publicUrl={activeFile.public_url} />
            </div>
          )}

          {/* DATA TAB */}
          {tab === "data" && activeFile && (
            <div>
              {/* sheet picker + view toggle */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Sheet</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(Number(e.target.value))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "white", cursor: "pointer" }}
                  >
                    {sheets.map((s, i) => (
                      <option key={i} value={i}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8, alignSelf: "flex-end" }}>
                  {[{ k: "chart", label: "📈 Charts" }, { k: "table", label: "📋 Table" }].map(({ k, label }) => (
                    <button key={k} onClick={() => setDataView(k)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid", borderColor: dataView === k ? "#2563eb" : "#e2e8f0", background: dataView === k ? "#2563eb" : "white", color: dataView === k ? "white" : "#64748b", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {sheets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                  <p style={{ fontSize: 15, fontWeight: 500 }}>No Baliwag data found in this file</p>
                </div>
              ) : currentSheet ? (
                <>
                  {/* sheet title + summary pills */}
                  <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginBottom: 14 }}>{currentSheet.title}</p>
                  <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                    {[
                      { label: "Division", val: currentSheet.rows[0]?.division || "City of Baliwag" },
                      { label: "Rows matched", val: currentSheet.rows.length },
                      { label: "Columns", val: currentSheet.headers.filter(Boolean).length },
                      { label: "Sheets with data", val: sheets.length },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px" }}>
                        <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 }}>
                    {dataView === "chart"
                      ? <Charts headers={currentSheet.headers} baliwagRows={currentSheet.rows} />
                      : <DataTable headers={currentSheet.headers} baliwagRows={currentSheet.rows} />
                    }
                  </div>
                </>
              ) : null}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}