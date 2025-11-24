// src/pages/Boards.jsx
import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

export default function Boards() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/board/");
      setBoards(res.data);
    } catch (err) {
      console.error("Failed to load boards", err);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  const canCreate = user && userHasRole(user, "Admin");
  const canDelete = (u, board) => user && userHasRole(user, "Admin");

  const handleDelete = async (b) => {
    if (!confirm(`Delete board "${b.name}"? This will remove all content.`)) return;
    try {
      await api.delete(`/board/${b.id}/`);
      setBoards(prev => prev.filter(x => x.id !== b.id));
      alert("Board deleted");
    } catch (err) {
      console.error("Delete failed", err);
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Boards</h1>

        {canCreate ? (
          <button onClick={() => navigate("/boards/create")} className="bg-blue-600 text-white px-3 py-1 rounded">
            Create board
          </button>
        ) : null}
      </div>

      {loading ? (
        <div>Loading boards...</div>
      ) : (
        <div>
          {boards.length === 0 ? <p>No boards yet</p> : (
            boards.map(b => (
              <div key={b.id} className="border p-3 mb-3 rounded bg-white flex justify-between items-start">
                <div>
                  <Link to={`/boards/${b.id}`} className="text-lg font-semibold">{b.name}</Link>
                  <p className="text-sm text-gray-700">{b.description}</p>
                  <div className="text-xs text-gray-500 mt-1">{b.is_public ? "Public" : "Private"}</div>
                </div>
                <div className="flex flex-col items-end">
                  { canDelete(user, b) && (
                    <button onClick={() => handleDelete(b)} className="text-sm text-red-600">Delete</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}