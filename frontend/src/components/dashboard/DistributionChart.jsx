// src/components/dashboard/DistributionChart.jsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function DistributionChart({ data = [], by = "status", loading }) {
  if (loading) return <div className="bg-white p-4 rounded shadow">Loading distribution…</div>;

  if (!data || data.length === 0) return <div className="bg-white p-4 rounded shadow">No distribution data</div>;

  // If many keys, show bar chart; for few keys, show pie.
  if (data.length > 6) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Distribution by {by}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="key" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Distribution by {by}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="key" cx="50%" cy="50%" outerRadius={100} label>
            {data.map((entry, idx) => <Cell key={entry.key} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}