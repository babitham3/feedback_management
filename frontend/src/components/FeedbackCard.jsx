import React from "react";

export default function FeedbackCard({ item, onClick }) {
  return (
    <div
      className="p-3 bg-white rounded shadow mb-2 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick && onClick(); }}
    >
      <div className="font-semibold">{item.title}</div>
      <div className="text-sm text-gray-600 mt-1">{item.body ? item.body.slice(0, 140) : ""}</div>
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <div>By: {item.created_by?.username ?? item.created_by}</div>
        <div>{item.upvotes_count ?? (item.upvotes ? item.upvotes.length : 0)} ▲</div>
      </div>
    </div>
  );
}
