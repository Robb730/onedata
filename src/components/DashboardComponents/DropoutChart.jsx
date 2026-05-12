import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
};

/**
 * DropoutChart — Line chart showing dropout rate trends over school years.
 *
 * @param {Array}  data  — [{ year, overall, elementary, jhs, shs }]
 * @param {string} [title]
 */
export function DropoutChart({ data = [], title = "Overall Dropout Rate Trend" }) {
  return (
    <ChartContainer title={title} minHeight="240px">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="overall"
            name="Overall"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="elementary"
            name="Elementary"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="jhs"
            name="JHS"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
