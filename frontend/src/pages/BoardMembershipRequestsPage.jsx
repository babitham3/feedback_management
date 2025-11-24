// src/pages/BoardMembershipRequestsPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

export default function BoardMembershipRequestsPage() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/board-membership-requests/?board=${boardId}&status=pending`)
      .then(res => { if(!alive) return; setRequests(res.data || []); })
      .catch(() => setRequests([]))
      .finally(() => { if(alive) setLoading(false); });
    return () => { alive = false; };
  }, [boardId]);

  const canManage = user && (userHasRole(user,"Admin") || userHasRole(user,"Moderator") || (user && user.id === user.id));

  if (!user) return <div className="p-4">Please login to manage membership requests.</div>;
  if (!canManage) return <div className="p-4">You don't have permission to view membership requests for this board.</div>;

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/board-membership-requests/${id}/`, { status });
      setRequests(prev => prev.filter(r => r.id !== id));
      alert(`Request ${status}`);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Membership Requests — Board #{boardId}</h2>
        <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded">Back</button>
      </div>

      <div className="border p-4 rounded bg-white">
        <h3 className="font-semibold mb-3">Pending requests</h3>
        {loading ? <div>Loading...</div> :
          requests.length === 0 ? <div className="text-sm text-gray-500">No pending requests</div> :
          requests.map(r => (
            <div key={r.id} className="p-3 mb-3 border rounded">
              <div className="mb-2"><strong>User:</strong> {r.user?.username || r.user}</div>
              <div className="mb-2 text-sm text-gray-600">Message: {r.message || '-'}</div>
              <div className="flex gap-2">
                <button onClick={() => updateStatus(r.id, "approved")} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                <button onClick={() => updateStatus(r.id, "rejected")} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}