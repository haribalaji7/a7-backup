"use client";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import SidePanel from "@/components/SidePanel";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

interface AnalysisResult {
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  weather: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    rain: number;
    condition: string;
    icon: string;
    feels_like: number;
  };
  crops: {
    name: string;
    icon: string;
    confidence: number;
    reason: string;
    season: string;
    water_need: string;
    rank: number;
  }[];
  farming_tips: string[];
}

export default function FarmMapPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setPanelOpen(true);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/analyze/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze location");
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div>
      <div className="page-title">Farm health map</div>
      <div className="page-subtitle">Click anywhere on the map to analyze weather conditions and get crop recommendations</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Interactive Agri-Map</div>
        <MapView onLocationSelect={handleLocationSelect} />
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
            { color: "#3b82f6", label: "Selected location (click to analyze)" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color }} />
              <span style={{ color: "#374151" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <SidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        loading={loading}
        result={result}
        error={error}
      />
    </div>
  );
}
