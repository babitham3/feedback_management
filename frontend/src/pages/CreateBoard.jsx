// src/pages/CreateBoard.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

export default function CreateBoard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  // guard: only admins allowed on frontend (server still authoritative)
  if (!user || !userHasRole(user, "Admin")) {
    return <div className="p-4">You don't have permission to create boards.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Name is required");
    setLoading(true);
    try {
      const res = await api.post("/board/", { name, description, is_public: isPublic });
      alert("Board created");
      // navigate to board detail
      navigate(`/boards/${res.data.id}`);
    } catch (err) {
      console.error("Create board failed", err);
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Create Board</h2>

      <form onSubmit={handleSubmit} className="border rounded p-4 bg-white">
        <div className="mb-3">
          <label className="block mb-1 font-medium">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" placeholder="Board name" />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded" rows={4} placeholder="Optional description" />
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input id="is_public" type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
          <label htmlFor="is_public">Public board</label>
        </div>

        <div className="flex gap-2">
          <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
            {loading ? "Creating..." : "Create board"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
