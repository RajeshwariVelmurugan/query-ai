import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  trend?: string;
}

export function StatCard({ icon: Icon, value, label, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:scale-[1.02] transition-transform">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-[#4F46E5]/10 to-[#9333EA]/10 rounded-xl">
          <Icon className="w-6 h-6 text-[#4F46E5]" />
        </div>
        {trend && (
          <span className="text-sm text-[#22C55E] font-medium">{trend}</span>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-semibold text-[#0F172A]">{value}</div>
        <div className="text-sm text-[#64748B]">{label}</div>
      </div>
    </div>
  );
}
