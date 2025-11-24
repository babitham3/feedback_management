// src/components/BoardInvites.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

export default function BoardInvites({ boardId }) {
  const { user } = useContext(AuthContext);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [maxUses, setMaxUses] = useState(1);

  const canManage = user && (userHasRole(user, "Admin") || userHasRole(user, "Moderator") || user.id === (user?.id)); // keep simple - BoardDetail will gate component visibility

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/board/${boardId}/invites/`)
      .then(res => { if (!alive) return; setInvites(Array.isArray(res.data) ? res.data : [res.data]); })
      .catch(() => setInvites([]))
      .finally(() => { if(alive) setLoading(false); });
    return () => { alive = false; };
  }, [boardId]);

  const createInvite = async (e) => {
    e.preventDefault();
    try {
      const payload = { note: note || "", max_uses: maxUses ? Number(maxUses) : null };
      const res = await api.post(`/board/${boardId}/invites/`, payload);
      // backend might return single invite object; refresh list
      setInvites(prev => [res.data, ...(prev || [])]);
      setNote("");
      alert("Invite created. Token: " + (res.data.token || res.data.code || "(check response)"));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create invite");
    }
  };

  if (!canManage) return <div>You don't have permission to manage invites.</div>;

  return (
    <div className="border p-3 rounded bg-white mb-4">
      <h4 className="font-semibold mb-2">Board Invites</h4>

      <form onSubmit={createInvite} className="mb-3">
        <div className="mb-2">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" className="w-full p-2 border rounded" />
        </div>
        <div className="mb-2 flex gap-2 items-center">
          <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} className="w-24 p-2 border rounded" />
          <span className="text-sm text-gray-600">max uses (leave 0 for unlimited)</span>
        </div>
        <button className="bg-green-600 text-white px-3 py-1 rounded">Create invite</button>
      </form>

      <div>
        <h5 className="font-medium mb-2">Active invites</h5>
        {loading ? <div>Loading invites...</div> :
          invites.length === 0 ? <div className="text-sm text-gray-500">No invites</div> :
          invites.map(inv => (
            <div key={inv.id ?? inv.token ?? Math.random()} className="p-2 mb-2 border rounded">
              <div className="text-sm"><strong>Token:</strong> {inv.token ?? inv.code ?? '(no token in response)'}</div>
              <div className="text-xs text-gray-600">Note: {inv.note || '-'}</div>
              <div className="text-xs text-gray-600">Uses: {inv.uses ?? 0} / {inv.max_uses ?? 'unlimited'}</div>
              <div className="text-xs text-gray-600">Expires: {inv.expires_at ?? 'never'}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
