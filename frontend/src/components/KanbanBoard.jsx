// src/components/KanbanBoard.jsx
import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
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

/* Column component: droppable area with id `col_<statusKey>` */
function Column({ statusKey, title, items }) {
  const { setNodeRef } = useDroppable({ id: `col_${statusKey}` });

  return (
    <div ref={setNodeRef} className="bg-gray-50 p-3 rounded min-h-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">{title}</h4>
        <span className="text-xs text-gray-600">{(items || []).length}</span>
      </div>

      <SortableContext items={(items || []).map(i => `${statusKey}_${i.id}`)} strategy={rectSortingStrategy}>
        <div>
          {(items || []).map(item => (
            <SortableItem key={`${statusKey}_${item.id}`} id={`${statusKey}_${item.id}`}>
              <FeedbackCard item={item} />
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({ boardId, onUpdated }) {
  const { user } = useContext(AuthContext);
  const [columns, setColumns] = useState({ open: [], in_progress: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/feedback/", { params: { board: boardId, page_size: 1000 } });
      const items = res.data.results ?? res.data ?? [];
      const grouped = { open: [], in_progress: [], completed: [] };
      (items || []).forEach(i => {
        const key = normalizeStatus(i.status || "open");
        grouped[key] = grouped[key] || [];
        grouped[key].push(i);
      });
      setColumns(grouped);
    } catch (err) {
      console.error("Kanban load error", err);
      setColumns({ open: [], in_progress: [], completed: [] });
      setError("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => { loadAll(); }, [boardId, loadAll]);

  const sensors = useSensors(useSensor(PointerSensor));
  const canChangeStatus = user && (userHasRole(user, "Admin") || userHasRole(user, "Moderator"));

  // Normalize possible variants to canonical keys used by backend
  function normalizeStatus(raw) {
    if (!raw) return "open";
    const s = String(raw).trim().toLowerCase();
    if (s === "progress" || s === "inprogress") return "in_progress";
    if (s === "done" || s === "closed") return "completed";
    if (s === "in_progress" || s === "completed" || s === "open") return s;
    // fallback: if it contains 'progress'
    if (s.includes("progress")) return "in_progress";
    if (s.includes("complete")) return "completed";
    return "open";
  }

  // parse sortable id like "in_progress_123" or "open_45"
  function parseSortableId(id) {
    if (!id) return [null, null];
    const str = String(id);
    // if id begins with "col_" we return status and null id
    if (str.startsWith("col_")) {
      const st = normalizeStatus(str.replace("col_", ""));
      return [st, null];
    }
    const parts = str.split("_");
    if (parts.length < 2) {
      // maybe just numeric id or weird format; try to extract digits
      const digits = (str.match(/\d+/) || [null])[0];
      return [null, digits];
    }
    const statusRaw = parts[0];
    const itemId = parts.slice(1).join("_");
    const status = normalizeStatus(statusRaw);
    return [status, itemId];
  }

  // extract numeric id from string defensively
  function extractNumericId(idStr) {
    if (!idStr) return null;
    const m = String(idStr).match(/\d+/);
    return m ? m[0] : null;
  }

  /* onDragEnd: handle dropping on items or on column area */
  async function onDragEnd(event) {
    const { active, over } = event;
    if (!active) return;

    // parse source
    const [fromStatus, activeIdRaw] = parseSortableId(active.id);
    const from = fromStatus;
    let rawId = activeIdRaw;

    // if activeIdRaw is null, maybe active.id was like "col_open" which shouldn't happen (can't drag a column)
    if (!rawId) {
      // try to extract any digits from active.id
      rawId = (String(active.id).match(/\d+/) || [null])[0];
    }

    // determine destination (over could be col_<status> or <status>_<id>)
    let to = null;
    if (over) {
      const overStr = String(over.id);
      if (overStr.startsWith("col_")) {
        to = normalizeStatus(overStr.replace("col_", ""));
      } else {
        const [overStatus] = parseSortableId(overStr);
        to = overStatus;
      }
    }

    // defensive checks
    if (!rawId) {
      console.warn("Could not determine dragged item id:", active.id);
      return;
    }
    const numericId = extractNumericId(rawId);
    if (!numericId) {
      console.warn("Could not extract numeric id from:", rawId);
      return;
    }
    if (!from) {
      // try to infer from current columns (if item is in a column)
      let found = null;
      for (const k of Object.keys(columns)) {
        if ((columns[k] || []).some(x => String(x.id) === String(numericId))) {
          found = k; break;
        }
      }
      if (!found) {
        console.warn("Source status unknown and couldn't infer from columns");
        return;
      }
      // set from to found
      // eslint-disable-next-line prefer-destructuring
      // (allow continue)
      // but we keep using 'from' in comparison later
      // so reassign:
      // (note: not mutating outer variable; create localFrom)
    }

    // if drop target not recognized, ignore
    if (!to) {
      console.warn("Drop target not recognized (not a column or item):", over && over.id);
      return;
    }

    // no change
    if (from === to) return;

    if (!canChangeStatus) {
      alert("You do not have permission to change status.");
      return;
    }

    // optimistic move: locate the item in current columns and move it
    let movedItem = null;
    setColumns(prev => {
      const next = { ...prev };
      let foundFrom = from;
      if (!foundFrom) {
        // infer from prev
        for (const k of Object.keys(next)) {
          if ((next[k] || []).some(x => String(x.id) === String(numericId))) { foundFrom = k; break; }
        }
        if (!foundFrom) return prev;
      }
      const fromList = Array.from(next[foundFrom] || []);
      const idx = fromList.findIndex(x => String(x.id) === String(numericId));
      if (idx === -1) return prev;
      movedItem = fromList[idx];
      next[foundFrom] = fromList.filter((_, i) => i !== idx);
      next[to] = [movedItem, ...(next[to] || [])];
      return next;
    });

    // call backend with numeric id and canonical status
    try {
      console.log(`Calling API to set_status for id=${numericId} -> ${to}`);
      const url = `/feedback/${numericId}/set_status/`; // trailing slash is important
      const resp = await api.post(url, { status: to });
      if (onUpdated) onUpdated({ id: Number(numericId), status: to });
      return resp;
    } catch (err) {
      console.error("Status update failed:", err);
      const msg = err?.response?.data?.detail || err.message || "Update failed";
      alert(`Status update failed: ${String(msg)}. Reloading board.`);
      await loadAll(); // rollback by reloading
    }
  }

  if (loading) return <div>Loading kanban…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map(s => (
          <Column key={s.key} statusKey={s.key} title={s.title} items={columns[s.key] || []} />
        ))}
      </div>
    </DndContext>
  );
}