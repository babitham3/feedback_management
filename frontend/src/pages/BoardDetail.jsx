// src/pages/BoardDetail.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackItem from "../components/FeedbackItem";

export default function BoardDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [board, setBoard] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [msg, setMsg] = useState("");
  const [membershipStatus, setMembershipStatus] = useState(null);

  useEffect(() => {
    api.get(`/board/${id}/`).then(res => {
      setBoard(res.data);
      const isMember = checkIsMember(res.data);
      if (isMember) setMembershipStatus("member");
    }).catch(() => setBoard(null));

    loadFeedbacks();
  }, [id]);

  function checkIsMember(boardObj) {
    if (!boardObj || !user) return false;
    const members = boardObj.members || [];
    return members.some(m => (typeof m === "object" ? m.id === user.id : m === user.id)) ||
           (boardObj.created_by && boardObj.created_by.id === user.id);
  }

  const loadFeedbacks = async () => {
    try {
      const res = await api.get(`/feedback/?board=${id}`);
      setFeedbacks(res.data);
    } catch (err) {
      setFeedbacks([]);
    }
  };

  const onFeedbackCreated = (newFeedback) => {
    // put newest on top
    setFeedbacks(prev => [newFeedback, ...prev]);
  };

  const onFeedbackUpdated = (payload) => {
    // payload might contain id/upvotes_count/upvoted
    if (!payload || !payload.id) return;
    setFeedbacks(prev => prev.map(f => f.id === payload.id ? { ...f, upvotes_count: payload.upvotes_count } : f));
  };

  const requestMembership = async () => {
    if (!user) return alert("Please login to request membership.");
    try {
      await api.post(`/board/${id}/request_membership/`, { message: msg });
      setMembershipStatus("pending");
      alert("Membership requested. Admin will review.");
    } catch (err) {
      alert(err.response?.data?.detail || "Error requesting membership");
      setMembershipStatus("error");
    }
  };

  if (!board) return <div>Loading...</div>;

  const isMember = checkIsMember(board);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">{board.name}</h2>
      <p className="mb-2">{board.description}</p>
      <p className="text-sm mb-4">Visibility: {board.is_public ? "Public" : "Private"}</p>

      {membershipStatus === "member" && <div className="p-2 mb-3 bg-green-50 text-green-800 rounded">You are a member of this board.</div>}
      {membershipStatus === "pending" && <div className="p-2 mb-3 bg-yellow-50 text-yellow-800 rounded">Membership request pending.</div>}

      {!isMember && user && board.is_public && (
        <div className="mb-4">
          <label className="block mb-1 font-medium">Request membership</label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} className="w-full p-2 border rounded mb-2" rows={3} />
          <button onClick={requestMembership} className="bg-blue-600 text-white px-4 py-2 rounded">Request to join</button>
        </div>
      )}

      {/* Show form to create feedback only if user is member (or board is public and member requirement applied) */}
      {isMember && <FeedbackForm boardId={board.id} onCreated={onFeedbackCreated} />}

      <hr className="my-4" />

      <h3 className="text-xl mb-3">Feedback</h3>
      {feedbacks.length === 0 ? (
        <p>No feedback visible</p>
      ) : (
        feedbacks.map(f => (
          <FeedbackItem key={f.id} feedback={f} onUpdated={onFeedbackUpdated} />
        ))
      )}
    </div>
  );
}
