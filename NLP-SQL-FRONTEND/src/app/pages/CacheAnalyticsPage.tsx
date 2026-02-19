import { StatCard } from "../components/StatCard";
import { Database, Clock, TrendingUp, Activity } from "lucide-react";
import { Progress } from "../components/ui/progress";
import { DatabaseHealthWidget } from "../components/DatabaseHealthWidget";
import { ThemeToggle } from "../components/ThemeToggle";
import { RoleBadge } from "../components/RoleBadge";

export default function CacheAnalyticsPage() {
  const cachedQueries = [
    {
      id: 1,
      query: "SELECT * FROM users WHERE created_at >= '2026-01-01'",
      hits: 42,
      lastAccessed: "5 minutes ago",
      savedTime: "12.4s",
    },
    {
      id: 2,
      query: "SELECT product_id, SUM(revenue) FROM orders GROUP BY product_id",
      hits: 38,
      lastAccessed: "15 minutes ago",
      savedTime: "18.9s",
    },
    {
      id: 3,
      query: "SELECT COUNT(*) FROM orders WHERE status = 'pending'",
      hits: 31,
      lastAccessed: "1 hour ago",
      savedTime: "8.2s",
    },
    {
      id: 4,
      query: "SELECT AVG(order_value) FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
      hits: 27,
      lastAccessed: "2 hours ago",
      savedTime: "15.7s",
    },
    {
      id: 5,
      query: "SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id",
      hits: 19,
      lastAccessed: "3 hours ago",
      savedTime: "21.3s",
    },
  ];

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

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Database}
          value="247"
          label="Cached Queries"
        />
        <StatCard
          icon={Clock}
          value="78.3%"
          label="Hit Rate"
          trend="+5.2%"
        />
        <StatCard
          icon={TrendingUp}
          value="342.8s"
          label="Time Saved Today"
        />
        <StatCard
          icon={Activity}
          value="1,847"
          label="Cache Hits Today"
          trend="+12.5%"
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
              <span className="text-sm font-medium text-[#0F172A]">Hit Rate</span>
              <span className="text-sm font-semibold text-[#4F46E5]">78.3%</span>
            </div>
            <Progress value={78.3} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#0F172A]">Memory Usage</span>
              <span className="text-sm font-semibold text-[#22C55E]">42.1%</span>
            </div>
            <Progress value={42.1} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#0F172A]">Cache Efficiency</span>
              <span className="text-sm font-semibold text-[#4F46E5]">91.7%</span>
            </div>
            <Progress value={91.7} className="h-2" />
          </div>
        </div>
      </div>

      {/* Most Cached Queries */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-[#0F172A]">
            Top Cached Queries
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
                  Cache Hits
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Last Accessed
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Time Saved
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cachedQueries.map((query) => (
                <tr key={query.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-[#0F172A] max-w-md truncate">
                      {query.query}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-[#4F46E5]/10 text-[#4F46E5]">
                      {query.hits}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#64748B]">
                      {query.lastAccessed}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-[#22C55E]">
                      {query.savedTime}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}