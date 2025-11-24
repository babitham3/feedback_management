// src/components/Comments.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

export default function Comments({ feedbackId }) {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/comment/?feedback=${feedbackId}`);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  useEffect(() => { load(); }, [feedbackId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Login to comment");
    if (!body.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/comment/", { feedback: feedbackId, body });
      setBody("");
      setComments(c => [res.data, ...c]);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (c) => {
    const newBody = prompt("Edit comment", c.body);
    if (newBody === null) return;
    try {
      await api.patch(`/comment/${c.id}/`, { body: newBody });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const handleDelete = async (c) => {
    if (!confirm("Delete comment?")) return;
    try {
      await api.delete(`/comment/${c.id}/`);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="border-t pt-3">
      <form onSubmit={submit} className="mb-3">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={user ? "Write a comment..." : "Login to comment"}
          className="w-full p-2 border rounded mb-2"
          rows={3}
          disabled={!user}
        />
        <div className="flex justify-end">
          <button className="bg-blue-600 text-white px-3 py-1 rounded" disabled={loading || !user}>
            {loading ? "Posting..." : "Post comment"}
          </button>
        </div>
      </form>

      <div>
        {comments.length === 0 ? <p className="text-sm text-gray-500">No comments yet</p> :
          comments.map(c => {
            const canManage = user && (userHasRole(user, "Admin") || userHasRole(user, "Moderator"));
            const isAuthor = user && (user.id === (c.created_by?.id ?? c.created_by));
            return (
              <div key={c.id} className="border p-2 rounded mb-2">
                <div className="text-sm text-gray-700">{c.body}</div>
                <div className="text-xs text-gray-500 mt-1">By: {c.created_by?.username || c.created_by}</div>
                <div className="mt-2">
                  { (isAuthor || canManage) && (
                    <>
                      <button onClick={() => handleEdit(c)} className="mr-2 text-sm text-blue-600">Edit</button>
                      <button onClick={() => handleDelete(c)} className="text-sm text-red-600">Delete</button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}