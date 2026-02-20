import { useState, useEffect } from "react";
import { api } from "../services/api";
import { StatCard } from "../components/StatCard";
import { Activity, Database, Zap, Users } from "lucide-react";
import { DatabaseHealthWidget } from "../components/DatabaseHealthWidget";
import { ThemeToggle } from "../components/ThemeToggle";
import { RoleBadge } from "../components/RoleBadge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function PerformancePage() {
  const [stats, setStats] = useState({
    total_queries: 0,
    hit_rate_percentage: 0,
    hits: 0,
    misses: 0,
    memory_cache_entries: 0,
  });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const tenantId = localStorage.getItem("tenant_id");
      if (!tenantId) return;

      try {
        const [statsData, historyData] = await Promise.all([
          api.getTenantStats(tenantId),
          api.getTenantHistory(tenantId),
        ]);
        setStats(statsData);
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to fetch performance data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Derive queries-per-day from history timestamps
  const queriesPerDay = (() => {
    const dayMap: Record<string, number> = {};
    history.forEach((item: any) => {
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        const label = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dayMap[label] = (dayMap[label] || 0) + 1;
      }
    });
    return Object.entries(dayMap)
      .map(([date, queries]) => ({ date, queries }))
      .slice(-7);
  })();

  // Derive query breakdown summary
  const queryBreakdown = [
    { label: "Cache Hits", count: stats.hits, color: "#22C55E" },
    { label: "Cache Misses", count: stats.misses, color: "#F59E0B" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">
            Performance Analytics
          </h1>
          <p className="text-[#64748B]">
            Deep insights into query performance and database usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role="Admin" />
          <ThemeToggle />
          <DatabaseHealthWidget />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Database}
              value={stats.total_queries.toLocaleString()}
              label="Total Queries"
              trend={stats.total_queries > 0 ? "Live" : "No data"}
            />
            <StatCard
              icon={Zap}
              value={`${stats.hits}`}
              label="Cache Hits"
              trend={stats.hits > 0 ? "Active" : "—"}
            />
            <StatCard
              icon={Activity}
              value={`${stats.hit_rate_percentage}%`}
              label="Cache Hit Rate"
              trend={stats.hit_rate_percentage > 50 ? "Healthy" : "Building up"}
            />
            <StatCard
              icon={Users}
              value={stats.memory_cache_entries.toString()}
              label="Cached Entries"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Queries Per Day */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
                Queries Over Time
              </h2>
              {queriesPerDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={queriesPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748B"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="queries"
                      stroke="#4F46E5"
                      strokeWidth={3}
                      dot={{ fill: "#4F46E5", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-[#64748B] text-sm">
                  No query data yet. Start asking questions to see trends.
                </div>
              )}
            </div>

            {/* Cache Hit/Miss Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
                Cache Performance Breakdown
              </h2>
              {stats.total_queries > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={queryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="label"
                      stroke="#64748B"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-[#64748B] text-sm">
                  No data available yet.
                </div>
              )}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-4">
              Performance Insights
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-[#4F46E5]/10 to-[#9333EA]/10 rounded-xl border border-[#4F46E5]/20">
                <p className="text-sm font-semibold text-[#0F172A] mb-1">
                  Total Queries
                </p>
                <p className="text-2xl font-bold text-[#4F46E5]">
                  {stats.total_queries}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  {stats.hits} served from cache
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#22C55E]/10 to-[#16A34A]/10 rounded-xl border border-[#22C55E]/20">
                <p className="text-sm font-semibold text-[#0F172A] mb-1">
                  Cache Efficiency
                </p>
                <p className="text-2xl font-bold text-[#22C55E]">
                  {stats.hit_rate_percentage}%
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  {stats.misses} cache misses
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/10 rounded-xl border border-[#F59E0B]/20">
                <p className="text-sm font-semibold text-[#0F172A] mb-1">
                  Memory Cache
                </p>
                <p className="text-2xl font-bold text-[#F59E0B]">
                  {stats.memory_cache_entries}/50
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  Entries in memory cache
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}