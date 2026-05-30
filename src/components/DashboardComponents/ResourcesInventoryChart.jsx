import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-xl min-w-[140px]">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 leading-relaxed">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          {p.name}:{" "}
          <strong className="ml-auto pl-2">{Number(p.value).toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

const LEVEL_COLORS = {
  inventory: "#4f7df5",
  needs:     "#f43f5e",
};

/**
 * ResourcesInventoryChart — Grouped bar chart comparing inventory vs needs
 * across school levels (Elementary, JHS, SHS).
 *
 * @param {string} title
 * @param {{ level, inventory, needs }[]} data
 */
export function ResourcesInventoryChart({ title = "Inventory vs. Needs", data = [] }) {
  const hasData = data.some((d) => d.inventory > 0 || d.needs > 0);

  return (
    <ChartContainer title={title} subtitle="By education level" minHeight="220px">
      {!hasData ? (
        <div className="flex items-center justify-center h-[220px] text-slate-400 text-[0.78rem]">
          No data uploaded yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={4} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="level"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(79,125,245,0.04)" }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "0.68rem", paddingTop: "12px" }}
            />
            <Bar dataKey="inventory" name="Current Inventory" radius={[5, 5, 0, 0]} maxBarSize={32} fill={LEVEL_COLORS.inventory} fillOpacity={0.85} />
            <Bar dataKey="needs"     name="Needs / Shortage"  radius={[5, 5, 0, 0]} maxBarSize={32} fill={LEVEL_COLORS.needs}     fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}
