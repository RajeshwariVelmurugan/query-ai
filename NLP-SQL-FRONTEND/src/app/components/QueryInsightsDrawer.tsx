import { Clock, Database, CheckCircle, XCircle, Lightbulb } from "lucide-react";

interface QueryInsightsDrawerProps {
  sql: string;
  executionTime: string;
  cached: boolean;
  rowsReturned: number;
  confidence: number;
}

export function QueryInsightsDrawer({
  sql,
  executionTime,
  cached,
  rowsReturned,
  confidence,
}: QueryInsightsDrawerProps) {
  return (
    <div className="w-80 bg-white/10 backdrop-blur-[24px] border border-white/20 rounded-2xl p-5 flex flex-col gap-4">
      {/* Generated SQL */}
      <div>
        <label className="block text-xs text-white/60 mb-2 uppercase tracking-wide">
          Generated SQL
        </label>
        <div className="bg-[#111827] rounded-lg p-3">
          <pre className="text-xs text-[#E5E7EB] font-mono overflow-x-auto whitespace-pre-wrap">
            {sql}
          </pre>
        </div>
      </div>

      {/* Execution Stats */}
      <div>
        <label className="block text-xs text-white/60 mb-2 uppercase tracking-wide">
          Execution Stats
        </label>
        <div className="flex flex-col gap-2">
          <div className="h-8 px-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-white/60" />
            <span className="text-xs text-white font-medium">{executionTime}</span>
          </div>
          <div className="h-8 px-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
            {cached ? (
              <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
            )}
            <span className="text-xs text-white font-medium">
              {cached ? "Cache HIT" : "Cache MISS"}
            </span>
          </div>
          <div className="h-8 px-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-white/60" />
            <span className="text-xs text-white font-medium">
              {rowsReturned} rows
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Score */}
      <div>
        <label className="block text-xs text-white/60 mb-2 uppercase tracking-wide">
          AI Confidence
        </label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-semibold">
              {confidence}% confident
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#22C55E] to-[#4F46E5] rounded-full transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Query Optimization Suggestion */}
      <div className="bg-gradient-to-r from-[#4F46E5]/10 to-[#9333EA]/10 border border-[#4F46E5]/20 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-[#4F46E5] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-white font-medium mb-1">
              Optimization Suggestion
            </p>
            <p className="text-xs text-white/70 leading-relaxed">
              Add index on 'created_at' for faster date filtering. Estimated
              improvement: 3x faster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
