// src/pages/AdminRequests.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

export default function AdminRequests(){
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const load = async () => {
    try {
      const res = await api.get("/board-membership-requests/?status=pending");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setRequests([]);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      // PATCH the request object
      await api.patch(`/board-membership-requests/${id}/`, { status });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed");
    }
  };

  if (!user) return <div>Please login as admin to view.</div>;

  return (
    <div>
      <h2 className="text-2xl mb-4">Pending Membership Requests</h2>
      {requests.length === 0 ? <p>No pending requests</p> : requests.map(r => (
        <div key={r.id} className="border p-3 mb-3 rounded">
          <div className="mb-2"><strong>Board:</strong> {r.board?.name || r.board}</div>
          <div className="mb-2"><strong>User:</strong> {r.user?.username || r.user}</div>
          <div className="mb-2"><strong>Message:</strong> {r.message}</div>
          <div className="flex gap-2">
            <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => updateStatus(r.id, "approved")}>Approve</button>
            <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => updateStatus(r.id, "rejected")}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}