import React from "react";
import { useState, useEffect } from "react";
import { Users, TrendingDown, Award, AlertTriangle } from "lucide-react";
import { StatCard } from "./StatCard";
import { supabase } from "../../lib/supabaseClient";

/**
 * DashboardOverview — The top KPI stats row showing
 * Total Enrollment, Overall Dropout, Elem Promotion, JHS Dropout.
 *
 * @param {object} data — { totalEnrollment, overallDropout, elemPromotion, jhsDropout }
 * @param {string} selectedYear — The selected school year for filtering data
 * @param {string} [compareYear] — When set (with compareData), each card renders
 *   its compareData value in orange under the primary value, plus a delta.
 * @param {object} [compareData] — { totalEnrollment, overallDropout, elemPromotion, jhsDropout }
 *   for compareYear, same shape as `data`. Non-numeric strings like "N/A" are handled.
 */
export function DashboardOverview({ data, selectedYear, compareYear, compareData }) {

  const [totalEnrollment, setTotalEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTotalEnrollment() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("enrollment_data")
        .select("grand_total");

      if (selectedYear) {
        query = query.eq("school_year", selectedYear);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const total = data.reduce((acc, row) => acc + (row.grand_total ?? 0), 0);
      setTotalEnrollment(total);
      setLoading(false);
    }

    fetchTotalEnrollment();
  }, [selectedYear]);

  const isComparing = !!(compareYear && compareData);

  // Builds { compareValue, delta, deltaUp } for a StatCard given the
  // primary numeric value and the raw (possibly "N/A") compare value.
  function buildCompare(primaryNum, rawCompare, formatter = (n) => n.toLocaleString()) {
    const secondaryNum =
      typeof rawCompare === "number" ? rawCompare : parseFloat(rawCompare);

    if (rawCompare === undefined || rawCompare === null || Number.isNaN(secondaryNum)) {
      return { compareValue: "N/A", delta: null, deltaUp: true };
    }

    const delta = secondaryNum - (primaryNum || 0);
    return {
      compareValue: formatter(secondaryNum),
      delta: formatter(Math.abs(delta)),
      deltaUp: delta >= 0,
    };
  }

  const enrollmentCompare = isComparing
    ? buildCompare(totalEnrollment ?? 0, compareData.totalEnrollment)
    : {};

  const dropoutCompare = isComparing
    ? buildCompare(parseFloat(data.overallDropout), compareData.overallDropout, (n) => `${n.toFixed(2)}%`)
    : {};

  const promoCompare = isComparing
    ? buildCompare(parseFloat(data.elemPromotion), compareData.elemPromotion, (n) => `${n.toFixed(2)}%`)
    : {};

  const jhsDropoutCompare = isComparing
    ? buildCompare(parseFloat(data.jhsDropout), compareData.jhsDropout, (n) => `${n.toFixed(2)}%`)
    : {};

  const stats = [
    {
      label: "Total Enrollment",
      value: loading ? "—" : error ? "Error" : totalEnrollment?.toLocaleString() ?? "—",
      icon: <Users size={18} />,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
      ...(isComparing ? enrollmentCompare : {}),
    },
    {
      label: "Overall Dropout",
      value: data.overallDropout ?? "—",
      icon: <TrendingDown size={18} />,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50",
      gradient: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
      ...(isComparing ? dropoutCompare : {}),
    },
    {
      label: "Elem Promotion",
      value: data.elemPromotion ?? "—",
      icon: <Award size={18} />,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
      ...(isComparing ? promoCompare : {}),
    },
    {
      label: "JHS Dropout",
      value: data.jhsDropout ?? "—",
      icon: <AlertTriangle size={18} />,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
      ...(isComparing ? jhsDropoutCompare : {}),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}