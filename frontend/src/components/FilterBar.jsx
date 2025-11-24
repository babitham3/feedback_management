import React, { useState } from "react";

export default function FilterBar({ onFilter, defaultStatus = "" }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [ordering, setOrdering] = useState("-created_at");

  const apply = (e) => {
    e && e.preventDefault();
    onFilter({ search: search.trim(), status, ordering });
  };

  return (
    <form className="flex flex-wrap gap-2 items-center mb-3" onSubmit={apply}>
      <input
        className="p-2 border rounded w-64"
        placeholder="Search title or body..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 border rounded">
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="p-2 border rounded">
        <option value="-created_at">Newest</option>
        <option value="created_at">Oldest</option>
        <option value="-upvotes_count">Most upvotes</option>
      </select>

      <button className="px-3 py-2 bg-blue-600 text-white rounded">Apply</button>
      <button
        type="button"
        className="px-3 py-2 border rounded"
        onClick={() => { setSearch(""); setStatus(""); setOrdering("-created_at"); onFilter({}); }}
      >
        Reset
      </button>
    </form>
  );
}
