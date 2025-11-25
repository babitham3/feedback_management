// src/components/dashboard/SummaryCards.jsx
import React from "react";

function Card({ title, value, hint }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value ?? "—"}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

export default function SummaryCards({ data, loading }) {
  if (!data && loading) return <div className="p-4">Loading summary…</div>;
  if (!data) return <div className="p-4">No summary data</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card title="Total feedback" value={data.total} />
      <Card title="Open" value={data.open} />
      <Card title="In progress" value={data.in_progress} />
      <Card title="Completed" value={data.completed} />
    </div>
  );
}