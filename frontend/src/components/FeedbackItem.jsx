// src/components/FeedbackItem.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api/api";
import Comments from "./Comments";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function FeedbackItem({ feedback, onUpdated }) {
  const { user } = useContext(AuthContext);
  // feedback: { id, title, body, status, upvotes_count }
  const [upvotes, setUpvotes] = useState(feedback.upvotes_count ?? 0);
  const [upvoted, setUpvoted] = useState(false); // we don't get initial flag; assume false
  const [loadingUpvote, setLoadingUpvote] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [status, setStatus] = useState(feedback.status);
  const [changingStatus, setChangingStatus] = useState(false);
  

  // toggle upvote
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