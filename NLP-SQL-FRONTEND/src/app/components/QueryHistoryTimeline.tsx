import { RotateCw } from "lucide-react";

interface HistoryItem {
  id: number;
  question: string;
  timestamp: string;
  cached: boolean;
}

interface QueryHistoryTimelineProps {
  history: HistoryItem[];
  onRerun: (question: string) => void;
}

export function QueryHistoryTimeline({
  history,
  onRerun,
}: QueryHistoryTimelineProps) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-[#0F172A]">
        Session History
      </label>
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="h-15 bg-white border border-gray-200 rounded-xl p-3 hover:border-[#4F46E5]/30 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">
                  {item.question}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {item.timestamp}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                {item.cached ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#22C55E]/10 text-[#22C55E]">
                    Hit
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B]">
                    Miss
                  </span>
                )}
                <button
                  onClick={() => onRerun(item.question)}
                  className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-[#4F46E5]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <RotateCw className="w-4 h-4 text-[#4F46E5]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
