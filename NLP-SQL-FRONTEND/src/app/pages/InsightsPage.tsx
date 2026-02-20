import { useState, useEffect } from "react";
import { api } from "../services/api";
import { DatabaseHealthWidget } from "../components/DatabaseHealthWidget";
import { ThemeToggle } from "../components/ThemeToggle";
import { RoleBadge } from "../components/RoleBadge";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Layers,
  MousePointer2,
  RefreshCw,
  Palette,
  TrendingUp,
  Database
} from "lucide-react";
import Plot from 'react-plotly.js';

export default function InsightsPage() {
  const [schema, setSchema] = useState<any>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [dbInfo, setDbInfo] = useState<{ type: string, name: string } | null>(null);

  const [selectedTable, setSelectedTable] = useState("");
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [chartColor, setChartColor] = useState("#4F46E5");

  const [chartData, setChartData] = useState<{ x: any[], y: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const tenantId = localStorage.getItem("tenant_id");

  // 1. Fetch Schema on mount
  useEffect(() => {
    const fetchSchema = async () => {
      if (!tenantId) return;
      try {
        const response = await api.getSchema(tenantId);
        setSchema(response.schema);
        setDbInfo({ type: response.db_type, name: response.database_name });

        if (response.schema) {
          const tableNames = Object.keys(response.schema);
          setTables(tableNames);
          if (tableNames.length > 0) {
            setSelectedTable(tableNames[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch schema", err);
      }
    };
    fetchSchema();
  }, [tenantId]);

  // 2. Update columns when table changes
  useEffect(() => {
    if (selectedTable && schema?.[selectedTable]) {
      const tableInfo = schema[selectedTable];
      const tableCols = tableInfo.columns.map((c: any) => c.name);
      setColumns(tableCols);
      if (tableCols.length > 0) {
        setXColumn(tableCols[0]);
        // Default Y to second column if exists, otherwise first
        setYColumn(tableCols.length > 1 ? tableCols[1] : tableCols[0]);
      }
    }
  }, [selectedTable, schema]);

  // 3. Fetch Chart Data when selections change
  const fetchChartData = async () => {
    if (!tenantId || !selectedTable || !xColumn || (!yColumn && chartType !== 'pie')) return;

    setLoading(true);
    try {
      const data = await api.getChartData({
        tenant_id: tenantId,
        table_name: selectedTable,
        x_column: xColumn,
        y_column: yColumn,
        chart_type: chartType
      });
      setChartData(data);
    } catch (err) {
      console.error("Failed to fetch chart data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [selectedTable, xColumn, yColumn, chartType]);

  const chartTypes = [
    { id: "bar", label: "Bar Chart", icon: BarChart3 },
    { id: "line", label: "Line Chart", icon: LineChartIcon },
    { id: "pie", label: "Pie Chart", icon: PieChartIcon },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2 flex items-center gap-3">
            <Layers className="w-8 h-8 text-[#4F46E5]" />
            Data Insights
            {dbInfo && (
              <span className="text-sm font-normal text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#4F46E5]" />
                {dbInfo.type}: {dbInfo.name}
              </span>
            )}
          </h1>
          <p className="text-[#64748B]">
            Visualize your data instantly from your connected database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role="Admin" />
          <ThemeToggle />
          <DatabaseHealthWidget />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Controls Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 space-y-6">
            <h2 className="text-lg font-semibold text-[#0F172A] border-b pb-4 mb-4">Chart Settings</h2>

            {/* Table Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#64748B] flex items-center gap-2">
                <Layers className="w-4 h-4" /> Select Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#4F46E5] outline-none transition-all"
              >
                {tables.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* X-Axis Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#64748B] flex items-center gap-2">
                  <MousePointer2 className="w-4 h-4" /> X-Axis (Labels)
                </label>
                <select
                  value={xColumn}
                  onChange={(e) => setXColumn(e.target.value)}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#4F46E5] outline-none transition-all text-sm"
                >
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Y-Axis Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#64748B] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Y-Axis (Values)
                </label>
                <select
                  value={yColumn}
                  onChange={(e) => setYColumn(e.target.value)}
                  disabled={chartType === 'pie'}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#4F46E5] outline-none transition-all text-sm disabled:opacity-50"
                >
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Chart Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#64748B] mb-2 block">Chart Type</label>
              <div className="grid grid-cols-3 gap-2">
                {chartTypes.map(type => {
                  const Icon = type.icon;
                  const active = chartType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setChartType(type.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${active
                        ? "bg-[#4F46E5]/10 border-[#4F46E5] text-[#4F46E5]"
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-gray-50"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#64748B] flex items-center gap-2">
                <Palette className="w-4 h-4" /> Theme Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={chartColor}
                  onChange={(e) => setChartColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
                />
                <span className="text-sm font-mono text-[#64748B]">{chartColor.toUpperCase()}</span>
              </div>
            </div>

            <button
              onClick={fetchChartData}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Refresh Data"}
            </button>
          </div>
        </div>

        {/* Chart Visualization Area */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 h-full min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-[#0F172A]">
                {selectedTable} Visualization
              </h2>
              <div className="text-sm text-[#64748B]">
                {chartData ? `${chartData.x.length} records found` : "Initializing..."}
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5]"></div>
                  <p className="text-[#64748B] animate-pulse">Syncing with database...</p>
                </div>
              ) : chartData ? (
                <Plot
                  data={[
                    {
                      x: (chartType === 'pie' ? undefined : (chartData?.x || undefined)) as any,
                      y: (chartType === 'pie' ? undefined : (chartData?.y || undefined)) as any,
                      labels: chartType === 'pie' ? (chartData?.x || undefined) : undefined,
                      values: chartType === 'pie' ? (chartData?.y || undefined) : undefined,
                      type: chartType as any,
                      mode: chartType === 'line' ? 'lines+markers' : undefined,
                      marker: {
                        color: chartType === 'pie' ? undefined : chartColor,
                      },
                      line: { shape: 'spline', color: chartColor, width: 3 }
                    },
                  ]}
                  layout={{
                    autosize: true,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    margin: { t: 20, r: 20, b: 50, l: 50 },
                    xaxis: {
                      gridcolor: '#F1F5F9',
                      tickfont: { color: '#64748B' },
                      showline: false
                    },
                    yaxis: {
                      gridcolor: '#F1F5F9',
                      tickfont: { color: '#64748B' },
                      showline: false
                    },
                  }}
                  useResizeHandler={true}
                  className="w-full h-full"
                  style={{ width: "100%", height: "100%" }}
                  config={{ responsive: true, displayModeBar: false }}
                />
              ) : (
                <div className="text-[#64748B] text-center max-w-xs">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Choose a table and columns to generate a smart chart from your data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}