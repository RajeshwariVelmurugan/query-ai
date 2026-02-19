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
  const queriesPerDay = [
    { date: "Feb 13", queries: 120 },
    { date: "Feb 14", queries: 145 },
    { date: "Feb 15", queries: 178 },
    { date: "Feb 16", queries: 162 },
    { date: "Feb 17", queries: 195 },
    { date: "Feb 18", queries: 210 },
    { date: "Feb 19", queries: 187 },
  ];

  const topTables = [
    { table: "users", queries: 342 },
    { table: "orders", queries: 289 },
    { table: "products", queries: 234 },
    { table: "customers", queries: 187 },
    { table: "transactions", queries: 156 },
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

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Database}
          value="1,847"
          label="Total Queries"
          trend="+15.2%"
        />
        <StatCard
          icon={Zap}
          value="0.12s"
          label="Avg Response Time"
          trend="-18.4%"
        />
        <StatCard
          icon={Activity}
          value="82.4%"
          label="Cache Hit Rate"
          trend="+6.3%"
        />
        <StatCard icon={Users} value="24" label="Active Sessions" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Queries Per Day */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
            Queries Over Time
          </h2>
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
        </div>

        {/* Top Tables Queried */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-6">
            Most Queried Tables
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topTables}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="table"
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
              <Bar dataKey="queries" fill="#4F46E5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
              Peak Usage Time
            </p>
            <p className="text-2xl font-bold text-[#4F46E5]">2-4 PM</p>
            <p className="text-xs text-[#64748B] mt-1">
              42% of queries during this window
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-[#22C55E]/10 to-[#16A34A]/10 rounded-xl border border-[#22C55E]/20">
            <p className="text-sm font-semibold text-[#0F172A] mb-1">
              Fastest Query
            </p>
            <p className="text-2xl font-bold text-[#22C55E]">0.003s</p>
            <p className="text-xs text-[#64748B] mt-1">
              Simple SELECT on indexed column
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/10 rounded-xl border border-[#F59E0B]/20">
            <p className="text-sm font-semibold text-[#0F172A] mb-1">
              Optimization Potential
            </p>
            <p className="text-2xl font-bold text-[#F59E0B]">23%</p>
            <p className="text-xs text-[#64748B] mt-1">
              Queries that could be optimized
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}