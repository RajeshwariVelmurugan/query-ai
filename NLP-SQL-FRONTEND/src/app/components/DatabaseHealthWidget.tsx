import { useState, useEffect } from "react";
import { api } from "../services/api";

type HealthStatus = "connected" | "slow" | "disconnected";

export function DatabaseHealthWidget() {
  const [status, setStatus] = useState<HealthStatus>("connected");
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const checkHealth = async () => {
      const tenantId = localStorage.getItem("tenant_id");
      if (!tenantId) {
        setStatus("disconnected");
        return;
      }

      try {
        const response = await api.getTenantHealth(tenantId);
        setLatency(response.latency || 0);
        if (response.status === "connected") {
          setStatus(response.latency > 500 ? "slow" : "connected");
        } else {
          setStatus("disconnected");
        }
      } catch (err) {
        setStatus("disconnected");
        setLatency(0);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const statusConfig: Record<
    HealthStatus,
    { color: string; label: string; bgColor: string; textColor: string }
  > = {
    connected: {
      color: "#22C55E",
      label: "Connected",
      bgColor: "bg-[#22C55E]/10",
      textColor: "text-[#22C55E]",
    },
    slow: {
      color: "#F59E0B",
      label: "Slow",
      bgColor: "bg-[#F59E0B]/10",
      textColor: "text-[#F59E0B]",
    },
    disconnected: {
      color: "#EF4444",
      label: "Offline",
      bgColor: "bg-[#EF4444]/10",
      textColor: "text-[#EF4444]",
    },
  };

  const config = statusConfig[status as HealthStatus];

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200">
      <div className="relative">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: config.color }}
        />
        <div
          className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75"
          style={{ backgroundColor: config.color }}
        />
      </div>
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.label}
      </span>
      <span className="text-xs text-[#64748B]">•</span>
      <span className="text-xs text-[#64748B] font-medium">{latency}ms</span>
    </div>
  );
}
