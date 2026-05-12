import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i}>
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
};

/**
 * PromotionChart — Horizontal bar chart showing promotion rates by level.
 *
 * @param {Array} data — [{ level, rate }]
 */
export function PromotionChart({ data = [] }) {
  const color = "#10b981";

  return (
    <ChartContainer title="Promotion Rates by Level" minHeight="220px">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            domain={[90, 100]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="level"
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.04)" }} />
          <Bar dataKey="rate" name="Promotion Rate" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={0.75 + i * 0.05} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
