import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`bg-white/10 backdrop-blur-[24px] border border-white/20 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] ${className}`}
      style={{
        backdropFilter: "blur(24px)",
      }}
    >
      {children}
    </div>
  );
}
