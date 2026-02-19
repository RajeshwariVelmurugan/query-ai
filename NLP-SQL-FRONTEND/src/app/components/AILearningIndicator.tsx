import { Zap } from "lucide-react";

export function AILearningIndicator() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg">
      <Zap className="w-3.5 h-3.5 text-[#22C55E]" />
      <span className="text-xs text-[#22C55E] font-medium">
        This query is now cached for faster future access
      </span>
    </div>
  );
}
