// src/components/BoardMembershipRequests.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

export default function BoardMembershipRequests({ boardId }) {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const canManage = user && (userHasRole(user, "Admin") || userHasRole(user, "Moderator") || (user && user.id === user.id)); // will be gated in parent

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/board-membership-requests/?board=${boardId}&status=pending`)
      .then(res => { if(!alive) return; setRequests(res.data || []); })
      .catch(() => setRequests([]))
      .finally(() => { if(alive) setLoading(false); });
    return () => { alive = false; };
  }, [boardId]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/board-membership-requests/${id}/`, { status });
      setRequests(prev => prev.filter(r => r.id !== id));
      alert(`Request ${status}`);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed");
    }
  };

  if (!canManage) return <div>You don't have permission to see membership requests.</div>;

  return (
    <div className="border p-3 rounded bg-white mb-4">
      <h4 className="font-semibold mb-2">Membership requests (pending)</h4>
      {loading ? <div>Loading...</div> :
        requests.length === 0 ? <div className="text-sm text-gray-500">No pending requests</div> :
        requests.map(r => (
          <div key={r.id} className="p-2 mb-2 border rounded">
            <div><strong>User:</strong> {r.user?.username || r.user}</div>
            <div className="text-sm text-gray-600">Message: {r.message || '-'}</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => updateStatus(r.id, "approved")} className="bg-green-600 text-white px-2 py-1 rounded">Approve</button>
              <button onClick={() => updateStatus(r.id, "rejected")} className="bg-red-600 text-white px-2 py-1 rounded">Reject</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}
