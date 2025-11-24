import React, { useEffect, useState, useContext } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useSensors, useSensor, PointerSensor } from "@dnd-kit/core";
import api from "../api/api";
import FeedbackCard from "./FeedbackCard";
import { SortableItem } from "./sortable";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

const STATUSES = [
  { key: "open", title: "Open" },
  { key: "in_progress", title: "In Progress" },
  { key: "completed", title: "Completed" },
];

export default function KanbanBoard({ boardId }) {
  const { user } = useContext(AuthContext);
  const [columns, setColumns] = useState({ open: [], in_progress: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadAll(); }, [boardId]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/feedback/", { params: { board: boardId, page_size: 1000 } });
      const items = res.data.results ?? res.data ?? [];
      const grouped = { open: [], in_progress: [], completed: [] };
      (items || []).forEach(i => {
        const s = i.status || "open";
        grouped[s] = grouped[s] || [];
        grouped[s].push(i);
      });
      setColumns(grouped);
    } catch (err) {
      console.error("Kanban load error", err);
      setColumns({ open: [], in_progress: [], completed: [] });
      setError("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }

  const sensors = useSensors(useSensor(PointerSensor));
  const canChangeStatus = user && (userHasRole(user, "Admin") || userHasRole(user, "Moderator"));

  // IDs will be created as `${status}_${id}` so we can infer old/new status
  function parseSortableId(id) {
    if (!id) return [null, null];
    const parts = String(id).split("_");
    const status = parts[0];
    const itemId = parts.slice(1).join("_");
    return [status, itemId];
  }

  async function onDragEnd(event) {
    const { active, over } = event;
    if (!over || !active) return;

    const [fromStatus, activeId] = parseSortableId(active.id);
    const [toStatus, overId] = parseSortableId(over.id);
    const itemId = activeId || overId;
    if (!itemId) return;

    // same column -> do nothing (we don't persist order)
    if (fromStatus === toStatus) return;

    if (!canChangeStatus) {
      alert("You do not have permission to change status.");
      return;
    }

    // optimistic update: move item locally
    setColumns(prev => {
      const item = (prev[fromStatus] || []).find(x => String(x.id) === String(itemId));
      if (!item) return prev;
      const next = { ...prev, [fromStatus]: prev[fromStatus].filter(x => String(x.id) !== String(itemId)) };
      next[toStatus] = [item, ...(next[toStatus] || [])];
      return next;
    });

    // attempt API call
    try {
      await api.post(`/feedback/${itemId}/set_status/`, { status: toStatus });
      // optionally reload data to get server canonical state
      // await loadAll();
    } catch (err) {
      // rollback by reloading from server
      alert("Status update failed. Reloading board.");
      loadAll();
    }
  }

  if (loading) return <div>Loading kanban…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map(s => (
          <div key={s.key} className="bg-gray-50 p-3 rounded min-h-[200px]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">{s.title}</h4>
              <span className="text-xs text-gray-600">{(columns[s.key] || []).length}</span>
            </div>

            <SortableContext items={(columns[s.key] || []).map(i => `${s.key}_${i.id}`)} strategy={rectSortingStrategy}>
              <div>
                {(columns[s.key] || []).map(item => (
                  <SortableItem key={`${s.key}_${item.id}`} id={`${s.key}_${item.id}`}>
                    <FeedbackCard item={item} />
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
}
