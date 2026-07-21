import React from "react";
import {useState, useEffect} from "react";
import { Users, TrendingDown, Award, AlertTriangle } from "lucide-react";
import { StatCard } from "./StatCard";
import { supabase } from "../../lib/supabaseClient";
import { set } from "date-fns";

/**
 * DashboardOverview — The top KPI stats row showing
 * Total Enrollment, Overall Dropout, Elem Promotion, JHS Dropout.
 *
 * @param {object} data — { totalEnrollment, overallDropout, elemPromotion, jhsDropout }
 */
export function DashboardOverview({ data }) {
  
  const [totalEnrollment, setTotalEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTotalEnrollment() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("enrollment_data")
        .select("grand_total");

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
  }, []);


  const stats = [
    {
      label: "Total Enrollment",
      value: loading ?  "Loading... " : error ? "Error" : totalEnrollment?.toLocaleString() ?? "—",
      icon: <Users size={18} />,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      trend: data.enrollmentTrend,
      trendUp: true,
    },
    {
      label: "Overall Dropout",
      value: data.overallDropout ?? "—",
      icon: <TrendingDown size={18} />,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50",
      trend: data.dropoutTrend,
      trendUp: false,
    },
    {
      label: "Elem Promotion",
      value: data.elemPromotion ?? "—",
      icon: <Award size={18} />,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      trend: data.promotionTrend,
      trendUp: true,
    },
    {
      label: "JHS Dropout",
      value: data.jhsDropout ?? "—",
      icon: <AlertTriangle size={18} />,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      trend: data.jhsDropoutTrend,
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
