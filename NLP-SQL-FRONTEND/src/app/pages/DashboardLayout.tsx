import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  MessageSquare,
  Database,
  Settings,
  LogOut,
  TrendingUp,
} from "lucide-react";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
    { icon: MessageSquare, label: "Ask Query", path: "/app/query" },
    { icon: Database, label: "Cache Analytics", path: "/app/cache" },
    { icon: TrendingUp, label: "Insights", path: "/app/insights" },
    { icon: Settings, label: "Settings", path: "/app/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(path);
  };

  const handleDisconnect = async () => {
    const tenant_id = localStorage.getItem("tenant_id");
    if (tenant_id) {
      try {
        await fetch(`http://localhost:8000/api/disconnect/${tenant_id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to disconnect:", err);
      }
    }
    localStorage.removeItem("tenant_id");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <div
        className="w-[260px] bg-[#111827]/85 backdrop-blur-[20px] border-r border-white/10 flex flex-col"
        style={{ backdropFilter: "blur(20px)" }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#9333EA] rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">QueryAI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white"
                  : "text-[#E5E7EB] hover:bg-white/5"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Disconnect Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}