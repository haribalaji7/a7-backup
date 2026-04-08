"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import { Upload, ScanLine, Leaf, AlertTriangle, Sprout, Loader2, Camera, X, RefreshCw } from "lucide-react";

const mockResults: Record<string, { disease: string; confidence: number; severity: string; treatment: string; prevention: string }> = {
  default: {
    disease: "Early Blight (Alternaria solani)",
    confidence: 87,
    severity: "Moderate",
    treatment: "Apply copper-based fungicide (Mancozeb 75% WP) at 2g/L water. Remove affected leaves immediately.",
    prevention: "Ensure proper crop spacing for airflow, avoid overhead irrigation, rotate crops annually.",
  },
};

const REGIONS = ["North", "South", "East", "West", "Central"];

interface CropRecommendation {
  name: string;
  icon: string;
  confidence: number;
  suitable: string;
  season: string;
}

interface PredictionResult {
  recommendations: CropRecommendation[];
  soil_analysis: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    region: string;
  };
  ai_advice: string;
}

export default function ScanPage() {
  const [activeTab, setActiveTab] = useState<"disease" | "crop">("disease");
  
  return (
    <div>
      <div className="page-title">AI Scanner</div>
      <div className="page-subtitle">Choose between disease detection or crop recommendation</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("disease")}
          className={`tab-btn ${activeTab === "disease" ? "tab-btn-active" : ""}`}
        >
          <AlertTriangle size={16} />
          Disease Scanner
        </button>
        <button
          onClick={() => setActiveTab("crop")}
          className={`tab-btn ${activeTab === "crop" ? "tab-btn-active" : ""}`}
        >
          <Sprout size={16} />
          Crop Recommender
        </button>
      </div>

      {activeTab === "disease" ? <DiseaseScanner /> : <CropRecommender />}
    </div>
  );
}

interface DiseaseResult {
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
  prevention: string;
  crop?: string;
  category?: string;
  top_predictions?: { disease: string; confidence: number }[];
  is_mock?: boolean;
  is_plant?: boolean;
  error?: string;
}

function DiseaseScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [validationError, setValidationError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const openCamera = async () => {
    try {
      setCameraError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      setCameraError("Unable to access camera. Please ensure camera permissions are granted.");
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setImage(url);
        closeCamera();
        processImageFile(file);
      }
    }, "image/jpeg");
  };

  async function processImageFile(file: File) {
    setValidationError("");
    setResult(null);
    setScanning(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await axios.post("http://localhost:8000/predict/disease", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setScanning(false);
      
      if (response.data.is_plant === false || response.data.error === "not_a_plant") {
        setValidationError(response.data.message || "The uploaded image does not appear to be a crop or plant leaf. Please scan a valid plant.");
        setResult(null);
        return;
      }
      
      setResult({
        disease: response.data.disease,
        confidence: response.data.confidence,
        severity: response.data.severity,
        treatment: response.data.treatment,
        prevention: response.data.prevention,
        crop: response.data.crop,
        category: response.data.category,
        top_predictions: response.data.top_predictions,
        is_mock: response.data.is_mock,
        is_plant: response.data.is_plant,
      });
    } catch {
      console.warn("Disease detection backend unavailable (Network Error). Using mock fallback.");
      setScanning(false);
      setResult(mockResults["default"]);
    }
  }

  async function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setImage(url);
    await processImageFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }

  const resetScanner = () => {
    setImage(null);
    setResult(null);
    setValidationError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const isHealthy = result?.category === "healthy" || result?.disease?.toLowerCase().includes("healthy");

  const categoryColors: Record<string, { bg: string; text: string }> = {
    fungal: { bg: "#fef3c7", text: "#92400e" },
    bacterial: { bg: "#fee2e2", text: "#991b1b" },
    viral: { bg: "#ede9fe", text: "#5b21b6" },
    pest: { bg: "#ffedd5", text: "#9a3412" },
    oomycete: { bg: "#fce7f3", text: "#9d174d" },
    healthy: { bg: "#dcfce7", text: "#166534" },
    unknown: { bg: "#f3f4f6", text: "#374151" },
  };

  return (
    <>
      <div className="grid-2">
        <div className="card">
          <div className="section-title">Upload Crop Image</div>
          
          {isCameraOpen ? (
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: 220, objectFit: "cover" }}
              />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", display: "flex", gap: 8 }}>
                <button
                  onClick={captureImage}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#22c55e", color: "white", fontWeight: 600, cursor: "pointer" }}
                >
                  <Camera size={16} style={{ marginRight: 6 }} /> Capture
                </button>
                <button
                  onClick={closeCamera}
                  style={{ padding: 10, borderRadius: 8, border: "none", background: "#ef4444", color: "white", fontWeight: 600, cursor: "pointer" }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              style={{
                border: "2px dashed #86efac",
                borderRadius: 10,
                minHeight: 220,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                background: "#f0fdf4",
                transition: "all 0.15s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {image ? (
                <Image src={image} alt="crop" width={400} height={220} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 8 }} />
              ) : (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <Upload size={36} color="#22c55e" style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#15803d", marginBottom: 4 }}>
                    Drag & drop or click to upload
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Supports JPG, PNG (max 10MB)</div>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {!isCameraOpen && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={openCamera}
              >
                <Camera size={15} />
                Open Camera
              </button>
              {image && (
                <button
                  className="btn btn-green"
                  style={{ flex: 1 }}
                  onClick={async () => {
                    if (!inputRef.current?.files?.[0]) return;
                    await handleFile(inputRef.current.files[0]);
                  }}
                  disabled={scanning}
                >
                  <ScanLine size={15} />
                  {scanning ? "Analysing…" : "Run AI Scan"}
                </button>
              )}
            </div>
          )}

          {validationError && (
            <div style={{ marginTop: 12, padding: 16, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>
                    Error: Not a Plant Image
                  </div>
                  <div style={{ fontSize: 13, color: "#991b1b" }}>{validationError}</div>
                  <button
                    onClick={resetScanner}
                    style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                  >
                    <RefreshCw size={14} />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {scanning && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <div style={{ width: "100%", height: 5, borderRadius: 3, background: "#f0f0f0", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#22c55e", borderRadius: 3, animation: "progress 2.2s linear forwards" }} />
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>Running deep-learning analysis…</div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />
          <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
        </div>

        <div className="card">
          <div className="section-title">Detection Result</div>
          {validationError ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <AlertTriangle size={48} color="#dc2626" style={{ margin: "0 auto 16px" }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>
                Unable to Analyze Image
              </div>
              <div style={{ fontSize: 13, color: "#991b1b", marginBottom: 20 }}>
                The uploaded image does not appear to be a crop or plant leaf. Please scan a valid plant.
              </div>
              <button onClick={resetScanner} className="btn btn-outline">
                <RefreshCw size={15} />
                Try Again
              </button>
            </div>
          ) : (
            <>
              {!result && !scanning && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                  <Leaf size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                  <div style={{ fontSize: 13 }}>Upload an image to see the scan result</div>
                </div>
              )}
              {scanning && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                  <ScanLine size={40} style={{ margin: "0 auto 12px", opacity: 0.6, color: "#22c55e" }} />
                  <div style={{ fontSize: 13 }}>Running AI analysis…</div>
                </div>
              )}
              {result && !scanning && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    {isHealthy ? (
                      <Leaf size={20} color="#22c55e" />
                    ) : (
                      <AlertTriangle size={20} color="#eab308" />
                    )}
                    <div style={{ fontSize: 16, fontWeight: 700, color: isHealthy ? "#166534" : "#1f2937" }}>{result.disease}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {result.crop && (
                      <span style={{
                        background: "#dbeafe", color: "#1e40af",
                        padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                      }}>🌿 {result.crop}</span>
                    )}
                    <span className="badge badge-yellow">Confidence: {result.confidence}%</span>
                    <span className={`badge ${isHealthy ? "badge-green" : "badge-yellow"}`}>Severity: {result.severity}</span>
                    {result.category && result.category !== "unknown" && (
                      <span style={{
                        background: categoryColors[result.category]?.bg || "#f3f4f6",
                        color: categoryColors[result.category]?.text || "#374151",
                        padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "capitalize",
                      }}>{result.category}</span>
                    )}
                    {result.is_mock && (
                      <span style={{
                        background: "#fef3c7", color: "#92400e",
                        padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                      }}>⚠ Demo Mode</span>
                    )}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Treatment</div>
                    <div style={{ fontSize: 13, color: "#4b5563", background: isHealthy ? "#f0fdf4" : "#fef9c3", padding: "10px 12px", borderRadius: 8 }}>{result.treatment}</div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Prevention</div>
                    <div style={{ fontSize: 13, color: "#4b5563", background: "#f0fdf4", padding: "10px 12px", borderRadius: 8 }}>{result.prevention}</div>
                  </div>

                  {result.top_predictions && result.top_predictions.length > 1 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Top Predictions</div>
                      {result.top_predictions.map((pred, idx) => (
                        <div key={idx} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "6px 10px", background: idx === 0 ? "#f0fdf4" : "#fafafa",
                          borderRadius: 6, marginBottom: 4, fontSize: 12,
                          border: idx === 0 ? "1px solid #bbf7d0" : "1px solid #f3f4f6",
                        }}>
                          <span style={{ color: "#374151", fontWeight: idx === 0 ? 600 : 400 }}>
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {pred.disease}
                          </span>
                          <span style={{ color: "#6b7280", fontWeight: 600 }}>{pred.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-title">Scanning Tips</div>
        <div className="grid-3">
          {[
            { icon: "📸", tip: "Take photos in natural daylight for best accuracy" },
            { icon: "🍃", tip: "Focus on affected leaves showing symptoms clearly" },
            { icon: "🔍", tip: "Avoid blurry images; ensure leaf fills the frame" },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10;
          font-size: 14px;
          font-weight: 600;
          border: 2px solid #e5e7eb;
          background: #fff;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tab-btn:hover {
          border-color: #22c55e;
          color: #22c55e;
        }
        .tab-btn-active {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-color: #22c55e;
          color: #fff;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .badge-blue {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}

function CropRecommender() {
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");
  const [ph, setPh] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!nitrogen || !phosphorus || !potassium || !ph) {
      setError("Please fill in all nutrient values");
      return;
    }
    
    setError("");
    setLoading(true);
    setResult(null);
    
    try {
      const response = await axios.post<PredictionResult>("http://localhost:8000/predict/crop", {
        nitrogen: parseFloat(nitrogen),
        phosphorus: parseFloat(phosphorus),
        potassium: parseFloat(potassium),
        ph: parseFloat(ph),
        region: region || undefined,
      });
      setResult(response.data);
    } catch (err) {
      setError("Failed to get recommendations. Make sure the ML backend is running on port 8000.");
      console.warn("Crop prediction backend unavailable:", err);
    } finally {
      setLoading(false);
    }
  }, [nitrogen, phosphorus, potassium, ph, region]);

  const fillFromSoilData = () => {
    setNitrogen("78");
    setPhosphorus("42");
    setPotassium("95");
    setPh("6.8");
    setRegion("North");
  };

  return (
    <>
      <div className="grid-2">
        <div className="card">
          <div className="section-title">Soil Data Input</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                Region
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  background: "#fff",
                }}
              >
                <option value="">Select region</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                  Nitrogen (N) <span style={{ color: "#22c55e" }}>kg/ha</span>
                </label>
                <input
                  type="number"
                  value={nitrogen}
                  onChange={e => setNitrogen(e.target.value)}
                  placeholder="e.g. 78"
                  min="0"
                  max="200"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                  Phosphorus (P) <span style={{ color: "#3b82f6" }}>kg/ha</span>
                </label>
                <input
                  type="number"
                  value={phosphorus}
                  onChange={e => setPhosphorus(e.target.value)}
                  placeholder="e.g. 42"
                  min="0"
                  max="200"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                  Potassium (K) <span style={{ color: "#f59e0b" }}>kg/ha</span>
                </label>
                <input
                  type="number"
                  value={potassium}
                  onChange={e => setPotassium(e.target.value)}
                  placeholder="e.g. 95"
                  min="0"
                  max="200"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                  pH Level <span style={{ color: "#8b5cf6" }}>(0-14)</span>
                </label>
                <input
                  type="number"
                  value={ph}
                  onChange={e => setPh(e.target.value)}
                  placeholder="e.g. 6.8"
                  min="0"
                  max="14"
                  step="0.1"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <button
              className="btn btn-outline"
              onClick={fillFromSoilData}
              style={{ fontSize: 12, padding: "8px 12px" }}
            >
              Auto-fill from Farm Data
            </button>

            {error && (
              <div style={{ color: "#ef4444", fontSize: 13, padding: "8px 12px", background: "#fef2f2", borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-green"
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Analysing Soil...
                </>
              ) : (
                <>
                  <Sprout size={15} />
                  Get Crop Recommendations
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Crop Recommendations</div>
          {!result && !loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
              <Sprout size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <div style={{ fontSize: 13 }}>Enter soil data to get AI-powered crop recommendations</div>
            </div>
          )}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
              <Loader2 size={40} style={{ margin: "0 auto 12px", opacity: 0.6, color: "#22c55e" }} className="animate-spin" />
              <div style={{ fontSize: 13 }}>Analysing soil data with ML model...</div>
            </div>
          )}
          {result && (
            <div>
              {result.recommendations.map((crop, idx) => (
                <div
                  key={crop.name}
                  style={{
                    padding: 16,
                    background: idx === 0 ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "#fafafa",
                    borderRadius: 12,
                    marginBottom: idx < result.recommendations.length - 1 ? 12 : 0,
                    border: idx === 0 ? "2px solid #22c55e" : "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{crop.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>{crop.name}</div>
                        {idx === 0 && <span className="badge badge-green">Best Match</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <span className="badge badge-green">{crop.confidence}% Match</span>
                        <span className="badge badge-blue">{crop.season}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        <strong>Best for:</strong> {crop.suitable}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {result.ai_advice && (
                <div style={{ marginTop: 16, padding: 14, background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", marginBottom: 4 }}>AI Soil Advice</div>
                  <div style={{ fontSize: 13, color: "#3b82f6" }}>{result.ai_advice}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {result && result.soil_analysis && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-title">Soil Analysis Summary</div>
          <div className="grid-4">
            {[
              { label: "Nitrogen", value: result.soil_analysis.nitrogen, unit: "kg/ha", color: "#22c55e" },
              { label: "Phosphorus", value: result.soil_analysis.phosphorus, unit: "kg/ha", color: "#3b82f6" },
              { label: "Potassium", value: result.soil_analysis.potassium, unit: "kg/ha", color: "#f59e0b" },
              { label: "pH Level", value: result.soil_analysis.ph, unit: "", color: "#8b5cf6" },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center", padding: 16, background: "#fafafa", borderRadius: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 10, color: "#d1d5db" }}>{item.unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10;
          font-size: 14px;
          font-weight: 600;
          border: 2px solid #e5e7eb;
          background: #fff;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tab-btn:hover {
          border-color: #22c55e;
          color: #22c55e;
        }
        .tab-btn-active {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-color: #22c55e;
          color: #fff;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .badge-blue {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}
