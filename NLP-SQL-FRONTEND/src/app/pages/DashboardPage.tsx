import { useState, useEffect } from "react";
import { api } from "../services/api";
import { StatCard } from "../components/StatCard";
import { Database, Zap, Clock } from "lucide-react";
import { DatabaseHealthWidget } from "../components/DatabaseHealthWidget";
import { ThemeToggle } from "../components/ThemeToggle";
import { RoleBadge } from "../components/RoleBadge";

export default function DashboardPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total_queries: 0,
    hit_rate_percentage: 0,
    avg_latency: "0.15s" // Default placeholder for now
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const tenantId = localStorage.getItem("tenant_id");
      if (!tenantId) return;

      try {
        const [historyData, statsData] = await Promise.all([
          api.getTenantHistory(tenantId),
          api.getTenantStats(tenantId)
        ]);
        setQueries(historyData);
        setStats({
          ...statsData,
          avg_latency: statsData.avg_latency || "—",
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">
            Dashboard
          </h1>
          <p className="text-[#64748B]">
            Overview of your database queries and performance
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
          <div className="grid grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={Database}
              value={stats.total_queries.toLocaleString()}
              label="Total Queries"
              trend={stats.total_queries > 0 ? "+Live" : "No data"}
            />
            <StatCard
              icon={Zap}
              value={stats.avg_latency}
              label="Avg Response Time"
              trend="Real-time"
            />
            <StatCard
              icon={Clock}
              value={`${stats.hit_rate_percentage}%`}
              label="Cache Hit Rate"
              trend={stats.hit_rate_percentage > 50 ? "Healthy" : "Low"}
            />
          </div>

          {/* Recent Queries Table */}
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
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {queries.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-[#64748B]">
                        No queries yet. Start asking in the Ask Page!
                      </td>
                    </tr>
                  ) : (
                    queries.map((query: any) => (
                      <tr key={query.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#0F172A] font-medium max-w-md truncate">
                            {query.query}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#64748B]">
                            {formatTimestamp(query.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#22C55E]/10 text-[#22C55E]">
                            Live Result
                          </span>
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