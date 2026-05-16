/**
 * Test: run enrollmentParser against the real LATEST ENROLLMENT.xlsx
 */
import XLSX from "xlsx";
import { readFileSync } from "fs";

// ── inline the parser logic (no browser FileReader needed in Node) ──
const HEADER_ROW_COUNT = 6;
const ENROLLMENT_SHEETS = ["PUBLIC", "PRIVATE"];

function mf(row, mIdx) {
  return { m: Number(row[mIdx]) || 0, f: Number(row[mIdx + 1]) || 0 };
}

function parseSchoolCell(raw) {
  if (!raw) return { schoolId: "", schoolName: "" };
  const str  = String(raw).trim();
  const dash = str.indexOf(" - ");
  if (dash === -1) return { schoolId: "", schoolName: str };
  return { schoolId: str.slice(0, dash).trim(), schoolName: str.slice(dash + 3).trim() };
}

function parseRow(row, sheet, i) {
  const { schoolId, schoolName } = parseSchoolCell(row[1]);
  return {
    sheet, schoolId, schoolName,
    schoolType: String(row[2] ?? "").trim(),
    elementary:   { kinder: mf(row,3), grade1:mf(row,5), grade2:mf(row,7), grade3:mf(row,9), subG1G3:mf(row,11), grade4:mf(row,13), grade5:mf(row,15), grade6:mf(row,17), subG4G6:mf(row,19), nonGraded:mf(row,21), total:mf(row,23) },
    juniorHigh:   { grade7:mf(row,25), grade8:mf(row,27), grade9:mf(row,29), grade10:mf(row,31), subG7G10:mf(row,33), nonGraded:mf(row,35), total:mf(row,37) },
    seniorHighS1: { grade11:{ acad:mf(row,39), tvl:mf(row,41), sports:mf(row,43), arts:mf(row,45), unique:mf(row,47), acadSshs:mf(row,49), techpro:mf(row,51) }, grade12:{ acad:mf(row,53), tvl:mf(row,55), sports:mf(row,57), arts:mf(row,59), unique:mf(row,61), acadSshs:mf(row,63), techpro:mf(row,65) }, total:mf(row,67) },
    seniorHighS2: { grade11:{ acad:mf(row,69), tvl:mf(row,71), sports:mf(row,73), arts:mf(row,75), unique:mf(row,77), acadSshs:mf(row,79), techpro:mf(row,81) }, grade12:{ acad:mf(row,83), tvl:mf(row,85), sports:mf(row,87), arts:mf(row,89), unique:mf(row,91), acadSshs:mf(row,93), techpro:mf(row,95) }, total:mf(row,97) },
    grandTotal: Number(row[99]) || 0,
  };
}

// ── Run ──────────────────────────────────────────────────────────────────────
const buf = readFileSync("src/assets/resources/LATEST ENROLLMENT.xlsx");
const wb  = XLSX.read(buf, { type: "buffer" });

let totalRecords = 0;
let grandSum = 0;

for (const sheetName of ENROLLMENT_SHEETS) {
  if (!wb.SheetNames.includes(sheetName)) { console.log(`Sheet "${sheetName}" not found, skipping.`); continue; }
  const ws      = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const dataRows = rawRows.slice(HEADER_ROW_COUNT);

  const records = [];
  dataRows.forEach((row, i) => {
    const rn = row[0];
    if (rn === "" || rn === null || rn === undefined) return;
    if (typeof rn !== "number" && isNaN(Number(rn))) return;
    records.push(parseRow(row, sheetName, i));
  });

  console.log(`\n═══ Sheet: ${sheetName} (${records.length} schools) ═══`);
  records.slice(0, 3).forEach((r) => {
    console.log(`\n  School   : ${r.schoolId} — ${r.schoolName}`);
    console.log(`  Type     : ${r.schoolType}`);
    console.log(`  Elem Tot : M=${r.elementary.total.m} F=${r.elementary.total.f}`);
    console.log(`  JHS Tot  : M=${r.juniorHigh.total.m} F=${r.juniorHigh.total.f}`);
    console.log(`  SHS S1   : M=${r.seniorHighS1.total.m} F=${r.seniorHighS1.total.f}`);
    console.log(`  SHS S2   : M=${r.seniorHighS2.total.m} F=${r.seniorHighS2.total.f}`);
    console.log(`  GRAND    : ${r.grandTotal}`);
  });

  totalRecords += records.length;
  grandSum += records.reduce((a, r) => a + r.grandTotal, 0);
}

console.log(`\n✅ Total schools parsed : ${totalRecords}`);
console.log(`✅ Combined grand total : ${grandSum.toLocaleString()} students`);
