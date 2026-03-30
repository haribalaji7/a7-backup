"use client";
import dynamic from "next/dynamic";

const NutrientRadarChart = dynamic(() => import("@/components/NutrientRadarChart"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 240 }} />
});

const NutrientTrendChart = dynamic(() => import("@/components/NutrientTrendChart"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 240 }} />
});

const soilProfile = [
  { label: "Nitrogen (N)", value: 78, ideal: "60–90 kg/ha", status: "good", unit: "kg/ha" },
  { label: "Phosphorus (P)", value: 42, ideal: "30–60 kg/ha", status: "good", unit: "kg/ha" },
  { label: "Potassium (K)", value: 95, ideal: "80–120 kg/ha", status: "good", unit: "kg/ha" },
  { label: "Moisture", value: 38, ideal: "40–60%", status: "low", unit: "%" },
  { label: "pH Level", value: 6.8, ideal: "6.0–7.5", status: "good", unit: "" },
  { label: "Organic C.", value: 2.1, ideal: "1.5–3.0%", status: "good", unit: "%" },
];

const radarData = [
  { subject: "N", A: 78, fullMark: 100 },
  { subject: "P", A: 42, fullMark: 100 },
  { subject: "K", A: 95, fullMark: 100 },
  { subject: "pH", A: 68, fullMark: 100 },
  { subject: "OC", A: 70, fullMark: 100 },
  { subject: "Moisture", A: 38, fullMark: 100 },
];

const trendData = [
  { month: "Oct", N: 72, P: 38, K: 88, Mo: 45 },
  { month: "Nov", N: 75, P: 40, K: 90, Mo: 42 },
  { month: "Dec", N: 70, P: 37, K: 85, Mo: 38 },
  { month: "Jan", N: 73, P: 39, K: 92, Mo: 40 },
  { month: "Feb", N: 76, P: 41, K: 94, Mo: 36 },
  { month: "Mar", N: 78, P: 42, K: 95, Mo: 38 },
];

const recommendations = [
  { icon: "💧", title: "Low Moisture Alert", desc: "Current soil moisture (38%) is below optimal (40-60%). Schedule irrigation within the next 24 hours.", priority: "high" },
  { icon: "🌿", title: "Nitrogen Adequate", desc: "Nitrogen levels are good. Maintain current fertilisation schedule.", priority: "low" },
  { icon: "🌱", title: "Crop Suggestion", desc: "Current NPK levels are ideal for wheat, chickpea, or sorghum cultivation.", priority: "medium" },
];

export default function SoilPage() {
  return (
    <div>
      <div className="page-title">Soil Health Monitor</div>
      <div className="page-subtitle">Real-time soil nutrient analysis and recommendations for optimal crop growth</div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        {soilProfile.map((s) => {
          const pct = Math.min(100, s.label === "pH Level" ? ((s.value - 4) / 4) * 100 : s.label === "Organic C." ? s.value * 30 : s.value);
          const color = s.status === "good" ? "#22c55e" : s.status === "low" ? "#eab308" : "#ef4444";
          return (
            <div key={s.label} className="card-sm">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{s.label}</div>
                <span className={`badge ${s.status === "good" ? "badge-green" : "badge-yellow"}`}>{s.status}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                {s.value}{s.unit}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Ideal: {s.ideal}</div>
              <div style={{ height: 5, borderRadius: 3, background: "#f0f0f0" }}>
                <div style={{ height: "100%", borderRadius: 3, background: color, width: `${pct}%`, transition: "width 1s ease" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title">Nutrient Balance Radar</div>
          <NutrientRadarChart data={radarData} />
        </div>

        <div className="card">
          <div className="section-title">6-Month Nutrient Trend</div>
          <NutrientTrendChart data={trendData} />
        </div>
      </div>

      <div className="card">
        <div className="section-title">AI Soil Recommendations</div>
        {recommendations.map((r, i) => (
          <div key={i} className={`alert-item alert-item-${r.priority === "high" ? "red" : r.priority === "medium" ? "yellow" : "green"}`}>
            <span style={{ fontSize: 20 }}>{r.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
