/**
 * seatsParser.js
 * ──────────────────────────────────────────────────────────────
 * Purpose-built parser for the DepEd "Seats Inventory FE 2027" Excel format.
 */

import * as XLSX from "xlsx";

// ── Constants ─────────────────────────────────────────────────────────────────

const DB_DATA_START   = 6;  // Row 7 (0-indexed)
const KES_DATA_START  = 10; // Row 11
const JHS_DATA_START  = 10; // Row 11
const SHS_DATA_START  = 11; // Row 12
const BALIWAG_FILTER  = ["city of baliwag", "baliuag", "baliwag"];

export const SEATS_SHEETS = {
  DB:     "DB",
  KES:    "KES",
  JHS:    "JHS",
  SHS:    "SHS",
  STATUS: "Status",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function num(val) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function str(val) {
  return val?.toString().trim() ?? "";
}

function isBaliwag(division) {
  const d = division.toLowerCase();
  return BALIWAG_FILTER.some((kw) => d.includes(kw));
}

function isDataRow(row, idCol = 1) {
  const id = str(row[idCol]);
  if (!id || id === "TOTAL" || id === "E.g." || id === "TOTAL ") return false;
  return !isNaN(Number(id));
}

// ── DB Sheet Parser ───────────────────────────────────────────────────────────

function parseDBSheet(rows) {
  const dataRows = rows.slice(DB_DATA_START);
  const records  = [];
  const errors   = [];

  dataRows.forEach((row, i) => {
    const division = str(row[3]);
    if (!isBaliwag(division)) return;

    const schoolName = str(row[1]);
    if (!schoolName) return;

    records.push({
      rowNum:                  DB_DATA_START + i + 1,
      schoolName,
      schoolId:                str(row[2]),
      division,
      district:                str(row[4]),
      streetAddress:           str(row[5]),
      motherSchoolId:          str(row[6]),
      province:                str(row[7]),
      municipality:            str(row[8]),
      legislativeDistrict:     str(row[9]),
      barangay:                str(row[10]),
      sector:                  str(row[11]),
      schoolSubclassification: str(row[12]),
      schoolType:              str(row[13]),
      implementingUnit:        str(row[14]),
      modifiedCoc:             str(row[15]),
      enrollmentElem:          num(row[16]),
      enrollmentJhs:           num(row[17]),
      enrollmentShs:           num(row[18]),
      enrollmentTotal:         num(row[19]),
    });
  });

  return { records, errors };
}

// ── KES Sheet Parser ──────────────────────────────────────────────────────────

function parseKESSheet(rows) {
  const dataRows = rows.slice(KES_DATA_START);
  const records  = [];
  const errors   = [];

  dataRows.forEach((row, i) => {
    if (!isDataRow(row, 1)) return;
    
    const division = str(row[3]);
    if (!isBaliwag(division)) return;

    records.push({
      rowNum:              KES_DATA_START + i + 1,
      schoolId:            str(row[1]),
      schoolName:          str(row[2]),
      division:            division,

      // No. of Seat Needs / Excess (Current Year)
      kinderNeeds:         num(row[35]),
      kinderExcess:        num(row[36]),
      g1g6Needs:           num(row[37]),
      g1g6Excess:          num(row[38]),
      snedNeeds:           num(row[39]),
      snedExcess:          num(row[40]),

      pprdChecker:         str(row[41]),
      remarks:             str(row[46]), // Fixed remarks index

      // SY 2024-2025 Previous Year Inventory
      prevTotalSeatsInventory: num(row[43]),
      prevNeeds:           num(row[44]),
      prevExcess:          num(row[45]),
    });
  });

  return { records, errors };
}

// ── JHS Sheet Parser ──────────────────────────────────────────────────────────

function parseJHSSheet(rows) {
  const dataRows = rows.slice(JHS_DATA_START);
  const records  = [];
  const errors   = [];

  dataRows.forEach((row, i) => {
    if (!isDataRow(row, 1)) return; // ID is in col 1 for JHS in this file

    const division = str(row[3]); // Division is in col 3 for JHS in this file
    if (!isBaliwag(division)) return;

    records.push({
      rowNum:              JHS_DATA_START + i + 1,
      schoolId:            str(row[1]),
      schoolName:          str(row[2]),
      division:            division,
      province:            str(row[4]),
      municipality:        str(row[5]),
      legDistrict:         str(row[6]),
      curricularOffering:  str(row[7]),

      enrollmentGr7:       num(row[8]),
      enrollmentGr8:       num(row[9]),
      enrollmentGr9:       num(row[10]),
      enrollmentGr10:      num(row[11]),
      enrollmentSped:      num(row[12]),
      totalEnrollmentG7G10: num(row[13]),
      totalEnrollmentWithSped: num(row[14]),

      seatsAvailable:      num(row[16]),
      ongoingDelivery:     num(row[17]),
      notYetStarted:       num(row[18]),
      allocation:          num(row[19]),
      totalJhsSeats:       num(row[20]),
      seatNeeds:           num(row[21]),
      seatExcess:          num(row[22]),
    });
  });

  return { records, errors };
}

// ── SHS Sheet Parser ──────────────────────────────────────────────────────────

function parseSHSSheet(rows) {
  const dataRows = rows.slice(SHS_DATA_START);
  const records  = [];
  const errors   = [];

  dataRows.forEach((row, i) => {
    if (!isDataRow(row, 1)) return;

    const division = str(row[3]);
    if (!isBaliwag(division)) return;

    records.push({
      rowNum:              SHS_DATA_START + i + 1,
      schoolId:            str(row[1]),
      schoolName:          str(row[2]),
      division:            division,
      province:            str(row[4]),
      municipality:        str(row[5]),
      legDistrict:         str(row[6]),
      curricularOffering:  str(row[7]),

      enrollment: {
        abm:      { g11: num(row[8]),  g12: num(row[9]) },
        humss:    { g11: num(row[10]), g12: num(row[11]) },
        stem:     { g11: num(row[12]), g12: num(row[13]) },
        gas:      { g11: num(row[14]), g12: num(row[15]) },
        maritime: { g11: num(row[16]), g12: num(row[17]) },
        academic: { g11: num(row[18]), g12: num(row[19]) },
        tvl:      { g11: num(row[20]), g12: num(row[21]) },
        sports:   { g11: num(row[22]), g12: num(row[23]) },
        arts:     { g11: num(row[24]), g12: num(row[25]) },
      },
      totalEnrollmentG11:  num(row[26]),
      totalEnrollmentG12:  num(row[27]),
      totalEnrollmentG11G12: num(row[28]),

      seatsAvailable:      num(row[30]),
      ongoingDelivery:     num(row[31]),
      notYetStarted:       num(row[32]),
      allocation:          num(row[33]),
      totalShsSeats:       num(row[34]),
      seatNeeds:           num(row[35]),
      seatExcess:          num(row[36]),
      pprdChecker:         str(row[37]),
    });
  });

  return { records, errors };
}

// ── Status Sheet Parser ───────────────────────────────────────────────────────

function parseStatusSheet(rows) {
  const dataRow = rows.find((r) => {
    const val = str(r[0]).toLowerCase();
    return val.includes("baliwag") || val.includes("baliuag");
  });

  if (!dataRow) return null;

  return {
    sdo:              str(dataRow[0]),
    expectedSchools:  num(dataRow[1]),
    kes: {
      blankCells:     num(dataRow[2]),
      complete:       num(dataRow[3]),
      percentage:     num(dataRow[4]),
    },
    jhs: {
      blankCells:     num(dataRow[5]),
      complete:       num(dataRow[6]),
      percentage:     num(dataRow[7]),
    },
    shs: {
      blankCells:     num(dataRow[8]),
      complete:       num(dataRow[9]),
      percentage:     num(dataRow[10]),
    },
  };
}

/**
 * Main parser entry point.
 */
export async function parseSeatsFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook  = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const available = workbook.SheetNames;
        const result = { db: null, kes: null, jhs: null, shs: null, status: null, sheetSummary: [] };

        function checkMasterlistLayout(allRows, sheetName) {
          let foundDivision = false;
          for (let i = 0; i < Math.min(allRows.length, 15); i++) {
            const row = allRows[i] || [];
            if (String(row[3] || "").trim().toLowerCase() === "division") {
              foundDivision = true;
              break;
            }
          }
          if (!foundDivision) {
            throw new Error(`Invalid layout in sheet "${sheetName}". Columns appear to be missing or shifted.`);
          }
        }

        console.log("Parsing Seats File. Sheets available:", available);

        if (available.includes(SEATS_SHEETS.DB)) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[SEATS_SHEETS.DB], { header: 1, defval: "" });
          checkMasterlistLayout(rows, "DB");
          result.db = parseDBSheet(rows);
          console.log(`DB Sheet: found ${result.db.records.length} Baliwag records`);
          result.sheetSummary.push({ sheet: "DB", count: result.db.records.length });
        }

        if (available.includes(SEATS_SHEETS.KES)) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[SEATS_SHEETS.KES], { header: 1, defval: "" });
          checkMasterlistLayout(rows, "KES");
          result.kes = parseKESSheet(rows);
          console.log(`KES Sheet: found ${result.kes.records.length} Baliwag records`);
          result.sheetSummary.push({ sheet: "KES", count: result.kes.records.length });
        }

        if (available.includes(SEATS_SHEETS.JHS)) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[SEATS_SHEETS.JHS], { header: 1, defval: "" });
          checkMasterlistLayout(rows, "JHS");
          result.jhs = parseJHSSheet(rows);
          console.log(`JHS Sheet: found ${result.jhs.records.length} Baliwag records`);
          result.sheetSummary.push({ sheet: "JHS", count: result.jhs.records.length });
        }

        if (available.includes(SEATS_SHEETS.SHS)) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[SEATS_SHEETS.SHS], { header: 1, defval: "" });
          checkMasterlistLayout(rows, "SHS");
          result.shs = parseSHSSheet(rows);
          console.log(`SHS Sheet: found ${result.shs.records.length} Baliwag records`);
          result.sheetSummary.push({ sheet: "SHS", count: result.shs.records.length });
        }

        if (available.includes(SEATS_SHEETS.STATUS)) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[SEATS_SHEETS.STATUS], { header: 1, defval: "" });
          result.status = parseStatusSheet(rows);
          if (result.status) {
            console.log("Status Sheet: found Baliwag summary");
            result.sheetSummary.push({ sheet: "Status", count: 1 });
          }
        }

        if (!result.db && !result.kes && !result.jhs && !result.shs) {
          return reject(new Error(
            `Invalid Seats Inventory file. Expected sheets: DB, KES, JHS, SHS, Status. ` +
            `Found: ${available.join(", ")}`
          ));
        }

        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse seats file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsArrayBuffer(file);
  });
}
