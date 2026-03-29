"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Cloud, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const soilData = [
  { name: "N", value: 85 },
  { name: "P", value: 62 },
  { name: "K", value: 74 },
  { name: "Moisture", value: 58 },
];

const soilChartData = [
  { day: "Mon", N: 82, P: 60, K: 72, Moisture: 55 },
  { day: "Tue", N: 85, P: 62, K: 74, Moisture: 58 },
  { day: "Wed", N: 80, P: 58, K: 70, Moisture: 52 },
  { day: "Thu", N: 88, P: 65, K: 78, Moisture: 62 },
  { day: "Fri", N: 83, P: 61, K: 75, Moisture: 57 },
  { day: "Sat", N: 86, P: 64, K: 76, Moisture: 60 },
  { day: "Sun", N: 84, P: 63, K: 73, Moisture: 59 },
];

const weatherTrend = [
  { day: "Mon", temp: 31 },
  { day: "Tue", temp: 29 },
  { day: "Wed", temp: 32 },
  { day: "Thu", temp: 30 },
  { day: "Fri", temp: 33 },
  { day: "Sat", temp: 31 },
  { day: "Sun", temp: 34 },
];

const alerts = [
  { type: "yellow", icon: "⚠️", text: "Low soil moisture detected in Field B", time: "2h ago" },
  { type: "red", icon: "🚨", text: "Pest risk high — northern wheat row", time: "5h ago" },
  { type: "green", icon: "✅", text: "Irrigation completed successfully", time: "1d ago" },
];

function CountUp({ end, prefix = "" }: { end: number; prefix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{prefix}{count}</span>;
}

export default function HomePage() {
  const [setupData, setSetupData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("farm_setup_data");
    if (stored) setSetupData(JSON.parse(stored));
  }, []);

  return (
    <div>
      <div className="page-title">Farm health overview</div>
      <div className="page-subtitle">Monitor crop health, weather, soil and Ai-powered insights for your farm</div>

      {!setupData && (
        <div className="card" style={{ 
          background: "linear-gradient(90deg, #064e3b 0%, #065f46 100%)", 
          color: "white", 
          marginBottom: 24, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          border: "1px solid #059669",
          padding: "16px 24px"
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Complete Your Farm Setup</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>To get more accurate AI advice, please provide your farm's location and soil type.</div>
          </div>
          <Link href="/setup">
            <button className="btn btn-green" style={{ background: "white", color: "#065f46", border: "none", fontWeight: 600 }}>
              Start Wizard
            </button>
          </Link>
        </div>
      )}

      {setupData && (
        <div className="card" style={{ marginBottom: 24, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div style={{ display: "flex", gap: 32 }}>
            <div>
              <div className="stat-label">Farm Location</div>
              <div style={{ fontWeight: 600, color: "#16a34a" }}>{setupData.location}</div>
            </div>
            <div>
              <div className="stat-label">Soil Profile</div>
              <div style={{ fontWeight: 600, color: "#16a34a" }}>{setupData.soilType} Soil</div>
            </div>
            <div>
              <div className="stat-label">Area</div>
              <div style={{ fontWeight: 600, color: "#16a34a" }}>{setupData.landArea} Acres</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {/* Weather */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Cloud size={16} color="#16a34a" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Current weather</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div className="stat-label">Air temperature</div>
              <div className="stat-value"><CountUp end={32} />°C</div>
            </div>
            <div>
              <div className="stat-label">Humidity</div>
              <div className="stat-value"><CountUp end={67} />%</div>
            </div>
          </div>
        </div>

        {/* Yield */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TrendingUp size={16} color="#16a34a" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Yield forecast</span>
          </div>
          <div className="stat-label">AI estimated for current season</div>
          <div className="stat-value stat-positive"><CountUp end={4200} /> kg/ha</div>
          <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>↑ 8% above last season</div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color="#eab308" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Active alerts</span>
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {alerts.filter(a => a.type !== "green").length > 0
              ? `${alerts.filter(a => a.type !== "green").length} active alerts requiring attention`
              : "No active alerts right now"}
          </div>
          {alerts.filter(a => a.type !== "green").map((a, i) => (
            <div key={i} style={{ marginTop: 8, fontSize: 12, color: a.type === "red" ? "#dc2626" : "#b45309" }}>
              {a.icon} {a.text}
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2">
        {/* Soil nutrient chart */}
        <div className="card">
          <div className="section-title">Soil nutrient balance</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={soilChartData}>
              <defs>
                <linearGradient id="colorN" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Area type="monotone" dataKey="N" stroke="#22c55e" strokeWidth={2.5} fill="url(#colorN)" dot={false} />
              <Area type="monotone" dataKey="P" stroke="#3b82f6" strokeWidth={2} fill="none" dot={false} />
              <Area type="monotone" dataKey="K" stroke="#f59e0b" strokeWidth={2} fill="none" dot={false} />
              <Area type="monotone" dataKey="Moisture" stroke="#8b5cf6" strokeWidth={2} fill="none" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {[["#22c55e","N"],["#3b82f6","P"],["#f59e0b","K"],["#8b5cf6","Moisture"]].map(([c,l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly weather trend */}
        <div className="card">
          <div className="section-title">Weekly weather trend</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weatherTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[25, 38]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} formatter={(v: number) => [`${v}°C`, "Temp"]} />
              <Line type="monotone" dataKey="temp" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert panel */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-title">Recent alerts & notifications</div>
        {alerts.map((a, i) => (
          <div key={i} className={`alert-item alert-item-${a.type}`}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1f2937" }}>{a.text}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
