import { useState } from "react";
import { GradientButton } from "../components/GradientButton";
import { Database, Bell, Shield, LogOut } from "lucide-react";
import { DatabaseHealthWidget } from "../components/DatabaseHealthWidget";
import { ThemeToggle } from "../components/ThemeToggle";
import { RoleBadge } from "../components/RoleBadge";
import { api } from "../services/api";
import { useNavigate } from "react-router";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [disconnecting, setDisconnecting] = useState(false);

  // Load saved preferences from localStorage
  const [settings, setSettings] = useState(() => ({
    cacheEnabled: localStorage.getItem("pref_cacheEnabled") !== "false",
    cacheTTL: localStorage.getItem("pref_cacheTTL") || "3600",
    notifications: localStorage.getItem("pref_notifications") !== "false",
    autoConnect: localStorage.getItem("pref_autoConnect") === "true",
  }));

  // Load connection info from localStorage (set during connection flow)
  const connectionInfo = {
    db_type: localStorage.getItem("db_type") || "—",
    host: localStorage.getItem("db_host") || "—",
    port: localStorage.getItem("db_port") || "—",
    database: localStorage.getItem("db_name") || "—",
    tenant_id: localStorage.getItem("tenant_id") || "—",
  };

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("pref_cacheEnabled", String(settings.cacheEnabled));
    localStorage.setItem("pref_cacheTTL", settings.cacheTTL);
    localStorage.setItem("pref_notifications", String(settings.notifications));
    localStorage.setItem("pref_autoConnect", String(settings.autoConnect));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDisconnect = async () => {
    const tenantId = localStorage.getItem("tenant_id");
    if (!tenantId) return;

    if (!window.confirm("Are you sure you want to disconnect from the database?")) return;

    setDisconnecting(true);
    try {
      await api.disconnectTenant(tenantId);
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("db_type");
      localStorage.removeItem("db_host");
      localStorage.removeItem("db_port");
      localStorage.removeItem("db_name");
      navigate("/connect");
    } catch (err) {
      console.error("Failed to disconnect", err);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Settings</h1>
          <p className="text-[#64748B]">
            Configure your database connection and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role="Admin" />
          <ThemeToggle />
          <DatabaseHealthWidget />
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Database Connection Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#4F46E5]/10 rounded-lg">
              <Database className="w-5 h-5 text-[#4F46E5]" />
            </div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              Database Connection
            </h2>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Database Type
                </label>
                <div className="h-11 px-4 bg-[#F8FAFC] border border-gray-200 rounded-xl flex items-center text-sm text-[#0F172A] font-medium">
                  {connectionInfo.db_type.toUpperCase()}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Host
                </label>
                <div className="h-11 px-4 bg-[#F8FAFC] border border-gray-200 rounded-xl flex items-center text-sm text-[#0F172A] font-mono">
                  {connectionInfo.host}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Port
                </label>
                <div className="h-11 px-4 bg-[#F8FAFC] border border-gray-200 rounded-xl flex items-center text-sm text-[#0F172A] font-mono">
                  {connectionInfo.port}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">
                  Database
                </label>
                <div className="h-11 px-4 bg-[#F8FAFC] border border-gray-200 rounded-xl flex items-center text-sm text-[#0F172A] font-mono">
                  {connectionInfo.database}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">
                Tenant ID
              </label>
              <div className="h-11 px-4 bg-[#F8FAFC] border border-gray-200 rounded-xl flex items-center text-xs text-[#64748B] font-mono">
                {connectionInfo.tenant_id}
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting || connectionInfo.tenant_id === "—"}
              className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {disconnecting ? "Disconnecting..." : "Disconnect Database"}
            </button>
          </div>
        </div>

        {/* Cache Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#22C55E]/10 rounded-lg">
              <Shield className="w-5 h-5 text-[#22C55E]" />
            </div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              Cache Settings
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cacheEnabled"
                checked={settings.cacheEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, cacheEnabled: e.target.checked })
                }
                className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
              />
              <label htmlFor="cacheEnabled" className="text-sm text-[#0F172A]">
                Enable query caching
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Cache TTL (seconds)
              </label>
              <input
                type="number"
                value={settings.cacheTTL}
                onChange={(e) =>
                  setSettings({ ...settings, cacheTTL: e.target.value })
                }
                className="w-full h-11 px-4 bg-[#F8FAFC] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
              />
              <p className="mt-1 text-xs text-[#64748B]">
                How long queries should be cached (default: 3600 seconds)
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#F59E0B]/10 rounded-lg">
              <Bell className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              Notifications
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="notifications"
                checked={settings.notifications}
                onChange={(e) =>
                  setSettings({ ...settings, notifications: e.target.checked })
                }
                className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
              />
              <label htmlFor="notifications" className="text-sm text-[#0F172A]">
                Enable notifications for query completion
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <GradientButton onClick={handleSave} className="px-8">
            {saved ? "✓ Saved" : "Save Settings"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}