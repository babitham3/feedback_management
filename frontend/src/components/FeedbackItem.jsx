// src/components/FeedbackItem.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api/api";
import Comments from "./Comments";
import { userHasRole } from "../utils/roles";

export default function FeedbackItem({ feedback, onUpdated }) {
  const { user } = useContext(AuthContext);
  const [upvotes, setUpvotes] = useState(feedback.upvotes_count ?? 0);
  const [upvoted, setUpvoted] = useState(false);
  const [loadingUpvote, setLoadingUpvote] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);

  const authorId = feedback.created_by?.id ?? feedback.created_by;

  const canManage = user && (userHasRole(user, "Admin") || userHasRole(user, "Moderator"));
  const isAuthor = user && (user.id === authorId);

  const toggleUpvote = async () => {
    if (!user) return alert("Please login to upvote");
    setLoadingUpvote(true);
    try {
      const res = await api.post(`/feedback/${feedback.id}/upvote/`);
      setUpvoted(res.data.upvoted);
      setUpvotes(res.data.upvotes_count);
      onUpdated && onUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Upvote failed");
    } finally {
      setLoadingUpvote(false);
    }
  };

  const handleEdit = async () => {
    const newTitle = prompt("Edit title", feedback.title);
    if (newTitle === null) return;
    const newBody = prompt("Edit body", feedback.body);
    if (newBody === null) return;
    try {
      const res = await api.patch(`/feedback/${feedback.id}/`, { title: newTitle, body: newBody });
      onUpdated && onUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this feedback?")) return;
    try {
      await api.delete(`/feedback/${feedback.id}/`);
      onUpdated && onUpdated({ id: feedback.id, deleted: true });
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const res = await api.post(`/feedback/${feedback.id}/set_status/`, { status: newStatus });
      onUpdated && onUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Status update failed");
    }
  };

  return (
    <div className="border p-3 rounded mb-3 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{feedback.title}</h4>
          <p className="text-sm text-gray-700">{feedback.body}</p>
          <div className="text-xs text-gray-500 mt-2">Status: {feedback.status}</div>
        </div>

        <div className="flex flex-col items-end">
          <button
            onClick={toggleUpvote}
            className={`px-3 py-1 rounded ${upvoted ? "bg-green-600 text-white" : "bg-gray-100"}`}
            disabled={loadingUpvote}
          >
            {upvotes} ▲
          </button>

          <div className="mt-2">
            { (isAuthor || canManage) && (
              <>
                <button onClick={handleEdit} className="mr-2 text-sm text-blue-600">Edit</button>
                <button onClick={handleDelete} className="text-sm text-red-600">Delete</button>
              </>
            )}
          </div>

          { canManage && (
            <div className="mt-3">
              <select value={feedback.status} onChange={handleStatusChange} className="text-sm border rounded px-2 py-1">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          <button
            className="mt-2 text-sm text-blue-600"
            onClick={() => setShowComments(s => !s)}
          >
            {showComments ? "Hide comments" : "Comments"}
          </button>
        </div>
      </div>

      {showComments && (
        <div className="mt-3">
          <Comments feedbackId={feedback.id} />
        </div>
      )}
    </div>
  );
}