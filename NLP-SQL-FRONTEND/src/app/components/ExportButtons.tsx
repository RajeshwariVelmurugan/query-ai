import { Download, Copy, Share2, Check } from "lucide-react";
import { useState } from "react";

interface ExportButtonsProps {
  sql: string;
  data: any[];
}

export function ExportButtons({ sql, data }: ExportButtonsProps) {
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadCSV = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => JSON.stringify(row[header])).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    alert("Share functionality would generate a shareable link");
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopySQL}
        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
        title="Copy SQL"
      >
        {copiedSql ? (
          <Check className="w-4 h-4 text-[#22C55E]" />
        ) : (
          <Copy className="w-4 h-4 text-white/70" />
        )}
      </button>
      <button
        onClick={handleDownloadCSV}
        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
        title="Download CSV"
      >
        <Download className="w-4 h-4 text-white/70" />
      </button>
      <button
        onClick={handleShare}
        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
        title="Share Snapshot"
      >
        <Share2 className="w-4 h-4 text-white/70" />
      </button>
    </div>
  );
}
