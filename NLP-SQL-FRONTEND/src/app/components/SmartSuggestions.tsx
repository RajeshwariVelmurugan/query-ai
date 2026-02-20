import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../services/api";

interface SmartSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

const FALLBACK_SUGGESTIONS = [
  "Show revenue by month",
  "Top 5 products by sales",
  "Compare last 2 years",
  "Users with no orders",
  "Average order value",
];

export function SmartSuggestions({ onSelect }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_SUGGESTIONS);

  useEffect(() => {
    const generateSuggestions = async () => {
      const tenantId = localStorage.getItem("tenant_id");
      if (!tenantId) return;

      try {
        const schema = await api.getSchema(tenantId);
        if (schema && schema.tables && schema.tables.length > 0) {
          const dynamicSuggestions: string[] = [];
          const tables = schema.tables.slice(0, 5);

          for (const table of tables) {
            const tableName = table.name || table;
            dynamicSuggestions.push(`Show all records from ${tableName}`);
          }

          // Add count-based suggestions
          if (tables.length > 0) {
            const firstTable = tables[0].name || tables[0];
            dynamicSuggestions.push(`Count total rows in ${firstTable}`);
          }

          if (tables.length > 1) {
            const secondTable = tables[1].name || tables[1];
            dynamicSuggestions.push(`Show first 10 rows from ${secondTable}`);
          }

          if (dynamicSuggestions.length > 0) {
            setSuggestions(dynamicSuggestions.slice(0, 5));
          }
        }
      } catch (err) {
        // Keep fallback suggestions on error
        console.error("Failed to generate smart suggestions", err);
      }
    };

    generateSuggestions();
  }, []);

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
