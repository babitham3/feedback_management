// src/pages/BoardInvitesPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

export default function BoardInvitesPage() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [maxUses, setMaxUses] = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/board/${boardId}/invites/`)
      .then(res => { if (!alive) return; setInvites(Array.isArray(res.data) ? res.data : [res.data]); })
      .catch(() => setInvites([]))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [boardId]);

  const canManage = user && (userHasRole(user, "Admin") || userHasRole(user, "Moderator") || (user && user.id === user.id));

  if (!user) return <div className="p-4">Please login to manage invites.</div>;
  if (!canManage) return <div className="p-4">You don't have permission to manage invites for this board.</div>;

  const createInvite = async (e) => {
    e.preventDefault();
    try {
      const payload = { note: note || "", max_uses: maxUses ? Number(maxUses) : null };
      const res = await api.post(`/board/${boardId}/invites/`, payload);
      setInvites(prev => [res.data, ...(prev || [])]);
      setNote(""); setMaxUses(1);
      alert("Invite created. Token: " + (res.data.token ?? res.data.code ?? "(check response)"));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create invite");
    }
  };

  const revoke = async (inviteId) => {
    // if you implemented a revoke endpoint, call it; else just inform user
    if(!confirm("Revoke invite?")) return;
    try {
      await api.post(`/invites/${inviteId}/revoke/`); // if using named token, adjust
      setInvites(prev => prev.filter(i => i.id !== inviteId && i.token !== inviteId));
      alert("Invite revoked");
    } catch (err) {
      alert(err.response?.data?.detail || "Revoke failed (check backend endpoint)");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Board Invites — Board #{boardId}</h2>
        <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded">Back</button>
      </div>

      <section className="mb-6 border p-4 rounded bg-white">
        <h3 className="font-semibold mb-2">Create Invite</h3>
        <form onSubmit={createInvite}>
          <div className="mb-2">
            <input className="w-full p-2 border rounded" value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" />
          </div>
          <div className="mb-3 flex gap-2 items-center">
            <input className="w-32 p-2 border rounded" type="number" min="0" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
            <span className="text-sm text-gray-600">max uses (0 for unlimited)</span>
          </div>
          <div className="flex gap-2">
            <button className="bg-green-600 text-white px-3 py-1 rounded">Create invite</button>
            <button type="button" onClick={() => { setNote(""); setMaxUses(1); }} className="px-3 py-1 border rounded">Clear</button>
          </div>
        </form>
      </section>

      <section className="border p-4 rounded bg-white">
        <h3 className="font-semibold mb-2">Active invites</h3>
        {loading ? <div>Loading invites...</div> :
          invites.length === 0 ? <div className="text-sm text-gray-500">No invites</div> :
          invites.map(inv => (
            <div key={inv.id ?? inv.token} className="p-2 mb-2 border rounded flex justify-between items-start">
              <div>
                <div className="text-sm"><strong>Token:</strong> {inv.token ?? inv.code ?? '(no token field)'}</div>
                <div className="text-xs text-gray-600">Note: {inv.note || '-'}</div>
                <div className="text-xs text-gray-600">Uses: {inv.uses ?? 0} / {inv.max_uses ?? 'unlimited'}</div>
                <div className="text-xs text-gray-600">Expires: {inv.expires_at ?? 'never'}</div>
              </div>
              <div>
                <button onClick={() => { navigator.clipboard?.writeText(inv.token ?? inv.code ?? ""); alert("Copied token"); }} className="text-sm px-2 py-1 border rounded mb-2">Copy token</button>
                <div>
                  <button onClick={() => revoke(inv.id ?? inv.token)} className="text-sm text-red-600">Revoke</button>
                </div>
              </div>
            </div>
          ))
        }
      </section>
    </div>
  );
}