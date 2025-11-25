import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import FiltersBar from "../components/dashboard/FiltersBar";
import SummaryCards from "../components/dashboard/SummaryCards";
import TopVoted from "../components/dashboard/TopVoted";
import TrendsChart from "../components/dashboard/TrendsChart";
import DistributionChart from "../components/dashboard/DistributionChart";
import { AuthContext } from "../contexts/AuthContext";
import { userHasRole } from "../utils/roles";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // guard route client-side: only Admin/Moderator
  useEffect(() => {
    if (!user) return; // allow AuthContext to load
    if (!userHasRole(user, "Admin") && !userHasRole(user, "Moderator")) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const [filters, setFilters] = useState({
    board: null, from: null, to: null, granularity: "daily", by: "status",
  });

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [topVoted, setTopVoted] = useState([]);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters]);

  async function loadAll() {
    setLoading(true);
    try {
      const params = {
        board: filters.board ?? undefined,
        from: filters.from ?? undefined,
        to: filters.to ?? undefined,
      };

      const [sRes, tRes, trRes, dRes] = await Promise.all([
        api.get("/analytics/summary/", { params }),
        api.get("/analytics/top_voted/", { params: { ...params, limit: 5 } }),
        api.get("/analytics/trends/", { params: { ...params, granularity: filters.granularity } }),
        api.get("/analytics/distribution/", { params: { ...params, by: filters.by } }),
      ]);

      setSummary(sRes.data);
      setTopVoted(tRes.data);
      setTrends(trRes.data);
      setDistribution(dRes.data);
    } catch (err) {
      console.error("Dashboard load error", err);
      // keep previous data if any; show console error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Feedback Dashboard</h1>
      </div>

      <FiltersBar filters={filters} setFilters={setFilters} />

      <div className="mt-4">
        <SummaryCards data={summary} loading={loading} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="md:col-span-2">
          <TrendsChart data={trends} granularity={filters.granularity} loading={loading} />
        </div>
        <div>
          <TopVoted items={topVoted} loading={loading} />
        </div>
      </div>

      <div className="mt-6">
        <DistributionChart data={distribution} by={filters.by} loading={loading} />
      </div>
    </div>
  );
}