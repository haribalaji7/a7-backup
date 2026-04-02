"use client";
import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type NDVIResult = {
  stats: { avg_ndvi: number; green_pct: number; yellow_pct: number; red_pct: number; worst_zone: string; worst_ndvi: number };
  weather: string;
  advice: string;
  ndvi_map_base64: string;
  trend: { date: string; ndvi: number }[];
  zones: { id: string; ndvi: string; pct: number; color: string; status: string }[];
  field: string;
  crop: string;
  bbox: number[];
};

export default function SatellitePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NDVIResult | null>(null);
  const [error, setError] = useState("");
  const [farmData, setFarmData] = useState<{location: string; landArea: string; crop: string; lat?: number; lng?: number} | null>(null);

  // Load farm data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("farm_setup_data");
      if (stored) {
        const data = JSON.parse(stored);
        setFarmData(data);
      }
    } catch (e) {
      console.error("Failed to load farm data:", e);
    }
  }, []);

  // Calculate bbox from farm location coordinates
  const getBbox = () => {
    if (farmData?.lat && farmData?.lng) {
      const buffer = 0.05; // ~5km buffer
      return [
        farmData.lng - buffer,
        farmData.lat - buffer,
        farmData.lng + buffer,
        farmData.lat + buffer
      ];
    }
    // Default to India center if no location
    return [77.5, 12.8, 78.0, 13.2];
  };

  const analyzeField = useCallback(async () => {
    setLoading(true);
    setError("");
    setResult(null);
    
    const bbox = getBbox();
    const cropType = farmData?.crop || "Wheat";
    const fieldName = farmData?.location || "My Field";
    
    try {
      const res = await fetch("/api/satellite/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bbox: bbox,
          crop_type: cropType,
          field_name: fieldName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [farmData]);

  const ndviColor = (val: number) => (val >= 0.6 ? "#22c55e" : val >= 0.3 ? "#eab308" : "#ef4444");
  const ndviDesc = (val: number) => (val >= 0.6 ? "Excellent" : val >= 0.3 ? "Moderate" : "Poor");

  return (
    <div>
      <div className="page-title">Satellite Monitoring</div>
      <div className="page-subtitle">NDVI analysis from Sentinel-2 imagery with AI-powered farmer advice</div>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={analyzeField}
          disabled={loading}
          style={{
            padding: "10px 24px",
            background: loading ? "#9ca3af" : "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
          }}
        >
          {loading ? "Analyzing..." : "Analyze Field"}
        </button>
        {error && <p style={{ color: "#ef4444", marginTop: 8, fontSize: 13 }}>{error}</p>}
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        {result ? (
          <>
            <div className="card-sm" style={{ borderTop: `3px solid ${ndviColor(result.stats.avg_ndvi)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="stat-label">Avg NDVI</div>
                <span style={{ fontSize: 20 }}>🌿</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: ndviColor(result.stats.avg_ndvi) }}>{result.stats.avg_ndvi}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Vegetation index · {ndviDesc(result.stats.avg_ndvi)}</div>
            </div>
            <div className="card-sm" style={{ borderTop: "3px solid #3b82f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="stat-label">Weather</div>
                <span style={{ fontSize: 20 }}>🌤️</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", lineHeight: 1.4 }}>{result.weather}</div>
            </div>
            <div className="card-sm" style={{ borderTop: "3px solid #8b5cf6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="stat-label">Worst Zone</div>
                <span style={{ fontSize: 20 }}>⚠️</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{result.stats.worst_zone}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>NDVI {result.stats.worst_ndvi}</div>
            </div>
          </>
        ) : (
          [
            { label: "Avg NDVI", value: "—", desc: "Click Analyze to fetch", color: "#9ca3af", icon: "🌿" },
            { label: "Weather", value: "—", desc: "Will be fetched automatically", color: "#9ca3af", icon: "🌤️" },
            { label: "Worst Zone", value: "—", desc: "Will be identified from map", color: "#9ca3af", icon: "⚠️" },
          ].map((c, i) => (
            <div key={i} className="card-sm" style={{ borderTop: `3px solid ${c.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="stat-label">{c.label}</div>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{c.desc}</div>
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
          <div className="section-title" style={{ margin: 0, color: "#f8fafc" }}>🛰️ Sentinel-2 Satellite Imagery</div>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#94a3b8" }}>NDVI Analysis • 10m Resolution • Real-time</p>
        </div>
        
        {result?.ndvi_map_base64 ? (
          <div style={{ position: "relative", background: "#1e293b" }}>
            <div style={{ position: "relative" }}>
              <img
                src={`data:image/png;base64,${result.ndvi_map_base64}`}
                alt="NDVI Map"
                style={{ 
                  width: "100%", 
                  height: "auto", 
                  display: "block", 
                  minHeight: 320,
                  filter: "contrast(1.1) saturate(1.2)",
                  borderRadius: 0
                }}
              />
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
                pointerEvents: "none"
              }} />
              <div style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: "rgba(15, 23, 42, 0.9)",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #334155",
                backdropFilter: "blur(4px)"
              }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>SENTINEL-2</div>
                <div style={{ fontSize: 12, color: "#f8fafc", fontWeight: 600 }}>Band B04 + B08</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>10m Spatial Resolution</div>
              </div>
              <div style={{ 
                position: "absolute", 
                bottom: 12, 
                right: 12, 
                background: "rgba(15, 23, 42, 0.95)", 
                padding: "12px 16px", 
                borderRadius: 8,
                border: "1px solid #334155",
                backdropFilter: "blur(8px)",
                minWidth: 160
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#f8fafc", marginBottom: 8, letterSpacing: 1 }}>VEGETATION INDEX</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 24, height: 14, borderRadius: 3, background: "linear-gradient(90deg, #22c55e, #16a34a)" }} />
                    <div>
                      <span style={{ color: "#f8fafc", fontSize: 12, fontWeight: 500 }}>Healthy</span>
                      <span style={{ color: "#64748b", fontSize: 10, marginLeft: 6 }}>&gt;0.6</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 24, height: 14, borderRadius: 3, background: "linear-gradient(90deg, #eab308, #ca8a04)" }} />
                    <div>
                      <span style={{ color: "#f8fafc", fontSize: 12, fontWeight: 500 }}>Stressed</span>
                      <span style={{ color: "#64748b", fontSize: 10, marginLeft: 6 }}>0.3-0.6</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 24, height: 14, borderRadius: 3, background: "linear-gradient(90deg, #ef4444, #dc2626)" }} />
                    <div>
                      <span style={{ color: "#f8fafc", fontSize: 12, fontWeight: 500 }}>Severe</span>
                      <span style={{ color: "#64748b", fontSize: 10, marginLeft: 6 }}>&lt;0.3</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                background: "rgba(15, 23, 42, 0.9)",
                padding: "6px 10px",
                borderRadius: 4,
                border: "1px solid #334155"
              }}>
                <div style={{ fontSize: 10, color: "#64748b" }}>📍 {result.bbox[0].toFixed(2)}°E, {result.bbox[1].toFixed(2)}°N</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 64, opacity: 0.5 }}>🛰️</div>
            <div style={{ color: "#64748b", fontSize: 14 }}>{loading ? "Acquiring satellite data..." : "Click Analyze to fetch NDVI imagery"}</div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>Sentinel-2 • 10m Resolution</div>
          </div>
        )}
      </div>

      {result?.advice && (
        <div className="card" style={{ marginBottom: 20, borderLeft: "4px solid #22c55e" }}>
          <div className="section-title">AI Agronomist Advice</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#374151" }}>
            {result.advice}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title">NDVI Trend</div>
          {result ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={result.trend}>
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
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No data yet</div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Zone Health Summary</div>
          {result ? (
            <table className="table">
              <thead>
                <tr><th>Zone</th><th>NDVI Range</th><th>Coverage</th><th>Status</th></tr>
              </thead>
              <tbody>
                {result.zones.map(z => (
                  <tr key={z.id}>
                    <td style={{ fontWeight: 600 }}>{z.id}</td>
                    <td>{z.ndvi}</td>
                    <td>{z.pct}%</td>
                    <td><span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: z.color }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: z.color, display: "inline-block" }} />
                      {z.status}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No data yet</div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Satellite View – Farm Zones</div>
        <MapView />
      </div>
    </div>
  );
}
