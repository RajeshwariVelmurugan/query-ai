import { useState, useEffect } from "react";
import { api } from "../services/api";
import { StatCard } from "../components/StatCard";
import { Database, Clock, TrendingUp, Activity } from "lucide-react";
import { Progress } from "../components/ui/progress";
import { DatabaseHealthWidget } from "../components/DatabaseHealthWidget";
import { ThemeToggle } from "../components/ThemeToggle";
import { RoleBadge } from "../components/RoleBadge";

export default function CacheAnalyticsPage() {
  const [globalStats, setGlobalStats] = useState({
    hits: 0,
    misses: 0,
    total_requests: 0,
    hit_rate_percentage: 0,
    redis_available: false,
    memory_cache_size: 0,
  });
  const [tenantStats, setTenantStats] = useState({
    hits: 0,
    misses: 0,
    total_queries: 0,
    hit_rate_percentage: 0,
    redis_available: false,
    memory_cache_entries: 0,
  });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const tenantId = localStorage.getItem("tenant_id");
      try {
        const [global, tenant, historyData] = await Promise.all([
          api.getCacheStats(),
          tenantId ? api.getTenantStats(tenantId) : Promise.resolve(null),
          tenantId ? api.getTenantHistory(tenantId) : Promise.resolve([]),
        ]);
        setGlobalStats(global);
        if (tenant) setTenantStats(tenant);
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to fetch cache data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const memoryUsagePercent = Math.min(
    (globalStats.memory_cache_size / 50) * 100,
    100
  );
  const efficiency =
    globalStats.total_requests > 0
      ? ((globalStats.hits / globalStats.total_requests) * 100).toFixed(1)
      : "0.0";

  const formatTimestamp = (isoStr: string) => {
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">
            Cache Analytics
          </h1>
          <p className="text-[#64748B]">
            Monitor query cache performance and optimization
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
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Database}
              value={globalStats.memory_cache_size.toString()}
              label="Cached Queries"
            />
            <StatCard
              icon={Clock}
              value={`${tenantStats.hit_rate_percentage}%`}
              label="Hit Rate"
              trend={
                tenantStats.hit_rate_percentage > 50 ? "Healthy" : "Building up"
              }
            />
            <StatCard
              icon={TrendingUp}
              value={tenantStats.total_queries.toString()}
              label="Total Queries"
            />
            <StatCard
              icon={Activity}
              value={tenantStats.hits.toString()}
              label="Cache Hits"
              trend={tenantStats.hits > 0 ? "Active" : "No hits yet"}
            />
          </div>

          {/* Cache Performance */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
              Cache Performance
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#0F172A]">
                    Hit Rate
                  </span>
                  <span className="text-sm font-semibold text-[#4F46E5]">
                    {tenantStats.hit_rate_percentage}%
                  </span>
                </div>
                <Progress value={tenantStats.hit_rate_percentage} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#0F172A]">
                    Memory Usage ({globalStats.memory_cache_size}/50 slots)
                  </span>
                  <span className="text-sm font-semibold text-[#22C55E]">
                    {memoryUsagePercent.toFixed(1)}%
                  </span>
                </div>
                <Progress value={memoryUsagePercent} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#0F172A]">
                    Cache Efficiency
                  </span>
                  <span className="text-sm font-semibold text-[#4F46E5]">
                    {efficiency}%
                  </span>
                </div>
                <Progress value={parseFloat(efficiency)} className="h-2" />
              </div>
            </div>
          </div>

          {/* Redis Status */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-3 h-3 rounded-full ${globalStats.redis_available
                      ? "bg-[#22C55E]"
                      : "bg-[#F59E0B]"
                    }`}
                />
              </div>
              <span className="text-sm font-medium text-[#0F172A]">
                Redis:{" "}
                {globalStats.redis_available
                  ? "Connected"
                  : "Offline (using in-memory fallback)"}
              </span>
            </div>
          </div>

          {/* Recent Cached Queries */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-[#0F172A]">
                Recent Queries
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-12 text-center text-[#64748B]"
                      >
                        No queries cached yet. Start asking questions!
                      </td>
                    </tr>
                  ) : (
                    history.map((item: any, idx: number) => (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-[#0F172A] max-w-md truncate">
                            {item.query}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#64748B]">
                            {formatTimestamp(item.timestamp)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}