// src/pages/BoardDetail.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackItem from "../components/FeedbackItem";
import { userHasRole } from "../utils/roles";
import FeedbackTable from "../components/FeedbackTable";
import BoardMembershipRequests from "../components/BoardMembershipRequests";
import { set } from "date-fns";

export default function BoardDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [msg, setMsg] = useState("");
  const [membershipStatus, setMembershipStatus] = useState(null);

  const loadBoard = async () => {
    try{
      const res = await api.get(`/board/${id}/`);
      setBoard(res.data);
      const isMember = checkIsMember(res.data);
      setMembershipStatus(isMember ? "member" : null);
    }catch(err){
      setBoard(null);
    }
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    // fetch board
    loadBoard();
    // fetch feedbacks
    api.get(`/feedback/?board=${id}`)
      .then(res => {
        if (!alive) return;
        setFeedbacks(res.data || []);
      })
      .catch(() => {
        if (!alive) return;
        setFeedbacks([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [id, user]);

  function checkIsMember(boardObj) {
    try {
      if (!boardObj || !user) return false;
      const members = boardObj.members || [];
      // members may be list of ids or objects
      return members.some(m => {
        if (m == null) return false;
        if (typeof m === "object") return m.id === user.id;
        return m === user.id;
      }) || (boardObj.created_by && (boardObj.created_by.id === user.id || boardObj.created_by === user.id));
    } catch (e) {
      return false;
    }
  }

  const loadFeedbacks = async () => {
    try {
      const res = await api.get(`/feedback/?board=${id}`);
      setFeedbacks(res.data || []);
    } catch (err) {
      setFeedbacks([]);
    }
  };

  const onFeedbackCreated = (newFeedback) => {
    setFeedbacks(prev => [newFeedback, ...(prev || [])]);
  };

  const onFeedbackUpdated = (payload) => {
    if (!payload) return;
    if (payload.deleted) {
      setFeedbacks(prev => (prev || []).filter(f => f.id !== payload.id));
      return;
    }
    setFeedbacks(prev => (prev || []).map(f => (f.id === payload.id ? { ...f, ...payload } : f)));
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

  const handleEditBoard = async () => {
    if (!user) return alert("Login to edit");
    const canEdit = userHasRole(user, "Admin") || userHasRole(user, "Moderator") || (board?.created_by && (board.created_by.id === user.id || board.created_by === user.id));
    if (!canEdit) return alert("You don't have permission to edit this board.");

    const newDesc = prompt("New description", board?.description ?? "");
    if (newDesc === null) return;

    try {
      const res = await api.patch(`/board/${board.id}/`, { description: newDesc });
      setBoard(res.data);
      alert("Board updated");
    } catch (err) {
      console.error("Edit board failed", err);
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const navigate = useNavigate();

  if (loading) return <div>Loading...</div>;
  if (!board) return <div className="p-4">Board not found or you don't have access.</div>;

  const isMember = checkIsMember(board);
  const canCreateFeedback = isMember || (user && (userHasRole(user, "Admin") || userHasRole(user, "Moderator")));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold mb-2">{board?.name ?? "Board"}</h2>
        { user && (userHasRole(user,"Admin") || userHasRole(user,"Moderator") || (board.created_by && board.created_by.id === user.id)) && (
        <div className="flex gap-2 items-center">
            <button onClick={handleEditBoard} className="px-2 py-1 bg-gray-200 rounded">Edit board</button>

            {/* Dashboard button visible only to Admin/Moderator */}
            {(userHasRole(user, "Admin") || userHasRole(user, "Moderator")) && (
              <button onClick={() => navigate('/dashboard')} className="px-2 py-1 border rounded">
                Open Dashboard
              </button>
            )}

            {/* NEW: separate pages (Table / Kanban) */}
            <button onClick={() => navigate(`/boards/${board.id}/table`)} className="px-2 py-1 border rounded">Open Table View</button>
            <button onClick={() => navigate(`/boards/${board.id}/kanban`)} className="px-2 py-1 border rounded">Open Kanban View</button>

            {/* existing Manage Invites / Requests buttons (if present) */}
            <button onClick={() => navigate(`/boards/${board.id}/invites`)} className="px-2 py-1 border rounded">Manage Invites</button>
            <button onClick={() => navigate(`/boards/${board.id}/requests`)} className="px-2 py-1 border rounded">Requests</button>
        </div>
        )}

      </div>

      <p className="mb-2">{board?.description}</p>
      <p className="text-sm mb-4">Visibility: {board?.is_public ? "Public" : "Private"}</p>

      {membershipStatus === "member" && <div className="p-2 mb-3 bg-green-50 text-green-800 rounded">You are a member of this board.</div>}
      {membershipStatus === "pending" && <div className="p-2 mb-3 bg-yellow-50 text-yellow-800 rounded">Membership request pending.</div>}

      {!isMember && user && board?.is_public && (
        <div className="mb-4">
          <label className="block mb-1 font-medium">Request membership</label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} className="w-full p-2 border rounded mb-2" rows={3} />
          <button onClick={requestMembership} className="bg-blue-600 text-white px-4 py-2 rounded">Request to join</button>
        </div>
      )}

      {!user && board?.is_public && <p className="mb-4">Login to request membership or interact with this board.</p>}
      {!board?.is_public && !isMember && <p className="mb-4">This board is private — ask an admin to invite you.</p>}

      {/* render membership requests only if user can manage */}
      { user && (userHasRole(user,"Admin") || userHasRole(user,"Moderator") || (board.created_by && board.created_by.id === user.id)) && (
        <BoardMembershipRequests
          boardId={board.id}
          boardOwnerId={board?.created_by?.id}
          onHandled={() => {
            // re-fetch board + feedbacks after a request is handled
            loadBoard();
            loadFeedbacks();
          }}
        />
      )}

      {canCreateFeedback && <FeedbackForm boardId={board.id} onCreated={onFeedbackCreated} />}

      <hr className="my-4" />

      <h3 className="text-xl mb-3">Feedback</h3>
      {(!feedbacks || feedbacks.length === 0) ? (
        <p>No feedback visible</p>
      ) : (
        feedbacks.map(f => (
          <FeedbackItem key={f.id} feedback={f} onUpdated={onFeedbackUpdated} />
        ))
      )}
    </div>
  );
}
