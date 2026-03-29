"use client";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function FarmMapPage() {
  return (
    <div>
      <div className="page-title">Farm health map</div>
      <div className="page-subtitle">Visualise crop health, risk zones, and irrigation alerts on an interactive farm map</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Interactive map</div>
        <MapView />
      </div>

      {/* Legend */}
      <div className="card">
        <div className="section-title">Legend</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {[
            { color: "#22c55e", label: "Healthy vegetation" },
            { color: "#eab308", label: "Moderate stress (watch closely)" },
            { color: "#f97316", label: "Severe stress / disease risk" },
            { color: "#ef4444", label: "Critical alert / immediate action required" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color }} />
              <span style={{ color: "#374151" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
