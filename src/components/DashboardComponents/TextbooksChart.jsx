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
        <p key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          {p.name}: <strong className="ml-auto pl-2">{Number(p.value).toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

const LEVEL_COLORS = ["#f97316", "#d946ef", "#06b6d4"];

/**
 * TextbooksChart — Bar chart showing textbook shortage by school level.
 *
 * @param {{ level, shortage }[]} data
 */
export function TextbooksChart({ data = [] }) {
  const hasData = data.some((d) => d.shortage > 0);

  return (
    <ChartContainer title="Textbooks Shortage" subtitle="By education level" minHeight="220px">
      {!hasData ? (
        <div className="flex items-center justify-center h-[220px] text-slate-400 text-[0.78rem]">
          No data uploaded yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="40%">
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(249,115,22,0.05)" }} />
            <Bar dataKey="shortage" name="Shortage" radius={[5, 5, 0, 0]} maxBarSize={44}>
              {data.map((_, i) => (
                <Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}
