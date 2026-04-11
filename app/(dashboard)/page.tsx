"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Cloud, TrendingUp, AlertTriangle, Newspaper, Landmark } from "lucide-react";

const SchemeCard = dynamic(() => import("@/components/farmers/SchemeCard"), { ssr: false });
const NewsSection = dynamic(() => import("@/components/farmers/NewsSection"), { ssr: false });

const SoilChart = dynamic(
  () => import("@/components/SoilChart"),
  { ssr: false, loading: () => <div className="skeleton" style={{ height: 180 }} /> }
);

const WeatherTrendChart = dynamic(
  () => import("@/components/WeatherTrendChart"),
  { ssr: false, loading: () => <div className="skeleton" style={{ height: 180 }} /> }
);

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
  const [count, setCount] = useState(end);
  const prevEndRef = useRef(end);
  
  useEffect(() => {
    if (prevEndRef.current === end) return;
    prevEndRef.current = end;
    
    const duration = 500;
    const steps = 30;
    const stepValue = end / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current = Math.min(end, Math.round(stepValue * step));
      setCount(current);
      if (step >= steps) {
        clearInterval(timer);
        setCount(end);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [end]);

  return <span>{prefix}{count}</span>;
}

interface SetupData {
  location: string;
  soilType: string;
  landArea: string;
}

interface HomeWeather {
  temperature: number;
  humidity: number;
}

const alertLegend = [
  { color: "#22c55e", label: "N" },
  { color: "#3b82f6", label: "P" },
  { color: "#f59e0b", label: "K" },
  { color: "#8b5cf6", label: "Moisture" },
];

export default function HomePage() {
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [weather, setWeather] = useState<HomeWeather | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"schemes" | "news">("schemes");
  const [schemes, setSchemes] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [schemeCategory, setSchemeCategory] = useState("all");
  const [newsCategory, setNewsCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("farm_setup_data");
    if (stored) {
      try {
        setSetupData(JSON.parse(stored));
      } catch {
        // ignore invalid JSON
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(
            `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m` +
            `&timezone=auto`
          )
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                setWeather({
                  temperature: Math.round(data.current.temperature_2m),
                  humidity: Math.round(data.current.relative_humidity_2m),
                });
              }
            })
            .catch(() => {});
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schemesRes, newsRes] = await Promise.all([
          fetch(`/api/schemes?category=${schemeCategory}&search=${searchQuery}`),
          fetch(`/api/news?category=${newsCategory}`),
        ]);
        const schemesData = await schemesRes.json();
        const newsData = await newsRes.json();
        setSchemes(schemesData.schemes || []);
        setNews(newsData.news || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schemeCategory, newsCategory]);

  const activeAlerts = useMemo(() => alerts.filter(a => a.type !== "green"), []);
  const alertCount = activeAlerts.length;

  const displayTemp = weather?.temperature ?? 32;
  const displayHumidity = weather?.humidity ?? 67;

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
            <div style={{ fontSize: 13, opacity: 0.9 }}>To get more accurate AI advice, please provide your farm&apos;s location and soil type.</div>
          </div>
          <Link href="/setup">
            <button className="btn btn-green" style={{ background: "white", color: "#065f46", border: "none", fontWeight: 600 }}>
              Start Wizard
            </button>
          </Link>
        </div>
      )}

      {setupData && (
        <div className="card" style={{ marginBottom: 24, background: "var(--bg-page)", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", gap: 32 }}>
            <div>
              <div className="stat-label">Farm Location</div>
              <div style={{ fontWeight: 600, color: "var(--green-primary)" }}>{setupData.location}</div>
            </div>
            <div>
              <div className="stat-label">Soil Profile</div>
              <div style={{ fontWeight: 600, color: "var(--green-primary)" }}>{setupData.soilType} Soil</div>
            </div>
            <div>
              <div className="stat-label">Area</div>
              <div style={{ fontWeight: 600, color: "var(--green-primary)" }}>{setupData.landArea} Acres</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Cloud size={16} color="#16a34a" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Current weather</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div className="stat-label">Air temperature</div>
              <div className="stat-value">{mounted ? <CountUp end={displayTemp} /> : displayTemp}°C</div>
            </div>
            <div>
              <div className="stat-label">Humidity</div>
              <div className="stat-value">{mounted ? <CountUp end={displayHumidity} /> : displayHumidity}%</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TrendingUp size={16} color="#16a34a" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Yield forecast</span>
          </div>
          <div className="stat-label">AI estimated for current season</div>
          <div className="stat-value stat-positive">{mounted ? <CountUp end={4200} /> : "4,200"} kg/ha</div>
          <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>↑ 8% above last season</div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color="#eab308" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Active alerts</span>
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {alertCount > 0 ? `${alertCount} active alerts requiring attention` : "No active alerts right now"}
          </div>
          {activeAlerts.map((a) => (
            <div key={a.text} style={{ marginTop: 8, fontSize: 12, color: a.type === "red" ? "#dc2626" : "#b45309" }}>
              {a.icon} {a.text}
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Soil nutrient balance</div>
          <SoilChart data={soilChartData} />
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {alertLegend.map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Weekly weather trend</div>
          <WeatherTrendChart data={weatherTrend} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-title">Recent alerts & notifications</div>
        {alerts.map((a) => (
          <div key={a.text} className={`alert-item alert-item-${a.type}`}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1f2937" }}>{a.text}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card farmers-hub" style={{ marginTop: 24, padding: 24 }}>
        <div className="farmers-hub-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ 
              background: "linear-gradient(135deg, #16a34a, #15803d)", 
              padding: 10, 
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Landmark size={20} color="white" />
            </div>
            <div>
              <div className="section-title" style={{ marginBottom: 0 }}>Farmers Hub</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Government Schemes & Daily News</div>
            </div>
          </div>
        </div>

        <div className="farmers-tabs">
          <button 
            className={`farmers-tab ${activeTab === "schemes" ? "active" : ""}`}
            onClick={() => setActiveTab("schemes")}
          >
            <Landmark size={14} style={{ display: "inline", marginRight: 6 }} />
            Schemes
          </button>
          <button 
            className={`farmers-tab ${activeTab === "news" ? "active" : ""}`}
            onClick={() => setActiveTab("news")}
          >
            <Newspaper size={14} style={{ display: "inline", marginRight: 6 }} />
            News
          </button>
        </div>

        <div className="farmers-filter">
          {activeTab === "schemes" ? (
            <>
              <input 
                type="text" 
                className="farmers-search" 
                placeholder="Search schemes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select 
                className="farmers-select"
                value={schemeCategory}
                onChange={(e) => setSchemeCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Financial">Financial</option>
                <option value="Insurance">Insurance</option>
                <option value="Credit">Credit</option>
                <option value="Equipment">Equipment</option>
                <option value="Organic Farming">Organic Farming</option>
                <option value="Production">Production</option>
                <option value="Horticulture">Horticulture</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </>
          ) : (
            <select 
              className="farmers-select"
              value={newsCategory}
              onChange={(e) => setNewsCategory(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="all">All Categories</option>
              <option value="Schemes">Schemes</option>
              <option value="Weather">Weather</option>
              <option value="Market">Market</option>
              <option value="Crop Health">Crop Health</option>
              <option value="Logistics">Logistics</option>
            </select>
          )}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="farmers-skeleton" style={{ height: 200 }} />
            ))}
          </div>
        ) : activeTab === "schemes" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {schemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        ) : (
          <NewsSection news={news} />
        )}
      </div>
    </div>
  );
}
