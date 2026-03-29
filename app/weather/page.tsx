"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { Cloud, Droplets, Wind, Eye, Thermometer, Sun } from "lucide-react";

const hourlyData = [
  { time: "6am", temp: 26, humidity: 72 },
  { time: "9am", temp: 29, humidity: 68 },
  { time: "12pm", temp: 33, humidity: 60 },
  { time: "3pm", temp: 35, humidity: 55 },
  { time: "6pm", temp: 32, humidity: 62 },
  { time: "9pm", temp: 29, humidity: 70 },
  { time: "12am", temp: 27, humidity: 75 },
];

const weekData = [
  { day: "Mon", high: 33, low: 24, rain: 0 },
  { day: "Tue", high: 31, low: 23, rain: 5 },
  { day: "Wed", high: 29, low: 22, rain: 12 },
  { day: "Thu", high: 30, low: 23, rain: 3 },
  { day: "Fri", high: 34, low: 25, rain: 0 },
  { day: "Sat", high: 35, low: 26, rain: 0 },
  { day: "Sun", high: 32, low: 24, rain: 8 },
];

const weatherCards = [
  { icon: Thermometer, label: "Temperature", value: "32°C", sub: "Feels like 36°C", color: "#ef4444" },
  { icon: Droplets, label: "Humidity", value: "67%", sub: "High – monitor crops", color: "#3b82f6" },
  { icon: Wind, label: "Wind Speed", value: "14 km/h", sub: "Direction: SW", color: "#8b5cf6" },
  { icon: Eye, label: "Visibility", value: "9.2 km", sub: "Clear conditions", color: "#f59e0b" },
  { icon: Sun, label: "UV Index", value: "8 High", sub: "Peak at 12pm", color: "#f97316" },
  { icon: Cloud, label: "Rainfall", value: "4 mm", sub: "Expected today", color: "#22c55e" },
];

export default function WeatherPage() {
  return (
    <div>
      <div className="page-title">Weather Forecast</div>
      <div className="page-subtitle">Real-time weather data and forecasts for your farm location</div>

      {/* Location banner */}
      <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", border: "1px solid #86efac" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>📍 Nagpur, Maharashtra, India</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#14532d", margin: "8px 0 4px" }}>32°C</div>
            <div style={{ fontSize: 13, color: "#16a34a" }}>Partly cloudy · Feels like 36°C</div>
          </div>
          <div style={{ fontSize: 72, lineHeight: 1 }}>⛅</div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {weatherCards.map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={i} className="card-sm" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `${w.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} color={w.color} />
              </div>
              <div>
                <div className="stat-label">{w.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{w.value}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{w.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hourly chart */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title">Today's temperature trend</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[20, 40]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                formatter={(v: number) => [`${v}°C`, "Temp"]} />
              <Area type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2.5} fill="url(#tempGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-title">Humidity trend</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[40, 90]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, "Humidity"]} />
              <Area type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.5} fill="url(#humGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-day forecast table */}
      <div className="card">
        <div className="section-title">7-Day Forecast</div>
        <table className="table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Condition</th>
              <th>High</th>
              <th>Low</th>
              <th>Rainfall</th>
              <th>Farming Advisory</th>
            </tr>
          </thead>
          <tbody>
            {weekData.map((d) => (
              <tr key={d.day}>
                <td style={{ fontWeight: 600 }}>{d.day}</td>
                <td>{d.rain > 5 ? "🌧️ Rainy" : d.rain > 0 ? "⛅ Cloudy" : "☀️ Sunny"}</td>
                <td style={{ color: "#ef4444", fontWeight: 600 }}>{d.high}°C</td>
                <td style={{ color: "#3b82f6", fontWeight: 600 }}>{d.low}°C</td>
                <td>{d.rain > 0 ? `${d.rain} mm` : "—"}</td>
                <td style={{ fontSize: 12, color: "#6b7280" }}>
                  {d.rain > 8 ? "Avoid spraying, risk of fungal infection" :
                    d.high > 34 ? "Irrigate early morning, heat stress risk" :
                      "Ideal conditions for field operations"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
