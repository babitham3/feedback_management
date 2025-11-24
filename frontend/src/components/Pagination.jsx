import React from "react";

export default function Pagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = [];
  // keep it small if many pages
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) pages.push(1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) pages.push(totalPages);

  return (
    <div className="flex items-center gap-2 mt-4">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-2 py-1 border rounded">Prev</button>
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)} className={`px-2 py-1 rounded ${p === page ? "bg-gray-800 text-white" : "border"}`}>{p}</button>
      ))}
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="px-2 py-1 border rounded">Next</button>
    </div>
  );
}
