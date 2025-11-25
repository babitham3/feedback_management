// src/components/dashboard/TopVoted.jsx
import React from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function TopVoted({ items = [], loading }) {
  const navigate = useNavigate();
  if (loading) return <div className="bg-white p-4 rounded shadow">Loading top items…</div>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Top voted</h3>
      {items.length === 0 && <div className="text-sm text-gray-500">No items</div>}
      <ul className="space-y-3">
        {items.map(it => (
          <li key={it.id} className="border rounded p-2 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/feedback/${it.id}`)}>
            <div className="font-semibold">{it.title}</div>
            <div className="text-xs text-gray-500">{it.upvotes} ▲ • {it.status} • {it.board_name || `Board ${it.board_id}`}</div>
            <div className="text-sm text-gray-700 mt-1">{it.title && it.title.length > 140 ? it.title.slice(0, 140) + "…" : ""}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}