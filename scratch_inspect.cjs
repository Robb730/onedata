const XLSX = require("xlsx");
const path = require("path");

const filePath = path.resolve(__dirname, "src/assets/resources/LATEST ENROLLMENT.xlsx");
const workbook = XLSX.readFile(filePath);
const ws = workbook.Sheets["PUBLIC"];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

const row2 = rows[2] || [];
console.log("Col 3:", row2[3]);
console.log("Col 5:", row2[5]);
console.log("Col 25:", row2[25]);
console.log("Col 39:", row2[39]);
console.log("Col 99:", row2[99]);
