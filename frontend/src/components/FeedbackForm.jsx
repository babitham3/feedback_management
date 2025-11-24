// src/components/FeedbackForm.jsx
import React, { useState } from "react";
import api from "../api/api";

export default function FeedbackForm({ boardId, onCreated }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Title is required");
    setLoading(true);
    try {
      const res = await api.post("/feedback/", { board: boardId, title, body });
      setTitle(""); setBody("");
      onCreated && onCreated(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || "Failed to create feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 border p-4 rounded bg-white">
      <h4 className="font-semibold mb-2">Create feedback</h4>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Short title"
        className="w-full p-2 border rounded mb-2"
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Describe the feedback"
        className="w-full p-2 border rounded mb-2"
        rows={4}
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? "Posting..." : "Post feedback"}
      </button>
    </form>
  );
}
