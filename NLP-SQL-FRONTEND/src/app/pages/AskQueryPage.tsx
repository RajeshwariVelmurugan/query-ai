import { useState, useEffect } from "react";
import { GradientButton } from "../components/GradientButton";
import { Send, AlertCircle } from "lucide-react";
import { QueryInsightsDrawer } from "../components/QueryInsightsDrawer";
import { QueryHistoryTimeline } from "../components/QueryHistoryTimeline";
import { SmartSuggestions } from "../components/SmartSuggestions";
import { ExportButtons } from "../components/ExportButtons";
import { AILearningIndicator } from "../components/AILearningIndicator";
import { api } from "../services/api";
import { useNavigate } from "react-router";

export default function AskQueryPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    sql: string;
    cached: boolean;
    data: any[];
    executionTime: string;
    confidence: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{ id: number; question: string; timestamp: string; cached: boolean }>
  >([]);

  useEffect(() => {
    const storedTenantId = localStorage.getItem("tenant_id");
    if (!storedTenantId) {
      navigate("/");
      return;
    }
    setTenantId(storedTenantId);
  }, [navigate]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!question.trim() || !tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.askQuestion({
        tenant_id: tenantId,
        question: question.trim(),
      });

      const newResult = {
        sql: response.sql || "",
        cached: response.cache_hit,
        executionTime: response.execution_time,
        confidence: 95, // Backend doesn't return confidence yet, defaulting to 95
        data: response.answer,
      };

      setResult(newResult);
      setHistory((prev: any[]) => [
        {
          id: Date.now(),
          question,
          timestamp: "Just now",
          cached: response.cache_hit,
        },
        ...prev.slice(0, 4),
      ]);

      if (response.error) {
        setError(response.error);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuestion(suggestion);
  };

  const handleRerun = (historyQuestion: string) => {
    setQuestion(historyQuestion);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0B1020] via-[#0F172A] to-[#1E293B]">
      <div className="p-8 border-b border-white/10">
        <h1 className="text-3xl font-semibold text-white mb-2">Ask a Query</h1>
        <p className="text-white/60">
          Ask questions in natural language and get instant SQL results
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left - Question */}
        <div className="w-[480px] p-8 border-r border-white/10 flex flex-col">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-3">
                Your Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50 resize-none"
                placeholder="e.g., Show me all users who signed up in the last 30 days"
              />
            </div>
            <GradientButton
              type="submit"
              className="w-full"
              disabled={loading || !question.trim()}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating SQL...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Generate SQL
                </div>
              )}
            </GradientButton>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Query Failed</p>
                <p className="opacity-80">{error}</p>
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          <div className="mb-6">
            <SmartSuggestions onSelect={handleSuggestionSelect} />
          </div>

          {/* Query History */}
          <div className="flex-1 overflow-auto">
            <QueryHistoryTimeline history={history} onRerun={handleRerun} />
          </div>
        </div>

        {/* Middle - Results */}
        <div className="flex-1 p-8 flex flex-col overflow-hidden">
          {result && (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-white">
                    Results ({result.data.length} rows)
                  </label>
                  <ExportButtons sql={result.sql} data={result.data} />
                </div>
              </div>

              <div className="flex-1 bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-2xl overflow-hidden mb-4">
                <div className="overflow-auto h-full">
                  <table className="w-full">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        {Object.keys(result.data[0] || {}).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.data.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-white/5 transition-colors"
                        >
                          {Object.values(row).map((value, i) => (
                            <td
                              key={i}
                              className="px-4 py-3 text-sm text-white/90"
                            >
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Learning Indicator */}
              {result.cached && (
                <div>
                  <AILearningIndicator />
                </div>
              )}
            </>
          )}

          {!result && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white/60 text-sm">
                  Submit a question to see results
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right - Query Insights Drawer */}
        {result && (
          <div className="w-[360px] p-8 border-l border-white/10 overflow-auto">
            <QueryInsightsDrawer
              sql={result.sql}
              executionTime={result.executionTime}
              cached={result.cached}
              rowsReturned={result.data.length}
              confidence={result.confidence}
            />
          </div>
        )}
      </div>
    </div>
  );
}