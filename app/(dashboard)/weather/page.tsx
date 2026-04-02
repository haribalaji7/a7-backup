"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Cloud, Droplets, Wind, Eye, Thermometer, Sun } from "lucide-react";

const WeatherChart = dynamic(
  () => import("@/components/WeatherChart"),
  { ssr: false, loading: () => <div className="skeleton" style={{ height: 180 }} /> }
);

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  uvIndex: number;
  visibility: number;
  apparentTemperature: number;
  weatherCode: number;
  location: { lat: number; lng: number; name: string };
  hourly: { time: string; temp: number; humidity: number }[];
  daily: { day: string; high: number; low: number; rain: number }[];
}

const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Depositing rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌧️" },
  53: { label: "Moderate drizzle", icon: "🌧️" },
  55: { label: "Dense drizzle", icon: "🌧️" },
  61: { label: "Slight rain", icon: "🌧️" },
  63: { label: "Moderate rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Slight snow", icon: "🌨️" },
  73: { label: "Moderate snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Moderate showers", icon: "🌦️" },
  82: { label: "Violent showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Thunderstorm with heavy hail", icon: "⛈️" },
};

const getWeatherInfo = (code: number) => WEATHER_CODES[code] || { label: "Unknown", icon: "❓" };

const getAdvisory = (rain: number, high: number): string => {
  if (rain > 8) return "Avoid spraying, risk of fungal infection";
  if (high > 34) return "Irrigate early morning, heat stress risk";
  return "Ideal conditions for field operations";
};

const formatHour = (isoTime: string): string => {
  const date = new Date(isoTime);
  return date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
};

const getDayName = (isoTime: string, index: number): string => {
  if (index === 0) return "Today";
  const date = new Date(isoTime);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const ICON_MAP = { Thermometer, Droplets, Wind, Eye, Sun, Cloud };
type IconKey = keyof typeof ICON_MAP;

const weatherCardConfig = [
  { key: "temp" as const, icon: "Thermometer" as IconKey, label: "Temperature", color: "#ef4444" },
  { key: "humidity" as const, icon: "Droplets" as IconKey, label: "Humidity", color: "#3b82f6" },
  { key: "windSpeed" as const, icon: "Wind" as IconKey, label: "Wind Speed", color: "#8b5cf6" },
  { key: "visibility" as const, icon: "Eye" as IconKey, label: "Visibility", color: "#f59e0b" },
  { key: "uvIndex" as const, icon: "Sun" as IconKey, label: "UV Index", color: "#f97316" },
  { key: "rainfall" as const, icon: "Cloud" as IconKey, label: "Rainfall", color: "#22c55e" },
];

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,rain,uv_index,visibility` +
            `&hourly=temperature_2m,relative_humidity_2m` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,rain_sum` +
            `&timezone=auto&forecast_days=7`
          );
          if (!response.ok) throw new Error("Failed to fetch weather data");
          const data = await response.json();

          const current = data.current;
          const hourly = data.hourly;
          const daily = data.daily;
          const now = new Date();
          const currentHourIndex = now.getHours();

          const hourlyData: { time: string; temp: number; humidity: number }[] = [];
          for (let i = 0; i < 24; i += 3) {
            const idx = (currentHourIndex + i) % 24;
            hourlyData.push({
              time: formatHour(hourly.time[idx]),
              temp: Math.round(hourly.temperature_2m[idx]),
              humidity: Math.round(hourly.relative_humidity_2m[idx]),
            });
          }

          const dailyData = daily.time.map((t: string, i: number) => ({
            day: getDayName(t, i),
            high: Math.round(daily.temperature_2m_max[i]),
            low: Math.round(daily.temperature_2m_min[i]),
            rain: daily.rain_sum[i] || 0,
          }));

          setWeather({
            temperature: Math.round(current.temperature_2m),
            humidity: Math.round(current.relative_humidity_2m),
            windSpeed: Math.round(current.wind_speed_10m),
            rainfall: current.rain || 0,
            uvIndex: current.uv_index || 0,
            visibility: (current.visibility || 10000) / 1000,
            apparentTemperature: Math.round(current.apparent_temperature),
            weatherCode: current.weather_code,
            location: { lat: latitude, lng: longitude, name: "Your Location" },
            hourly: hourlyData,
            daily: dailyData,
          });
          setLoading(false);
        } catch {
          setError("Failed to fetch weather data. Please try again.");
          setLoading(false);
        }
      },
      () => {
        setLocationDenied(true);
        setLoading(false);
      }
    );
  }, []);

  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode) : null;

  const weatherCards = useMemo(() => {
    if (!weather) return [];
    return weatherCardConfig.map(config => {
      let value: string;
      let sub: string;
      const Icon = ICON_MAP[config.icon];
      
      switch (config.key) {
        case "temp":
          value = `${weather.temperature}°C`;
          sub = `Feels like ${weather.apparentTemperature}°C`;
          break;
        case "humidity":
          value = `${weather.humidity}%`;
          sub = weather.humidity > 70 ? "High – monitor crops" : "Optimal levels";
          break;
        case "windSpeed":
          value = `${weather.windSpeed} km/h`;
          sub = "Direction: SW";
          break;
        case "visibility":
          value = `${weather.visibility.toFixed(1)} km`;
          sub = weather.visibility > 8 ? "Clear conditions" : "Reduced visibility";
          break;
        case "uvIndex":
          value = `${weather.uvIndex} ${weather.uvIndex >= 6 ? "High" : weather.uvIndex >= 3 ? "Moderate" : "Low"}`;
          sub = "Peak at 12pm";
          break;
        case "rainfall":
          value = weather.rainfall > 0 ? `${weather.rainfall} mm` : "0 mm";
          sub = weather.rainfall > 0 ? "Expected today" : "No rainfall";
          break;
      }
      
      return { Icon, label: config.label, value, sub, color: config.color };
    });
  }, [weather]);

  if (loading) {
    return (
      <div>
        <div className="page-title">Weather Forecast</div>
        <div className="page-subtitle">Real-time weather data and forecasts for your farm location</div>
        <div className="card skeleton" style={{ height: 140, marginBottom: 20 }} />
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card-sm skeleton" style={{ height: 80 }} />)}
        </div>
        <div className="grid-2">
          <div className="card skeleton" style={{ height: 220 }} />
          <div className="card skeleton" style={{ height: 220 }} />
        </div>
      </div>
    );
  }

  if (error || locationDenied) {
    return (
      <div>
        <div className="page-title">Weather Forecast</div>
        <div className="page-subtitle">Real-time weather data and forecasts for your farm location</div>
        <div className="card" style={{ marginBottom: 20, background: "#fef2f2", border: "1px solid #fecaca" }}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
            <div style={{ fontWeight: 600, color: "#991b1b", marginBottom: 8 }}>
              {locationDenied ? "Location Access Required" : "Unable to Load Weather"}
            </div>
            <div style={{ fontSize: 13, color: "#7f1d1d" }}>
              {locationDenied 
                ? "Please enable location access in your browser to see weather for your area."
                : error}
            </div>
            <button 
              className="btn btn-red" 
              style={{ marginTop: 16 }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Weather Forecast</div>
      <div className="page-subtitle">Real-time weather data and forecasts for your farm location</div>

      <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", border: "1px solid #86efac" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>📍 {weather!.location.name} ({weather!.location.lat.toFixed(2)}°, {weather!.location.lng.toFixed(2)}°)</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#14532d", margin: "8px 0 4px" }}>{weather!.temperature}°C</div>
            <div style={{ fontSize: 13, color: "#16a34a" }}>{weatherInfo!.icon} {weatherInfo!.label} · Feels like {weather!.apparentTemperature}°C</div>
          </div>
          <div style={{ fontSize: 72, lineHeight: 1 }}>{weatherInfo!.icon}</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        {weatherCards.map((w, i) => (
          <div key={i} className="card-sm" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${w.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <w.Icon size={20} color={w.color} />
            </div>
            <div>
              <div className="stat-label">{w.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{w.value}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{w.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title">Today&apos;s temperature trend</div>
          <WeatherChart data={weather!.hourly} dataKey="temp" color="#ef4444" unit="°C" />
        </div>
        <div className="card">
          <div className="section-title">Humidity trend</div>
          <WeatherChart data={weather!.hourly} dataKey="humidity" color="#3b82f6" unit="%" />
        </div>
      </div>

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
            {weather!.daily.map((d) => (
              <tr key={d.day}>
                <td style={{ fontWeight: 600 }}>{d.day}</td>
                <td>{weatherInfo!.icon} {weatherInfo!.label}</td>
                <td style={{ color: "#ef4444", fontWeight: 600 }}>{d.high}°C</td>
                <td style={{ color: "#3b82f6", fontWeight: 600 }}>{d.low}°C</td>
                <td>{d.rain > 0 ? `${d.rain} mm` : "—"}</td>
                <td style={{ fontSize: 12, color: "#6b7280" }}>{getAdvisory(d.rain, d.high)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
