// src/components/dashboard/TrendsChart.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TrendsChart({ data = [], granularity = "daily", loading }) {
  if (loading) return <div className="bg-white p-4 rounded shadow">Loading trends…</div>;

  // data expected: [{ period: '2025-11-01', count: 5 }, ...]
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Submissions — {granularity}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
