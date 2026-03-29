"use client";
import dynamic from "next/dynamic";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const ndviTrend = [
  { date: "Mar 1", ndvi: 0.71, ndwi: 0.42, evi: 0.55 },
  { date: "Mar 5", ndvi: 0.74, ndwi: 0.44, evi: 0.57 },
  { date: "Mar 10", ndvi: 0.72, ndwi: 0.41, evi: 0.54 },
  { date: "Mar 15", ndvi: 0.76, ndwi: 0.46, evi: 0.59 },
  { date: "Mar 20", ndvi: 0.78, ndwi: 0.48, evi: 0.61 },
  { date: "Mar 24", ndvi: 0.80, ndwi: 0.50, evi: 0.63 },
];

const zones = [
  { id: "Field A", ndvi: 0.82, ndwi: 0.51, evi: 0.64, health: "Healthy", color: "#22c55e" },
  { id: "Field B", ndvi: 0.54, ndwi: 0.32, evi: 0.41, health: "Moderate stress", color: "#eab308" },
  { id: "Field C", ndvi: 0.31, ndwi: 0.18, evi: 0.26, health: "High risk", color: "#ef4444" },
  { id: "Field D", ndvi: 0.79, ndwi: 0.48, evi: 0.60, health: "Healthy", color: "#22c55e" },
  { id: "Field E", ndvi: 0.42, ndwi: 0.24, evi: 0.35, health: "Severe stress", color: "#f97316" },
];

export default function SatellitePage() {
  return (
    <div>
      <div className="page-title">Satellite Monitoring</div>
      <div className="page-subtitle">NDVI, NDWI and EVI indices from satellite imagery for crop health assessment</div>

      {/* Index cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: "Avg NDVI", value: "0.78", desc: "Vegetation index · Excellent", color: "#22c55e", icon: "🌿" },
          { label: "Avg NDWI", value: "0.48", desc: "Water index · Good moisture", color: "#3b82f6", icon: "💧" },
          { label: "Avg EVI", value: "0.61", desc: "Enhanced vegetation · Strong", color: "#8b5cf6", icon: "📡" },
        ].map((c, i) => (
          <div key={i} className="card-sm" style={{ borderTop: `3px solid ${c.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="stat-label">{c.label}</div>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Satellite map */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Satellite View – Farm Zones</div>
        <MapView />
      </div>

      {/* NDVI trend chart */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title">NDVI / NDWI / EVI – 24-day trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ndviTrend}>
              <defs>
                <linearGradient id="ndviG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[0, 1]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Area type="monotone" dataKey="ndvi" stroke="#22c55e" strokeWidth={2} fill="url(#ndviG)" dot={false} />
              <Area type="monotone" dataKey="ndwi" stroke="#3b82f6" strokeWidth={2} fill="none" dot={false} />
              <Area type="monotone" dataKey="evi" stroke="#8b5cf6" strokeWidth={2} fill="none" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Zone table */}
        <div className="card">
          <div className="section-title">Zone Health Summary</div>
          <table className="table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>NDVI</th>
                <th>NDWI</th>
                <th>EVI</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.id}>
                  <td style={{ fontWeight: 600 }}>{z.id}</td>
                  <td>{z.ndvi}</td>
                  <td>{z.ndwi}</td>
                  <td>{z.evi}</td>
                  <td><span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: z.color }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: z.color, display: "inline-block" }} />
                    {z.health}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
