import { Sparkles } from "lucide-react";

interface SmartSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

export function SmartSuggestions({ onSelect }: SmartSuggestionsProps) {
  const suggestions = [
    "Show revenue by month",
    "Top 5 products by sales",
    "Compare last 2 years",
    "Users with no orders",
    "Average order value",
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#4F46E5]" />
        <label className="text-xs font-medium text-[#64748B] uppercase tracking-wide">
          Suggested Queries
        </label>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="flex-shrink-0 h-9 px-4 bg-white border border-gray-200 rounded-full text-sm text-[#0F172A] font-medium hover:bg-gradient-to-r hover:from-[#4F46E5]/10 hover:to-[#9333EA]/10 hover:border-[#4F46E5]/30 transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
