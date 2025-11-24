import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import FilterBar from "./FilterBar";
import Pagination from "./Pagination";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";

export default function FeedbackTable({ boardId, pageSize = 10 }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [boardId, page, filters]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = { board: boardId, page, page_size: pageSize };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.ordering) params.ordering = filters.ordering;
      const res = await api.get("/feedback/", { params });
      const data = res.data;
      const items = data.results ?? data; // support paginated & non-paginated
      setFeedbacks(items);
      const count = data.count ?? items.length;
      setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
    } catch (err) {
      console.error("Failed to load feedbacks", err);
      setFeedbacks([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  const onFilter = (f) => {
    setFilters(f || {});
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete feedback?")) return;
    try {
      await api.delete(`/feedback/${id}/`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  const handleEdit = async (f) => {
    const title = prompt("Edit title", f.title);
    if (title === null) return;
    const body = prompt("Edit body", f.body);
    if (body === null) return;
    try {
      await api.patch(`/feedback/${f.id}/`, { title, body });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  return (
    <div>
      <FilterBar onFilter={onFilter} defaultStatus={filters.status} />
      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Upvotes</th>
                <th className="px-4 py-2 text-left">Creator</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map(f => (
                <tr key={f.id} className="border-t">
                  <td className="px-4 py-3">{f.title}</td>
                  <td className="px-4 py-3">{f.status}</td>
                  <td className="px-4 py-3">{f.upvotes_count ?? f.upvotes?.length ?? 0}</td>
                  <td className="px-4 py-3">{f.created_by?.username ?? f.created_by}</td>
                  <td className="px-4 py-3">{f.created_at ? new Date(f.created_at).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3">
                    {(user && (userHasRole(user, "Admin") || userHasRole(user, "Moderator") || user.id === (f.created_by?.id ?? f.created_by))) && (
                      <>
                        <button onClick={() => handleEdit(f)} className="text-sm mr-2 text-blue-600">Edit</button>
                        <button onClick={() => handleDelete(f.id)} className="text-sm text-red-600">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={(p) => setPage(p)} />
    </div>
  );
}