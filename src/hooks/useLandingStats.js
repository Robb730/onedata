import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export function useLandingStats(selectedYear) {
    const [stats, setStats] = useState({
        loading: true,
        error: null,
        schoolYear: selectedYear,
        learners: { total: 0, public: 0, private: 0, byLevel: [] },
        schools: { total: 0, public: 0, private: 0 },
        teachers: { total: 0, totalNeeds: 0, byLevel: [] },
        classrooms: { total: 0, totalNeeds: 0, byLevel: [] },
    });

    useEffect(() => {
        if (!selectedYear) return;
        let cancelled = false;

        async function fetchStats() {
            setStats((prev) => ({ ...prev, isFetching: true, error: null }));
            try {
                const [
                    enrollmentRes,
                    teachersKesRes,
                    teachersJhsRes,
                    teachersShsRes,
                    classroomsKesRes,
                    classroomsJhsRes,
                    classroomsShsRes,
                    kpiRes,
                ] = await Promise.all([
                    supabase
                        .from("enrollment_data")
                        .select(
                            "school_id, school_name, school_type, category, grand_total, elementary_data, junior_high_data, senior_high_s1_data, senior_high_s2_data"
                        )
                        .eq("school_year", selectedYear),
                    supabase
                        .from("teachers_kes")
                        .select("school_id, kinder_needs, kinder_excess, g1g6_needs, g1g6_excess, sned_needs, sned_excess, prev_total_teachers_inventory")
                        .eq("school_year", selectedYear),
                    supabase
                        .from("teachers_jhs")
                        .select("school_id, teacher_needs, teacher_excess, prev_total_teachers_inventory")
                        .eq("school_year", selectedYear),
                    supabase
                        .from("teachers_shs")
                        .select("school_id, teacher_needs, teacher_excess, prev_total_teachers_inventory")
                        .eq("school_year", selectedYear),
                    supabase
                        .from("classrooms_kes")
                        .select("school_id, kinder_needs, kinder_excess, g1g6_needs, g1g6_excess, sned_needs, sned_excess, prev_total_classroom_inventory")
                        .eq("school_year", selectedYear),
                    supabase
                        .from("classrooms_jhs")
                        .select("school_id, total_classroom, classroom_needs, classroom_excess")
                        .eq("school_year", selectedYear),
                    supabase
                        .from("classrooms_shs")
                        .select("school_id, total_classroom, classroom_needs, classroom_excess")
                        .eq("school_year", selectedYear),
                    supabase
                        .from("performance_indicators_data")
                        .select("*")
                        .eq("school_year", selectedYear),
                ]);

                if (enrollmentRes.error) throw enrollmentRes.error;
                if (teachersKesRes.error) throw teachersKesRes.error;
                if (teachersJhsRes.error) throw teachersJhsRes.error;
                if (teachersShsRes.error) throw teachersShsRes.error;
                if (classroomsKesRes.error) throw classroomsKesRes.error;
                if (classroomsJhsRes.error) throw classroomsJhsRes.error;
                if (classroomsShsRes.error) throw classroomsShsRes.error;
                if (kpiRes.error) throw kpiRes.error;
                if (cancelled) return;

                const data = enrollmentRes.data;
                const teachersKes = teachersKesRes.data;
                const teachersJhs = teachersJhsRes.data;
                const teachersShs = teachersShsRes.data;
                const classroomsKes = classroomsKesRes.data;
                const classroomsJhs = classroomsJhsRes.data;
                const classroomsShs = classroomsShsRes.data;
                const kpiData = kpiRes.data;

                const publicTotal = data
                    .filter((r) => r.category === "PUBLIC")
                    .reduce((a, r) => a + (r.grand_total ?? 0), 0);
                const privateTotal = data
                    .filter((r) => r.category === "PRIVATE")
                    .reduce((a, r) => a + (r.grand_total ?? 0), 0);

                const levelKeys = [
                    { key: "elementary_data", label: "Elementary" },
                    { key: "junior_high_data", label: "Junior High" },
                    { key: "senior_high_s1_data", label: "Senior High S1" },
                    { key: "senior_high_s2_data", label: "Senior High S2" },
                ];

                const byLevel = levelKeys.map(({ key, label }) => {
                    let pub = 0, priv = 0;
                    data.forEach((row) => {
                        const val = row[key]?.total ?? { m: 0, f: 0 };
                        const num = (val.m ?? 0) + (val.f ?? 0);
                        if (row.category === "PUBLIC") pub += num;
                        else priv += num;
                    });
                    return { level: label, public: pub, private: priv };
                });

                const elemGradeBreakdown = { kinder: { m: 0, f: 0 }, grade1: { m: 0, f: 0 }, grade2: { m: 0, f: 0 }, grade3: { m: 0, f: 0 }, grade4: { m: 0, f: 0 }, grade5: { m: 0, f: 0 }, grade6: { m: 0, f: 0 }, nonGraded: { m: 0, f: 0 } };

                data.forEach((row) => {
                    const elem = row.elementary_data;
                    if (!elem) return;
                    Object.keys(elemGradeBreakdown).forEach((g) => {
                        elemGradeBreakdown[g].m += elem[g]?.m ?? 0;
                        elemGradeBreakdown[g].f += elem[g]?.f ?? 0;
                    });
                });

                const elemByGrade = Object.entries(elemGradeBreakdown).map(([grade, v]) => ({
                    grade,
                    male: v.m,
                    female: v.f,
                    total: v.m + v.f,
                }));

                const getKpiRate = (sheetName, headerSubstring) => {
                    const sheet = kpiData.find((r) => r.sheet_name?.trim() === sheetName.trim());
                    if (!sheet) return 0;
                    const idx = sheet.headers_main?.findIndex((h) => h && h.toString().includes(headerSubstring));
                    if (idx !== -1 && sheet.total_row?.[idx] !== undefined && sheet.total_row[idx] !== null) {
                        return parseFloat(sheet.total_row[idx]) * 100;
                    }
                    return 0;
                };

                const elemDropout = getKpiRate("G1toG6 SLR_DR", "Ave. School Leaver Rate");
                const jhsDropout = getKpiRate("JHS School Leaver Rate", "Ave. School Leaver Rate");
                const shsDropout = getKpiRate(" JHS to SHS SLR_DR", "Ave. School Leaver Rate");
                const overallDropout = (elemDropout + jhsDropout + shsDropout) / 3;

                const dropoutByLevel = [
                    { level: "Elementary", rate: elemDropout },
                    { level: "JHS", rate: jhsDropout },
                    { level: "SHS", rate: shsDropout },
                ];

                const kToElemPromo = getKpiRate("K to 6  Promo & Grad", "Ave. Promotion Rate");
                const jhsPromo = getKpiRate("JHS Promo & Grad", "Ave. Promotion Rate");
                const shsPromo = getKpiRate(" JHS to SHS Promo & Grad", "Ave. Promotion Rate");

                const promotionByLevel = [
                    { level: "Elementary", rate: kToElemPromo },
                    { level: "JHS", rate: jhsPromo },
                    { level: "SHS", rate: shsPromo },
                ];

                const cohortSurvival = getKpiRate("G1toG6 CSR & CompR", "CSR");

                const uniqueSchools = new Map();
                data.forEach((row) => {
                    if (!uniqueSchools.has(row.school_id)) {
                        uniqueSchools.set(row.school_id, row.category);
                    }
                });
                const schoolCategories = [...uniqueSchools.values()];
                const publicSchools = schoolCategories.filter((c) => c === "PUBLIC").length;
                const privateSchools = schoolCategories.filter((c) => c === "PRIVATE").length;

                const gradeKeysFor = (row) => {
                    const grades = [];
                    if (row.elementary_data) {
                        ["kinder", "grade1", "grade2", "grade3", "grade4", "grade5", "grade6", "nonGraded"].forEach((g) => {
                            const v = row.elementary_data[g];
                            if (v) grades.push({ grade: g, male: v.m ?? 0, female: v.f ?? 0, total: (v.m ?? 0) + (v.f ?? 0) });
                        });
                    }
                    if (row.junior_high_data) {
                        ["grade7", "grade8", "grade9", "grade10"].forEach((g) => {
                            const v = row.junior_high_data[g];
                            if (v) grades.push({ grade: g, male: v.m ?? 0, female: v.f ?? 0, total: (v.m ?? 0) + (v.f ?? 0) });
                        });
                    }
                    [row.senior_high_s1_data, row.senior_high_s2_data].forEach((shsData, i) => {
                        if (!shsData) return;
                        Object.keys(shsData).forEach((g) => {
                            const v = shsData[g];
                            if (v?.m !== undefined || v?.f !== undefined) {
                                grades.push({
                                    grade: `${g} (S${i + 1})`,
                                    male: v.m ?? 0,
                                    female: v.f ?? 0,
                                    total: (v.m ?? 0) + (v.f ?? 0),
                                });
                            }
                        });
                    });
                    return grades.filter((g) => g.total > 0);
                };

                const schoolList = data.map((row) => ({
                    name: row.school_name,
                    type: row.school_type,
                    category: row.category,
                    enrollment: row.grand_total,
                    byGrade: gradeKeysFor(row),
                })).sort((a, b) => b.enrollment - a.enrollment);

                // ── Teachers: total = inventory (matches Dashboard), needs kept for context ──
                const teacherKesTotal = teachersKes.reduce((a, r) => a + (r.prev_total_teachers_inventory ?? 0), 0);
                const teacherJhsTotal = teachersJhs.reduce((a, r) => a + (r.prev_total_teachers_inventory ?? 0), 0);
                const teacherShsTotal = teachersShs.reduce((a, r) => a + (r.prev_total_teachers_inventory ?? 0), 0);

                const teacherKesNeeds = teachersKes.reduce(
                    (a, r) => a + (r.kinder_needs ?? 0) + (r.g1g6_needs ?? 0) + (r.sned_needs ?? 0),
                    0
                );
                const teacherJhsNeeds = teachersJhs.reduce((a, r) => a + (r.teacher_needs ?? 0), 0);
                const teacherShsNeeds = teachersShs.reduce((a, r) => a + (r.teacher_needs ?? 0), 0);

                const teacherKesExcess = teachersKes.reduce(
                    (a, r) => a + (r.kinder_excess ?? 0) + (r.g1g6_excess ?? 0) + (r.sned_excess ?? 0),
                    0
                );
                const teacherJhsExcess = teachersJhs.reduce((a, r) => a + (r.teacher_excess ?? 0), 0);
                const teacherShsExcess = teachersShs.reduce((a, r) => a + (r.teacher_excess ?? 0), 0);

                const teachersByLevel = [
                    { level: "Elementary (KES)", total: teacherKesTotal, needs: teacherKesNeeds, excess: teacherKesExcess },
                    { level: "Junior High", total: teacherJhsTotal, needs: teacherJhsNeeds, excess: teacherJhsExcess },
                    { level: "Senior High", total: teacherShsTotal, needs: teacherShsNeeds, excess: teacherShsExcess },
                ];

                const totalTeachers = teacherKesTotal + teacherJhsTotal + teacherShsTotal;
                const totalTeacherNeeds = teacherKesNeeds + teacherJhsNeeds + teacherShsNeeds;

                // ── Classrooms: total = inventory (matches Dashboard), needs kept for context ──
                const classroomKesTotal = classroomsKes.reduce((a, r) => a + (r.prev_total_classroom_inventory ?? 0), 0);
                const classroomJhsTotal = classroomsJhs.reduce((a, r) => a + (r.total_classroom ?? 0), 0);
                const classroomShsTotal = classroomsShs.reduce((a, r) => a + (r.total_classroom ?? 0), 0);

                const classroomKesNeeds = classroomsKes.reduce(
                    (a, r) => a + (r.kinder_needs ?? 0) + (r.g1g6_needs ?? 0) + (r.sned_needs ?? 0),
                    0
                );
                const classroomJhsNeeds = classroomsJhs.reduce((a, r) => a + (r.classroom_needs ?? 0), 0);
                const classroomShsNeeds = classroomsShs.reduce((a, r) => a + (r.classroom_needs ?? 0), 0);

                const classroomKesExcess = classroomsKes.reduce(
                    (a, r) => a + (r.kinder_excess ?? 0) + (r.g1g6_excess ?? 0) + (r.sned_excess ?? 0),
                    0
                );
                const classroomJhsExcess = classroomsJhs.reduce((a, r) => a + (r.classroom_excess ?? 0), 0);
                const classroomShsExcess = classroomsShs.reduce((a, r) => a + (r.classroom_excess ?? 0), 0);

                const classroomsByLevel = [
                    { level: "Elementary (KES)", total: classroomKesTotal, needs: classroomKesNeeds, excess: classroomKesExcess },
                    { level: "Junior High", total: classroomJhsTotal, needs: classroomJhsNeeds, excess: classroomJhsExcess },
                    { level: "Senior High", total: classroomShsTotal, needs: classroomShsNeeds, excess: classroomShsExcess },
                ];

                const totalClassrooms = classroomKesTotal + classroomJhsTotal + classroomShsTotal;
                const totalClassroomNeeds = classroomKesNeeds + classroomJhsNeeds + classroomShsNeeds;

                setStats({
                    loading: false,
                    error: null,
                    schoolYear: selectedYear,
                    learners: {
                        total: publicTotal + privateTotal,
                        public: publicTotal,
                        private: privateTotal,
                        byLevel,
                        elemByGrade,
                        overallDropout,
                        dropoutByLevel,
                        promotionByLevel,
                        cohortSurvival,
                    },
                    schools: {
                        total: uniqueSchools.size,
                        public: publicSchools,
                        private: privateSchools,
                        schoolList,
                    },
                    teachers: {
                        total: totalTeachers,
                        totalNeeds: totalTeacherNeeds,
                        byLevel: teachersByLevel,
                    },
                    classrooms: {
                        total: totalClassrooms,
                        totalNeeds: totalClassroomNeeds,
                        byLevel: classroomsByLevel,
                    },
                });
            } catch (err) {
                console.error("Error fetching landing stats:", err);
                if (!cancelled) {
                    setStats((prev) => ({ ...prev, loading: false, isFetching: false, error: err.message }));
                }
            }
        }

        fetchStats();
        return () => { cancelled = true; };
    }, [selectedYear]);

    return stats;
}
