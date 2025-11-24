import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import KanbanBoard from "../components/KanbanBoard";

export default function BoardKanbanPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Kanban — Board #{id}</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded">Back</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <KanbanBoard boardId={id} />
      </div>
    </div>
  );
}
