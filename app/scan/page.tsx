"use client";
import { useState, useRef } from "react";
import { Upload, ScanLine, Leaf, AlertTriangle } from "lucide-react";

const mockResults: Record<string, { disease: string; confidence: number; severity: string; treatment: string; prevention: string }> = {
  default: {
    disease: "Early Blight (Alternaria solani)",
    confidence: 87,
    severity: "Moderate",
    treatment: "Apply copper-based fungicide (Mancozeb 75% WP) at 2g/L water. Remove affected leaves immediately.",
    prevention: "Ensure proper crop spacing for airflow, avoid overhead irrigation, rotate crops annually.",
  },
};

export default function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<typeof mockResults["default"] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setImage(url);
    setResult(null);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult(mockResults["default"]);
    }, 2200);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }

  return (
    <div>
      <div className="page-title">Crop Disease Scanner</div>
      <div className="page-subtitle">Upload a leaf or crop image for AI-powered disease detection and treatment advice</div>

      <div className="grid-2">
        {/* Upload zone */}
        <div className="card">
          <div className="section-title">Upload Crop Image</div>
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="crop" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 8 }} />
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

          {image && (
            <button
              className="btn btn-green"
              style={{ marginTop: 12, width: "100%" }}
              onClick={() => { setScanning(true); setResult(null); setTimeout(() => { setScanning(false); setResult(mockResults["default"]); }, 2200); }}
              disabled={scanning}
            >
              <ScanLine size={15} />
              {scanning ? "Analysing…" : "Run AI Scan"}
            </button>
          )}

          {scanning && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <div style={{ width: "100%", height: 5, borderRadius: 3, background: "#f0f0f0", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#22c55e", borderRadius: 3, animation: "progress 2.2s linear forwards" }} />
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>Running deep-learning analysis…</div>
            </div>
          )}

          <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
        </div>

        {/* Result */}
        <div className="card">
          <div className="section-title">Detection Result</div>
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <AlertTriangle size={20} color="#eab308" />
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>{result.disease}</div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span className="badge badge-yellow">Confidence: {result.confidence}%</span>
                <span className="badge badge-yellow">Severity: {result.severity}</span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>💊 Treatment</div>
                <div style={{ fontSize: 13, color: "#4b5563", background: "#fef9c3", padding: "10px 12px", borderRadius: 8 }}>{result.treatment}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>🛡️ Prevention</div>
                <div style={{ fontSize: 13, color: "#4b5563", background: "#f0fdf4", padding: "10px 12px", borderRadius: 8 }}>{result.prevention}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
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
              <span style={{ fontSize: 13, color: "#6b7280" }}>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
