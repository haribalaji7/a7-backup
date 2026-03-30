"use client";

interface WeatherData {
  temperature: number;
  humidity: number;
  wind_speed: number;
  rain: number;
  condition: string;
  icon: string;
  feels_like: number;
}

interface CropRecommendation {
  name: string;
  icon: string;
  confidence: number;
  reason: string;
  season: string;
  water_need: string;
  rank: number;
}

interface AnalysisResult {
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  weather: WeatherData;
  crops: CropRecommendation[];
  farming_tips: string[];
}

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  result: AnalysisResult | null;
  error: string | null;
}

export default function SidePanel({ isOpen, onClose, loading, result, error }: SidePanelProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 998,
        }}
      />
      
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 400,
        maxWidth: "100vw",
        height: "100vh",
        background: "white",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
        zIndex: 999,
        overflowY: "auto",
        animation: "slideIn 0.3s ease-out",
      }}>
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          background: "white",
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
              Location Analysis
            </h2>
            {result && (
              <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0 0" }}>
                {result.location.latitude}°N, {result.location.longitude}°E
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#6b7280",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{
                width: 48,
                height: 48,
                border: "4px solid #e5e7eb",
                borderTopColor: "#22c55e",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }} />
              <p style={{ color: "#6b7280", fontSize: 14 }}>Analyzing location...</p>
              <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
                Fetching weather & crop data
              </p>
            </div>
          )}

          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 12,
              padding: 20,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: "#991b1b", fontWeight: 600, margin: "0 0 8px 0" }}>
                Analysis Failed
              </p>
              <p style={{ color: "#7f1d1d", fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          {result && !loading && (
            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
              {/* Weather Section */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🌤️</span> Current Weather
                </h3>
                
                <div style={{
                  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 56 }}>{result.weather.icon}</span>
                    <div>
                      <div style={{ fontSize: 36, fontWeight: 700, color: "#065f46" }}>
                        {Math.round(result.weather.temperature)}°C
                      </div>
                      <div style={{ fontSize: 14, color: "#047857" }}>
                        {result.weather.condition}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Feels Like", value: `${Math.round(result.weather.feels_like)}°C`, icon: "🌡️" },
                    { label: "Humidity", value: `${result.weather.humidity}%`, icon: "💧" },
                    { label: "Wind Speed", value: `${result.weather.wind_speed} km/h`, icon: "💨" },
                    { label: "Rainfall", value: result.weather.rain > 0 ? `${result.weather.rain} mm` : "None", icon: "🌧️" },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: "#f9fafb",
                      borderRadius: 12,
                      padding: 14,
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crop Recommendations */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🌱</span> Recommended Crops
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {result.crops.map((crop, index) => (
                    <div key={crop.name} style={{
                      background: index === 0 ? "#f0fdf4" : "#f9fafb",
                      border: index === 0 ? "2px solid #22c55e" : "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 28 }}>{crop.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                              {crop.name}
                              {index === 0 && (
                                <span style={{
                                  fontSize: 10,
                                  background: "#22c55e",
                                  color: "white",
                                  padding: "2px 8px",
                                  borderRadius: 10,
                                  fontWeight: 500,
                                }}>
                                  BEST
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{crop.season}</div>
                          </div>
                        </div>
                        <div style={{
                          background: index === 0 ? "#22c55e" : "#e5e7eb",
                          color: index === 0 ? "white" : "#374151",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {crop.confidence}%
                        </div>
                      </div>
                      
                      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 8px 0", lineHeight: 1.5 }}>
                        {crop.reason}
                      </p>
                      
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{
                          fontSize: 11,
                          background: "#dbeafe",
                          color: "#1e40af",
                          padding: "4px 10px",
                          borderRadius: 20,
                        }}>
                          💧 Water: {crop.water_need}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Farming Tips */}
              {result.farming_tips.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>💡</span> Farming Tips
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.farming_tips.map((tip, index) => (
                      <div key={index} style={{
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: 10,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}>
                        <span style={{ color: "#d97706", fontSize: 16 }}>⚠️</span>
                        <span style={{ fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{
                marginTop: 28,
                paddingTop: 16,
                borderTop: "1px solid #e5e7eb",
                textAlign: "center",
              }}>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                  Weather data from Open-Meteo API • Recommendations based on climate conditions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
