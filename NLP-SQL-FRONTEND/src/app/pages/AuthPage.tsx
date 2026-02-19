import { useState } from "react";
import { useNavigate } from "react-router";
import { GlassCard } from "../components/GlassCard";
import { GradientButton } from "../components/GradientButton";
import { Database } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/connect");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#0F172A] to-[#1E293B] flex">
      {/* Left Section - Brand */}
      <div className="w-[520px] h-full p-16 flex flex-col justify-center">
        <div className="mb-20">
          <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#9333EA] rounded-xl flex items-center justify-center mb-12">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[32px] font-semibold text-white max-w-[360px] mb-4 leading-tight">
            Query your database with natural language
          </h1>
          <p className="text-sm text-white/70 max-w-[360px] leading-relaxed">
            Connect to any database and ask questions in plain English. Our AI
            translates your queries into optimized SQL with intelligent caching.
          </p>
        </div>
      </div>

      {/* Right Section - Login Card */}
      <div className="flex-1 flex items-center justify-center p-20">
        <GlassCard className="w-[420px] p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-white/60">
                Sign in to continue to your dashboard
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <GradientButton type="submit" className="w-full">
              Sign in
            </GradientButton>

            <div className="text-center">
              <a
                href="#"
                className="text-sm text-white/60 hover:text-white/90 transition-colors"
              >
                Forgot password?
              </a>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
