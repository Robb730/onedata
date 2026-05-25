import XLSX from "xlsx";
import { readFileSync } from "fs";

function num(val) { const n = Number(val); return isNaN(n) ? 0 : n; }
function str(val) { return val?.toString().trim() ?? ""; }
function isDataRow(row) { const id = str(row[1]); return id && id !== "TOTAL" && id !== "E.g." && !isNaN(Number(id)); }

const buf = readFileSync("src/assets/resources/Classrooms Inventory FE 2027.xlsx");
const wb  = XLSX.read(buf, { type: "buffer" });
const rows = XLSX.utils.sheet_to_json(wb.Sheets["KES"], { header: 1, defval: "" });

console.log("═══ KES Sheet — SIMPLIFIED Parse Verification ═══\n");

let count = 0;
rows.slice(10).forEach((row) => {
  if (!isDataRow(row)) return;
  count++;

  const r = {
    schoolId:   str(row[1]),
    schoolName: str(row[2]),
    division:   str(row[3]),
    // No. of Classroom (Current Year) — Needs / Excess
    kinderNeeds:  num(row[39]),
    kinderExcess: num(row[40]),
    g1g6Needs:    num(row[41]),
    g1g6Excess:   num(row[42]),
    snedNeeds:    num(row[43]),
    snedExcess:   num(row[44]),
    // PPRD Checker & Remarks
    pprd: str(row[45]),
    remarks: str(row[46]),
    // SY 2024-2025 Previous Year Classroom Inventory
    prevTotalInv: num(row[47]),
    prevKNeeds: num(row[48]), prevKExcess: num(row[49]),
    prevG16Needs: num(row[50]), prevG16Excess: num(row[51]),
    prevSnedNeeds: num(row[52]), prevSnedExcess: num(row[53]),
  };

  if (count <= 5) {
    console.log(`${r.schoolId} — ${r.schoolName}`);
    console.log(`  Needs (Current): Kinder=${r.kinderNeeds}/${r.kinderExcess} G1-G6=${r.g1g6Needs}/${r.g1g6Excess} SNEd=${r.snedNeeds}/${r.snedExcess}`);
    console.log(`  PPRD: ${r.pprd || "(none)"} | Remarks: ${r.remarks || "(none)"}`);
    console.log(`  PrevSY Inventory: Tot=${r.prevTotalInv} K=${r.prevKNeeds}/${r.prevKExcess} G1-G6=${r.prevG16Needs}/${r.prevG16Excess} SNEd=${r.prevSnedNeeds}/${r.prevSnedExcess}`);
    console.log();
  }
});

console.log(`✅ Total KES records: ${count}`);
