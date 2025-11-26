import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

export default function BoardMembershipRequests({ boardId, boardOwnerId = null }) {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only Admin / Moderator / board owner can manage requests
  const canManage =
    user &&
    (userHasRole(user, "Admin") ||
      userHasRole(user, "Moderator") ||
      (boardOwnerId != null && user.id === boardOwnerId));

  useEffect(() => {
    if (!boardId) return;
    let alive = true;
    setLoading(true);
    api
      .get(`/board-membership-requests/?board=${boardId}&status=pending`)
      .then((res) => {
        if (!alive) return;
        // DRF might return paginated or bare list; handle both
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setRequests(data);
      })
      .catch((err) => {
        console.error("Failed to load membership requests", err);
        setRequests([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [boardId]);

  // Use the dedicated action endpoints (POST /.../<id>/approve/ or /reject/)
  const updateStatus = async (id, status) => {
    try {
      const endpoint =
        status === "approved"
          ? `/board-membership-requests/${id}/approve/`
          : `/board-membership-requests/${id}/reject/`;
      const res = await api.post(endpoint);

      // remove from local pending list on success
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (typeof onHandled === "function") {
      onHandled();
    }
      if (status === "approved") {
        alert("Approved — user added to the board.");
      } else {
        alert("Rejected.");
      }
    } catch (err) {
      console.error("Membership update failed", err);
      alert(err?.response?.data?.detail || "Failed to update request");
    }
  };

  if (!canManage) return <div>You don't have permission to see membership requests.</div>;

  return (
    <div className="border p-3 rounded bg-white mb-4">
      <h4 className="font-semibold mb-2">Membership requests (pending)</h4>
      {loading ? (
        <div>Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-sm text-gray-500">No pending requests</div>
      ) : (
        requests.map((r) => (
          <div key={r.id} className="p-2 mb-2 border rounded">
            <div>
              <strong>User:</strong> {r.user?.username || r.user}
            </div>
            <div className="text-sm text-gray-600">Message: {r.message || "-"}</div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => updateStatus(r.id, "approved")}
                className="bg-green-600 text-white px-2 py-1 rounded"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(r.id, "rejected")}
                className="bg-red-600 text-white px-2 py-1 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
