// src/components/dashboard/FiltersBar.jsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "../../api/api";

export default function FiltersBar({ filters, setFilters }) {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    let alive = true;
    api.get("/board/").then(r => { if (alive) setBoards(r.data || []); }).catch(() => { if (alive) setBoards([]); });
    return () => { alive = false; };
  }, []);

  const onChange = (patch) => setFilters(prev => ({ ...prev, ...patch }));

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Board</label>
          <select value={filters.board ?? ""} onChange={e => onChange({ board: e.target.value || null })}
            className="mt-1 block w-full border p-2 rounded">
            <option value="">All boards</option>
            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">From</label>
          <input type="date" value={filters.from ?? ""} onChange={e => onChange({ from: e.target.value || null })}
            className="mt-1 block w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">To</label>
          <input type="date" value={filters.to ?? ""} onChange={e => onChange({ to: e.target.value || null })}
            className="mt-1 block w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Granularity</label>
          <select value={filters.granularity} onChange={e => onChange({ granularity: e.target.value })}
            className="mt-1 block w-full border p-2 rounded">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Distribution by</label>
          <select value={filters.by} onChange={e => onChange({ by: e.target.value })} className="mt-1 block border p-2 rounded">
            <option value="status">Status</option>
            <option value="board">Board</option>
            <option value="tag">Tag</option>
          </select>
        </div>

        <div className="flex items-end gap-2 ml-auto">
          <button onClick={() => setFilters({ board: null, from: null, to: null, granularity: "daily", by: "status" })}
            className="px-3 py-2 border rounded">Reset</button>
        </div>
      </div>
    </div>
  );
}