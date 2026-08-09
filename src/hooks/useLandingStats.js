import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export function useLandingStats(selectedYear) {
    const [stats, setStats] = useState({
        loading: true,
        error: null,
        schoolYear: selectedYear,
        learners: { total: 0, public: 0, private: 0, byLevel: [] },
        schools: { total: 0, public: 0, private: 0 },
    });

    useEffect(() => {
        if (!selectedYear) return;
        let cancelled = false;

        async function fetchStats() {
            setStats((prev) => ({ ...prev, loading: true, error: null }));
            try {
                const { data, error } = await supabase
                    .from("enrollment_data")
                    .select(
                        "school_id, school_name, school_type, category, grand_total, elementary_data, junior_high_data, senior_high_s1_data, senior_high_s2_data"
                    )
                    .eq("school_year", selectedYear);

                if (error) throw error;
                if (cancelled) return;

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

                const uniqueSchools = new Map();
                data.forEach((row) => {
                    if (!uniqueSchools.has(row.school_id)) {
                        uniqueSchools.set(row.school_id, row.category);
                    }
                });
                const schoolCategories = [...uniqueSchools.values()];
                const publicSchools = schoolCategories.filter((c) => c === "PUBLIC").length;
                const privateSchools = schoolCategories.filter((c) => c === "PRIVATE").length;

                const schoolList = data.map((row) => ({
                    name: row.school_name,
                    type: row.school_type,
                    category: row.category,
                    enrollment: row.grand_total,
                })).sort((a, b) => b.enrollment - a.enrollment);

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
                    },
                    schools: {
                        total: uniqueSchools.size,
                        public: publicSchools,
                        private: privateSchools,
                        schoolList,
                    },
                });
            } catch (err) {
                console.error("Error fetching landing stats:", err);
                if (!cancelled) {
                    setStats((prev) => ({ ...prev, loading: false, error: err.message }));
                }
            }
        }

        fetchStats();
        return () => { cancelled = true; };
    }, [selectedYear]);

    return stats;
}
