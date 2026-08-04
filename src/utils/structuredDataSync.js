import { supabase } from "../lib/supabaseClient";
import { runImport } from "./ExcelParsers";

export const TABLES_BY_CATEGORY = {
  enrollment: ["enrollment_data"],
  classrooms: ["classrooms_school_db", "classrooms_kes", "classrooms_jhs", "classrooms_shs", "classrooms_status"],
  seats:      ["seats_kes", "seats_jhs", "seats_shs", "seats_status"],
  teachers_inventory: ["teachers_kes", "teachers_jhs", "teachers_shs", "teachers_status"],
  textbook_inventory: ["textbooks_kes", "textbooks_jhs", "textbooks_shs", "textbooks_status"],
};

export async function deleteParsedDataForFile(category, fileId) {
  const tables = TABLES_BY_CATEGORY[category] || [];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("file_id", fileId);
    if (error) console.warn(`Failed clearing ${table} for file ${fileId}:`, error.message);
  }
}

async function processMultiSheet(prefix, data, schoolYear, uploaderName, fileId) {
  const { db, kes, jhs, shs, status } = data;

  if (db?.records.length) {
    const recs = db.records.map((r) => ({
      school_id: r.schoolId, school_name: r.schoolName, division: r.division, district: r.district,
      street_address: r.streetAddress, mother_school_id: r.motherSchoolId, province: r.province,
      municipality: r.municipality, legislative_district: r.legislativeDistrict, barangay: r.barangay,
      sector: r.sector, school_subclassification: r.schoolSubclassification, school_type: r.schoolType,
      implementing_unit: r.implementingUnit, modified_coc: r.modifiedCoc, enrollment_elem: r.enrollmentElem,
      enrollment_jhs: r.enrollmentJhs, enrollment_shs: r.enrollmentShs, enrollment_total: r.enrollmentTotal,
      school_year: schoolYear, uploaded_by: uploaderName, file_id: fileId,
    }));
    for (let i = 0; i < recs.length; i += 500) {
      const { error } = await supabase.from(`${prefix}_school_db`).insert(recs.slice(i, i + 500));
      if (error) throw error;
    }
  }

  if (kes?.records.length) {
    const recs = kes.records.map((r) => {
      const base = {
        school_id: r.schoolId, school_name: r.schoolName, division: r.division,
        kinder_needs: r.kinderNeeds, kinder_excess: r.kinderExcess,
        g1g6_needs: r.g1g6Needs, g1g6_excess: r.g1g6Excess,
        sned_needs: r.snedNeeds, sned_excess: r.snedExcess,
        pprd_checker: r.pprdChecker, remarks: r.remarks,
        school_year: schoolYear, uploaded_by: uploaderName, file_id: fileId,
      };
      if (prefix === "teachers") {
        base.prev_total_teachers_inventory = r.prevTotalTeachersInventory;
        base.prev_needs = r.prevNeeds; base.prev_excess = r.prevExcess;
      } else if (prefix === "seats") {
        base.prev_total_seats_inventory = r.prevTotalSeatsInventory;
        base.prev_needs = r.prevNeeds; base.prev_excess = r.prevExcess;
      } else if (prefix === "classrooms") {
        base.prev_total_classroom_inventory = r.prevTotalClassroomInventory;
        base.prev_kinder_needs = r.prevKinderNeeds; base.prev_kinder_excess = r.prevKinderExcess;
        base.prev_g1g6_needs = r.prevG1g6Needs; base.prev_g1g6_excess = r.prevG1g6Excess;
        base.prev_sned_needs = r.prevSnedNeeds; base.prev_sned_excess = r.prevSnedExcess;
      } else if (prefix === "textbooks") {
        base.textbook_needs = r.textbookNeeds; base.textbook_excess = r.textbookExcess;
      }
      return base;
    });
    for (let i = 0; i < recs.length; i += 500) {
      const { error } = await supabase.from(`${prefix}_kes`).insert(recs.slice(i, i + 500));
      if (error) throw error;
    }
  }

  if (jhs?.records.length) {
    const recs = jhs.records.map((r) => {
      const common = { school_year: schoolYear, uploaded_by: uploaderName, file_id: fileId };
      if (prefix === "teachers") {
        return { school_id: r.schoolId, school_name: r.schoolName, division: r.division,
          teacher_needs: r.teacherNeeds, teacher_excess: r.teacherExcess,
          pprd_checker: r.pprdChecker, remarks: r.remarks,
          prev_total_teachers_inventory: r.prevTotalTeachersInventory,
          prev_needs: r.prevNeeds, prev_excess: r.prevExcess, ...common };
      }
      if (prefix === "seats") {
        return { school_id: r.schoolId, school_name: r.schoolName, division: r.division,
          province: r.province, municipality: r.municipality, leg_district: r.legDistrict,
          curricular_offering: r.curricularOffering, enrollment_gr7: r.enrollmentGr7,
          enrollment_gr8: r.enrollmentGr8, enrollment_gr9: r.enrollmentGr9,
          enrollment_gr10: r.enrollmentGr10, enrollment_sped: r.enrollmentSped,
          total_enrollment_g7_g10: r.totalEnrollmentG7G10,
          total_enrollment_with_sped: r.totalEnrollmentWithSped,
          seats_available: r.seatsAvailable, ongoing_delivery: r.ongoingDelivery,
          not_yet_started: r.notYetStarted, allocation: r.allocation,
          total_jhs_seats: r.totalJhsSeats, seat_needs: r.seatNeeds, seat_excess: r.seatExcess, ...common };
      }
      if (prefix === "textbooks") {
        return { school_id: r.schoolId, school_name: r.schoolName, division: r.division,
          textbook_needs: r.textbookNeeds, textbook_excess: r.textbookExcess,
          pprd_checker: r.pprdChecker, remarks: r.remarks, ...common };
      }
      return { school_id: r.schoolId, school_name: r.schoolName, division: r.division, province: r.province,
        municipality: r.municipality, leg_district: r.legDistrict, curricular_offering: r.curricularOffering,
        enrollment_gr7: r.enrollmentGr7, enrollment_gr8: r.enrollmentGr8, enrollment_gr9: r.enrollmentGr9,
        enrollment_gr10: r.enrollmentGr10, enrollment_sped: r.enrollmentSped, total_enrollment: r.totalEnrollment,
        total_enrollment_with_sped: r.totalEnrollmentWithSped, sy_enrollment_lis: r.syEnrollmentLis,
        total_requirement: r.totalRequirement, already_available: r.alreadyAvailable,
        ongoing_construction: r.ongoingConstruction, not_yet_started: r.notYetStarted, allocation: r.allocation,
        total_classroom: r.totalClassroom, classroom_needs: r.classroomNeeds, classroom_excess: r.classroomExcess,
        pprd_checker: r.pprdChecker, ...common };
    });
    for (let i = 0; i < recs.length; i += 500) {
      const { error } = await supabase.from(`${prefix}_jhs`).insert(recs.slice(i, i + 500));
      if (error) throw error;
    }
  }

  if (shs?.records.length) {
    const recs = shs.records.map((r) => {
      const common = { school_year: schoolYear, uploaded_by: uploaderName, file_id: fileId };
      if (prefix === "teachers") {
        return { school_id: r.schoolId, school_name: r.schoolName, division: r.division,
          teacher_needs: r.teacherNeeds, teacher_excess: r.teacherExcess,
          pprd_checker: r.pprdChecker, remarks: r.remarks,
          prev_total_teachers_inventory: r.prevTotalTeachersInventory,
          prev_needs: r.prevNeeds, prev_excess: r.prevExcess, ...common };
      }
      if (prefix === "seats") {
        return { school_id: r.schoolId, school_name: r.schoolName, division: r.division,
          province: r.province, municipality: r.municipality, leg_district: r.legDistrict,
          curricular_offering: r.curricularOffering, enrollment_data: r.enrollment,
          total_enrollment_g11: r.totalEnrollmentG11, total_enrollment_g12: r.totalEnrollmentG12,
          total_enrollment_g11_g12: r.totalEnrollmentG11G12,
          seats_available: r.seatsAvailable, ongoing_delivery: r.ongoingDelivery,
          not_yet_started: r.notYetStarted, allocation: r.allocation,
          total_shs_seats: r.totalShsSeats, seat_needs: r.seatNeeds, seat_excess: r.seatExcess,
          pprd_checker: r.pprdChecker, ...common };
      }
      if (prefix === "textbooks") {
        return { school_id: r.schoolId, school_name: r.schoolName, division: r.division,
          textbook_needs: r.textbookNeeds, textbook_excess: r.textbookExcess,
          pprd_checker: r.pprdChecker, remarks: r.remarks, ...common };
      }
      return { school_id: r.schoolId, school_name: r.schoolName, division: r.division, province: r.province,
        municipality: r.municipality, leg_district: r.legDistrict, curricular_offering: r.curricularOffering,
        enrollment_data: r.enrollment, total_enrollment_g11: r.totalEnrollmentG11,
        total_enrollment_g12: r.totalEnrollmentG12, total_enrollment: r.totalEnrollment,
        sy_enrollment_lis: r.syEnrollmentLis, total_requirement: r.totalRequirement,
        already_available: r.alreadyAvailable, ongoing_construction: r.ongoingConstruction,
        not_yet_started: r.notYetStarted, allocation: r.allocation, total_classroom: r.totalClassroom,
        classroom_needs: r.classroomNeeds, classroom_excess: r.classroomExcess, pprd_checker: r.pprdChecker,
        ...common };
    });
    for (let i = 0; i < recs.length; i += 500) {
      const { error } = await supabase.from(`${prefix}_shs`).insert(recs.slice(i, i + 500));
      if (error) throw error;
    }
  }

  if (status) {
    const { error } = await supabase.from(`${prefix}_status`).insert({
      sdo: status.sdo, expected_schools: status.expectedSchools,
      kes_blank_cells: status.kes.blankCells, kes_complete: status.kes.complete, kes_percentage: status.kes.percentage,
      jhs_blank_cells: status.jhs.blankCells, jhs_complete: status.jhs.complete, jhs_percentage: status.jhs.percentage,
      shs_blank_cells: status.shs.blankCells, shs_complete: status.shs.complete, shs_percentage: status.shs.percentage,
      school_year: schoolYear, uploaded_by: uploaderName, file_id: fileId,
    });
    if (error) throw error;
  }
}

/**
 * Parses a file per its category and inserts rows tagged with file_id.
 * Pass { replace: true } to first wipe existing rows for that file (resync/edit flow).
 */
export async function parseAndSyncStructuredData(category, file, schoolYear, uploaderName, fileId, { replace = false } = {}) {
  if (category === "general") return;

  if (replace) {
    await deleteParsedDataForFile(category, fileId);
  }

  if (category === "enrollment") {
    const { records, errors } = await runImport(file, "enrollment");
    if (errors?.length) console.warn("Row errors:", errors);
    const dbRecords = records.map((r) => ({
      school_id: r.schoolId, school_name: r.schoolName, school_type: r.schoolType,
      category: r.sheet, school_year: schoolYear,
      elementary_data: r.elementary, junior_high_data: r.juniorHigh,
      senior_high_s1_data: r.seniorHighS1, senior_high_s2_data: r.seniorHighS2,
      grand_total: r.grandTotal, uploaded_by: uploaderName, file_id: fileId,
    }));
    const { error } = await supabase.from("enrollment_data").insert(dbRecords);
    if (error) throw error;
    return;
  }

  const prefixMap = { classrooms: "classrooms", seats: "seats", teachers_inventory: "teachers", textbook_inventory: "textbooks" };
  const prefix = prefixMap[category];
  if (!prefix) return;

  const data = await runImport(file, category);
  await processMultiSheet(prefix, data, schoolYear, uploaderName, fileId);
}