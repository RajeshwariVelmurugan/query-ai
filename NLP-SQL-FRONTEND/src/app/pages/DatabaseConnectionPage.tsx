import { useState } from "react";
import { useNavigate } from "react-router";
import { GlassCard } from "../components/GlassCard";
import { GradientButton } from "../components/GradientButton";
import { Database, AlertCircle } from "lucide-react";
import { api } from "../services/api";

export default function DatabaseConnectionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    db_type: "postgresql",
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: "",
  });

  const handleConnect = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.connectDatabase({
        ...formData,
      });

      if (response.tenant_id) {
        localStorage.setItem("tenant_id", response.tenant_id);
        localStorage.setItem("db_type", formData.db_type);
        localStorage.setItem("db_host", formData.host);
        localStorage.setItem("db_port", formData.port);
        localStorage.setItem("db_name", formData.database);
        navigate("/app");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to database");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#0F172A] to-[#1E293B] flex items-center justify-center p-8">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#9333EA] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Connect to Database
          </h1>
          <p className="text-sm text-white/60">
            Enter your database credentials to get started
          </p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Database Type
              </label>
              <select
                value={formData.db_type}
                onChange={(e) => {
                  const dbType = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    db_type: dbType,
                    port: dbType === "mongodb" ? "27017" : (dbType === "mysql" ? "3306" : "5432"),
                    username: dbType === "mongodb" ? "" : prev.username,
                    password: dbType === "mongodb" ? "" : prev.password,
                  }));
                }}
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50 appearance-none cursor-pointer"
              >
                <option value="postgresql" className="bg-[#0F172A]">PostgreSQL</option>
                <option value="mysql" className="bg-[#0F172A]">MySQL</option>
                <option value="mongodb" className="bg-[#0F172A]">MongoDB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Host
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => handleChange("host", e.target.value)}
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50"
                placeholder="localhost"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Port
              </label>
              <input
                type="text"
                value={formData.port}
                onChange={(e) => handleChange("port", e.target.value)}
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50"
                placeholder="5432"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Database Name
              </label>
              <input
                type="text"
                value={formData.database}
                onChange={(e) => handleChange("database", e.target.value)}
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50"
                placeholder="my_database"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Username {formData.db_type === "mongodb" && <span className="text-white/40 font-normal ml-1">(Optional)</span>}
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50"
                placeholder={formData.db_type === "mongodb" ? "admin" : "postgres"}
                required={formData.db_type !== "mongodb"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Password {formData.db_type === "mongodb" && <span className="text-white/40 font-normal ml-1">(Optional)</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50"
                placeholder="••••••••"
                required={formData.db_type !== "mongodb"}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-4">
              <GradientButton type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  "Connect to Database"
                )}
              </GradientButton>
            </div>

            <p className="text-xs text-white/40 text-center pt-2">
              Your credentials are securely encrypted and never stored
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
