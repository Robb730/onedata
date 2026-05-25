/**
 * ExcelParsers/index.js
 * ──────────────────────────────────────────────────────────────
 * Public barrel export for the entire ExcelParsers module.
 *
 * Import everything you need from one place:
 *
 *   import { runImport, IMPORT_TYPES } from '@/utils/ExcelParsers';
 *   import { parseEnrollment }         from '@/utils/ExcelParsers';
 *   import { checkRequiredHeaders }    from '@/utils/ExcelParsers';
 */

// ── Service (main entry point) ─────────────────────────────────
export { runImport, readExcelFile, readAllSheets, IMPORT_TYPES } from "./services/importService";

// ── Individual parsers ─────────────────────────────────────────
export { parseEnrollmentFile, aggregateEnrollmentTotals, ENROLLMENT_SHEETS } from "./parsers/enrollmentParser";
export { parseClassroomsFile, CLASSROOMS_SHEETS } from "./parsers/classroomsParser";
export { parseSchools,    validateSchoolsHeaders,    SCHOOLS_REQUIRED_HEADERS     } from "./parsers/schoolsParser";
export { parseTeachers,   validateTeachersHeaders,   TEACHERS_REQUIRED_HEADERS    } from "./parsers/teachersParser";
export { parseStudents,   validateStudentsHeaders,   STUDENTS_REQUIRED_HEADERS    } from "./parsers/studentsParser";

// ── Shared validation utilities ────────────────────────────────
export { checkRequiredHeaders, buildHeaderErrorMessage } from "./validations/validateHeaders";
export { isEmptyRow, validateRequiredField, validateNumericField, validateSchoolYear, collectErrors } from "./validations/validateRows";
