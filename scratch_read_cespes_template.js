import * as XLSX from "xlsx";
import fs from "fs";

const filePath = "c:/Users/user/Documents/FransuaAcads/Capstone/onedata/src/assets/Files/CESPES Template.xlsx";
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: "buffer" });

const names = workbook.SheetNames;
console.log("Sheets:", names);

const out = {};
for (const name of names) {
  const ws = workbook.Sheets[name];
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  out[name] = json.slice(0, 50); // Get first 50 rows for analysis
}

fs.writeFileSync("cespes_template_dump.json", JSON.stringify(out, null, 2));
console.log("Done extracting template dump.");
