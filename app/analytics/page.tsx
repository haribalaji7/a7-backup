"use client";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const yieldData = [
  { crop: "Wheat", yield: 3800, target: 4200 },
  { crop: "Rice", yield: 4200, target: 4500 },
  { crop: "Cotton", yield: 1800, target: 2200 },
  { crop: "Soybean", yield: 2100, target: 2400 },
  { crop: "Maize", yield: 5200, target: 5500 },
];

const monthlyRevenue = [
  { month: "Oct", revenue: 42000, cost: 28000 },
  { month: "Nov", revenue: 38000, cost: 25000 },
  { month: "Dec", revenue: 15000, cost: 18000 },
  { month: "Jan", revenue: 22000, cost: 16000 },
  { month: "Feb", revenue: 35000, cost: 22000 },
  { month: "Mar", revenue: 48000, cost: 30000 },
];

const healthScores = [
  { week: "W1", Field_A: 88, Field_B: 72, Field_C: 55 },
  { week: "W2", Field_A: 85, Field_B: 68, Field_C: 58 },
  { week: "W3", Field_A: 87, Field_B: 74, Field_C: 52 },
  { week: "W4", Field_A: 90, Field_B: 71, Field_C: 60 },
];

const kpiCards = [
  { label: "Total Cultivated Area", value: "12.5 ha", icon: "🌾", trend: "+2 ha", positive: true },
  { label: "Avg Yield This Season", value: "3,420 kg/ha", icon: "📊", trend: "+8%", positive: true },
  { label: "Input Cost / ha", value: "₹18,200", icon: "💰", trend: "-5%", positive: true },
  { label: "Farm Health Score", value: "78 / 100", icon: "💚", trend: "+4 pts", positive: true },
];

export default function AnalyticsPage() {
  return (
    <div>
      <div className="page-title">Farm Analytics</div>
      <div className="page-subtitle">Comprehensive performance metrics, yield analysis and financial insights</div>

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {kpiCards.map((k, i) => (
          <div key={i} className="card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="stat-label">{k.label}</div>
              <span style={{ fontSize: 20 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "6px 0 4px" }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.positive ? "#16a34a" : "#dc2626", fontWeight: 500 }}>
              {k.positive ? "↑" : "↓"} {k.trend} vs last season
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Yield vs Target */}
        <div className="card">
          <div className="section-title">Crop Yield vs Target (kg/ha)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yieldData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="crop" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="yield" name="Actual" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="target" name="Target" fill="#bbf7d0" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Cost */}
        <div className="card">
          <div className="section-title">Revenue vs Cost Trend (₹)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                formatter={(v: number, n: string) => [`₹${v.toLocaleString("en-IN")}`, n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
              <Area type="monotone" dataKey="cost" name="Cost" stroke="#ef4444" strokeWidth={2} fill="url(#costGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Field health trend */}
      <div className="card">
        <div className="section-title">Field Health Score Trend (4 weeks)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={healthScores}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[40, 100]} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Field_A" name="Field A" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} />
            <Line type="monotone" dataKey="Field_B" name="Field B" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 4 }} />
            <Line type="monotone" dataKey="Field_C" name="Field C" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
