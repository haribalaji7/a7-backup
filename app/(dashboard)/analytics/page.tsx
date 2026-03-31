"use client";
import dynamic from "next/dynamic";

const YieldChart = dynamic(() => import("@/components/YieldChart"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 220 }} />
});

const RevenueChart = dynamic(() => import("@/components/RevenueChart"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 220 }} />
});

const HealthTrendChart = dynamic(() => import("@/components/HealthTrendChart"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 200 }} />
});

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
        <div className="card">
          <div className="section-title">Crop Yield vs Target (kg/ha)</div>
          <YieldChart data={yieldData} />
        </div>

        <div className="card">
          <div className="section-title">Revenue vs Cost Trend (₹)</div>
          <RevenueChart data={monthlyRevenue} />
        </div>
      </div>

      <div className="card">
        <div className="section-title">Field Health Score Trend (4 weeks)</div>
        <HealthTrendChart data={healthScores} />
      </div>
    </div>
  );
}
