const XLSX = require("xlsx");
const path = require("path");

const filePath = path.resolve(__dirname, "src/assets/Files/CESPES Template.xlsx");
const workbook = XLSX.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
  console.log("----", sheetName, "----");
  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  for(let i=0; i<3; i++) {
    console.log(`Row ${i}:`, rows[i] ? rows[i].slice(0, 8).map(c => String(c).replace(/\n/g, ' ').trim()).join(" | ") : "none");
  }
});
