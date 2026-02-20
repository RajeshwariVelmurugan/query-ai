import { useState } from "react";
import { useNavigate } from "react-router";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { GlassCard } from "../components/GlassCard";
import { GradientButton } from "../components/GradientButton";
import { Database, AlertCircle } from "lucide-react";
import { api } from "../services/api";

// Environment-based Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);
        const response = await api.login(formData);
        localStorage.setItem("access_token", response.access_token);
      } else {
        await api.register({ email, password, full_name: fullName });
        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);
        const loginResponse = await api.login(formData);
        localStorage.setItem("access_token", loginResponse.access_token);
      }
      navigate("/connect");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }

      // Verification happens on the backend synchronously
      const response = await api.googleAuth(credentialResponse.credential);
      localStorage.setItem("access_token", response.access_token);

      // ONLY navigate after backend confirms the token is valid
      navigate("/connect");
    } catch (err: any) {
      setError(err.message || "Google Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#0F172A] to-[#1E293B] flex">
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

        <div className="flex-1 flex items-center justify-center p-20">
          <GlassCard className="w-[420px] p-8">
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  {isLogin ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-sm text-white/60">
                  {isLogin ? "Sign in to continue to your dashboard" : "Join us to start querying your data"}
                </p>
              </div>

              <div className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                )}

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

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <GradientButton type="submit" className="w-full" disabled={loading}>
                  {loading ? "Authenticating..." : isLogin ? "Sign in" : "Create account"}
                </GradientButton>

                <div className="flex justify-center pt-2">
                  <GoogleLogin
                    onSuccess={onGoogleSuccess}
                    onError={() => setError("Google login failed")}
                    useOneTap
                    theme="filled_blue"
                    shape="circle"
                    text="continue_with"
                    width="100%"
                  />
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-white/60 hover:text-white/90 transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
