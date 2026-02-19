import { useState } from "react";
import { GradientButton } from "../components/GradientButton";
import { Database, Bell, Shield } from "lucide-react";
import { DatabaseHealthWidget } from "../components/DatabaseHealthWidget";
import { ThemeToggle } from "../components/ThemeToggle";
import { RoleBadge } from "../components/RoleBadge";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    cacheEnabled: true,
    cacheTTL: "3600",
    notifications: true,
    autoConnect: false,
  });

  const handleSave = () => {
    // Save settings logic
    alert("Settings saved successfully!");
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
        {/* Database Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#4F46E5]/10 rounded-lg">
              <Database className="w-5 h-5 text-[#4F46E5]" />
            </div>
            <h2 className="text-xl font-semibold text-[#0F172A]">
              Database Settings
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Connection String
              </label>
              <input
                type="text"
                className="w-full h-11 px-4 bg-[#F8FAFC] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
                placeholder="postgresql://user:pass@host:5432/database"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoConnect"
                checked={settings.autoConnect}
                onChange={(e) =>
                  setSettings({ ...settings, autoConnect: e.target.checked })
                }
                className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
              />
              <label htmlFor="autoConnect" className="text-sm text-[#0F172A]">
                Auto-connect on startup
              </label>
            </div>
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
            Save Settings
          </GradientButton>
        </div>
      </div>
    </div>
  );
}