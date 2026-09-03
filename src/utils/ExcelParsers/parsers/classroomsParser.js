/**
 * classroomsParser.js
 * ──────────────────────────────────────────────────────────────
 * Purpose-built parser for the DepEd "Classrooms Inventory FE" Excel format.
 *
 * File structure — 5 relevant sheets (Baliwag-specific):
 *
 *   Sheet "DB" — National school-level enrollment database
 *     - Header row 5 (index 4)
 *     - Data starts row 6 (index 5)
 *     - FILTERED to only keep schools under "City of Baliwag"
 *     - Columns:
 *       [0]  → No.
 *       [1]  → School Name
 *       [2]  → BEIS School ID
 *       [3]  → Division  ← filter key ("City of Baliwag")
 *       [4]  → District
 *       [5]  → Street Address
 *       [6]  → Mother School ID
 *       [7]  → Province
 *       [8]  → Municipality
 *       [9]  → Legislative District
 *       [10] → Barangay
 *       [11] → Sector
 *       [12] → School Subclassification
 *       [13] → School Type
 *       [14] → Implementing Unit
 *       [15] → Modified COC (Curricular Offering Category)
 *       [16] → KES + NG enrollment
 *       [17] → JHS + NG enrollment
 *       [18] → SHS enrollment
 *       [19] → Total enrollment
 *
 *   Sheet "KES" — Kinder & Elementary Classroom Inventory (Baliwag SDO)
 *     - Headers rows 7–8 (index 6–7), example row 9, TOTAL row 10
 *     - Data starts row 11 (index 10)
 *     - Columns:
 *       [0]  → No.
 *       [1]  → School ID
 *       [2]  → School Name
 *       [3]  → Division       [4] → Province
 *       [5]  → Municipality   [6] → Leg District
 *       [7]  → Curricular Offering
 *       Projected Enrollment:
 *         [8]=K  [9]=G1  [10]=G2  [11]=G3  [12]=G4  [13]=G5  [14]=G6  [15]=SNEd NG
 *       [16] → Total Enrollment K-6
 *       [17] → Total Enrollment K-6 + SNEd
 *       [18] → SY 2024-2025 Enrollment (LIS)
 *       Requirements (computed):
 *         [19]=Kinder Req  [20]=G1-G3 Req  [21]=G4-G6 Req  [22]=SNEd NG Req
 *       Kinder Classroom Inventory:
 *         [23]=Available  [24]=Ongoing  [25]=Not Started  [26]=Alloc 2026  [27]=Total
 *       G1-G6 Classroom Inventory:
 *         [28]=Available  [29]=Ongoing  [30]=Not Started  [31]=Alloc 2026  [32]=Total
 *       SNEd NG Classroom Inventory:
 *         [33]=Available  [34]=Ongoing  [35]=Not Started  [36]=Alloc 2026  [37]=Total
 *       [38] → Total KES + SNEd Classroom Inventory
 *       Classroom Needs/Excess:
 *         [39]=Kinder Needs  [40]=Kinder Excess
 *         [41]=G1-G6 Needs   [42]=G1-G6 Excess
 *         [43]=SNEd Needs    [44]=SNEd Excess
 *       [45] → PPRD Checker status
 *       [46] → Remarks (e.g. "ALS - 1")
 *       SY 2024-2025 Previous Year Classroom Inventory:
 *         [47]=Total Classroom Inventory (prev)
 *         [48]=Kinder Needs (prev)  [49]=Kinder Excess (prev)
 *         [50]=G1-G6 Needs (prev)   [51]=G1-G6 Excess (prev)
 *         [52]=SNEd Needs (prev)    [53]=SNEd Excess (prev)
 *       [54] → Remarks (OPTIONAL)
 *
 *   Sheet "JHS" — Junior High School Classroom Inventory (Baliwag SDO)
 *     - Headers rows 7–8, example row 9, TOTAL row 10
 *     - Data starts row 11 (index 10)
 *     - Columns:
 *       [0]=No.  [1]=School ID  [2]=School Name
 *       [3]=Division  [4]=Province  [5]=Municipality  [6]=Leg District
 *       [7]=Curricular Offering
 *       Enrollment: [8]=Gr7  [9]=Gr8  [10]=Gr9  [11]=Gr10  [12]=SPED NG
 *       [13]=Total G7-G10  [14]=Total + SPED  [15]=SY Enrollment (LIS)
 *       [16]=Total Requirement (computed)
 *       JHS Classroom Inventory:
 *         [17]=Available  [18]=Ongoing  [19]=Not Started  [20]=Alloc  [21]=Total
 *       [22]=Needs  [23]=Excess
 *       [24]=PPRD Checker
 *
 *   Sheet "SHS" — Senior High School Classroom Inventory (Baliwag SDO)
 *     - Headers rows 7–8, example row 9, TOTAL row 10
 *     - Data starts row 11 (index 10)
 *     - Columns:
 *       [0]=No.  [1]=School ID  [2]=School Name
 *       [3]=Division  [4]=Province  [5]=Municipality  [6]=Leg District
 *       [7]=Curricular Offering
 *       Enrollment by Strand (G11/G12 pairs):
 *         [8-9]=ABM  [10-11]=HUMSS  [12-13]=STEM  [14-15]=GAS
 *         [16-17]=Maritime  [18-19]=Academic  [20-21]=TVL
 *         [22-23]=Sports  [24-25]=Arts
 *       [26]=Total G11  [27]=Total G12  [28]=Total G11-G12
 *       [29]=SY Enrollment (LIS)
 *       [30]=Total Requirement
 *       SHS Classroom Inventory:
 *         [31]=Available  [32]=Ongoing  [33]=Not Started  [34]=Alloc  [35]=Total
 *       [36]=Needs  [37]=Excess
 *       [38]=PPRD Checker
 *
 *   Sheet "Status" — Completion summary (1 data row)
 *     - Row 5: Headers   Row 8: Data
 *     - [0]=SDO  [1]=Expected Schools
 *     - [2-4]=KES (Blank/Complete/%)  [5-7]=JHS  [8-10]=SHS
 *
 * Usage:
 *   import { parseClassroomsFile } from './parsers/classroomsParser';
 *   const { db, kes, jhs, shs, status, sheetSummary } = await parseClassroomsFile(file);
 */

import * as XLSX from "xlsx";

// ── Constants ─────────────────────────────────────────────────────────────────

const DB_HEADER_ROW   = 4;   // 0-indexed
const DB_DATA_START   = 5;
const BALIWAG_FILTER  = ["city of baliwag", "baliuag"];

const KES_DATA_START  = 10;  // Row 11 (after headers, example, TOTAL)
const JHS_DATA_START  = 10;
const SHS_DATA_START  = 10;

export const CLASSROOMS_SHEETS = {
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
  if (!id || id === "TOTAL" || id === "E.g.") return false;
  // School IDs are numeric
  return !isNaN(Number(id));
}

// ── DB Sheet Parser ───────────────────────────────────────────────────────────

function parseDBSheet(rows) {
  const dataRows = rows.slice(DB_DATA_START);
  const records  = [];
  const errors   = [];

  dataRows.forEach((row, i) => {
    const division = str(row[3]);
    if (!isBaliwag(division)) return; // ← Only Baliwag

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

    records.push({
      rowNum:              KES_DATA_START + i + 1,
      schoolId:            str(row[1]),
      schoolName:          str(row[2]),
      division:            str(row[3]),

      // No. of Classroom (Current Year) — Needs / Excess
      kinderNeeds:         num(row[39]),
      kinderExcess:        num(row[40]),
      g1g6Needs:           num(row[41]),
      g1g6Excess:          num(row[42]),
      snedNeeds:           num(row[43]),
      snedExcess:          num(row[44]),

      pprdChecker:         str(row[45]),
      remarks:             str(row[46]),

      // SY 2024-2025 Previous Year Classroom Inventory
      prevTotalClassroomInventory: num(row[47]),
      prevKinderNeeds:     num(row[48]),
      prevKinderExcess:    num(row[49]),
      prevG1g6Needs:       num(row[50]),
      prevG1g6Excess:      num(row[51]),
      prevSnedNeeds:       num(row[52]),
      prevSnedExcess:      num(row[53]),
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
    if (!isDataRow(row, 1)) return;

    records.push({
      rowNum:              JHS_DATA_START + i + 1,
      schoolId:            str(row[1]),
      schoolName:          str(row[2]),
      division:            str(row[3]),
      province:            str(row[4]),
      municipality:        str(row[5]),
      legDistrict:         str(row[6]),
      curricularOffering:  str(row[7]),

      // Projected Enrollment
      enrollmentGr7:       num(row[8]),
      enrollmentGr8:       num(row[9]),
      enrollmentGr9:       num(row[10]),
      enrollmentGr10:      num(row[11]),
      enrollmentSped:      num(row[12]),
      totalEnrollment:     num(row[13]),
      totalEnrollmentWithSped: num(row[14]),
      syEnrollmentLis:     num(row[15]),

      // Classroom data
      totalRequirement:    num(row[16]),
      alreadyAvailable:    num(row[17]),
      ongoingConstruction: num(row[18]),
      notYetStarted:       num(row[19]),
      allocation:          num(row[20]),
      totalClassroom:      num(row[21]),

      classroomNeeds:      num(row[22]),
      classroomExcess:     num(row[23]),

      pprdChecker:         str(row[24]),
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

    records.push({
      rowNum:              SHS_DATA_START + i + 1,
      schoolId:            str(row[1]),
      schoolName:          str(row[2]),
      division:            str(row[3]),
      province:            str(row[4]),
      municipality:        str(row[5]),
      legDistrict:         str(row[6]),
      curricularOffering:  str(row[7]),

      // Enrollment by strand (G11/G12 pairs)
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
      totalEnrollment:     num(row[28]),
      syEnrollmentLis:     num(row[29]),

      // Classroom data
      totalRequirement:    num(row[30]),
      alreadyAvailable:    num(row[31]),
      ongoingConstruction: num(row[32]),
      notYetStarted:       num(row[33]),
      allocation:          num(row[34]),
      totalClassroom:      num(row[35]),

      classroomNeeds:      num(row[36]),
      classroomExcess:     num(row[37]),

      pprdChecker:         str(row[38]),
    });
  });

  return { records, errors };
}

// ── Status Sheet Parser ───────────────────────────────────────────────────────

function parseStatusSheet(rows) {
  // Status sheet is very small — typically row 8 (index 7) has the data
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

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Reads a Classrooms Inventory Excel file and parses all 5 Baliwag sheets.
 *
 * @param {File} file - The uploaded .xlsx file.
 * @returns {Promise<{
 *   db:     { records: Object[], errors: Object[] },
 *   kes:    { records: Object[], errors: Object[] },
 *   jhs:    { records: Object[], errors: Object[] },
 *   shs:    { records: Object[], errors: Object[] },
 *   status: Object|null,
 *   sheetSummary: { sheet: string, count: number }[]
 * }>}
 */
export async function parseClassroomsFile(file) {
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

        // ── DB sheet (filter for Baliwag) ──
        if (available.includes(CLASSROOMS_SHEETS.DB)) {
          const rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[CLASSROOMS_SHEETS.DB],
            { header: 1, defval: "" }
          );
          checkMasterlistLayout(rows, "DB");
          result.db = parseDBSheet(rows);
          result.sheetSummary.push({ sheet: "DB", count: result.db.records.length });
        }

        // ── KES sheet ──
        if (available.includes(CLASSROOMS_SHEETS.KES)) {
          const rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[CLASSROOMS_SHEETS.KES],
            { header: 1, defval: "" }
          );
          checkMasterlistLayout(rows, "KES");
          result.kes = parseKESSheet(rows);
          result.sheetSummary.push({ sheet: "KES", count: result.kes.records.length });
        }

        // ── JHS sheet ──
        if (available.includes(CLASSROOMS_SHEETS.JHS)) {
          const rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[CLASSROOMS_SHEETS.JHS],
            { header: 1, defval: "" }
          );
          checkMasterlistLayout(rows, "JHS");
          result.jhs = parseJHSSheet(rows);
          result.sheetSummary.push({ sheet: "JHS", count: result.jhs.records.length });
        }

        // ── SHS sheet ──
        if (available.includes(CLASSROOMS_SHEETS.SHS)) {
          const rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[CLASSROOMS_SHEETS.SHS],
            { header: 1, defval: "" }
          );
          checkMasterlistLayout(rows, "SHS");
          result.shs = parseSHSSheet(rows);
          result.sheetSummary.push({ sheet: "SHS", count: result.shs.records.length });
        }

        // ── Status sheet ──
        if (available.includes(CLASSROOMS_SHEETS.STATUS)) {
          const rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[CLASSROOMS_SHEETS.STATUS],
            { header: 1, defval: "" }
          );
          result.status = parseStatusSheet(rows);
          if (result.status) {
            result.sheetSummary.push({ sheet: "Status", count: 1 });
          }
        }

        if (!result.db && !result.kes && !result.jhs && !result.shs) {
          return reject(new Error(
            `Invalid Classrooms Inventory file. Expected sheets: ${Object.values(CLASSROOMS_SHEETS).join(", ")}. ` +
            `Found: ${available.join(", ")}`
          ));
        }

        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse classrooms file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsArrayBuffer(file);
  });
}
