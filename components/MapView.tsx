"use client";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useCallback } from "react";

interface LeafletDefaultPrototype {
  _getIconUrl?: () => string;
}

interface ClickMarker {
  lat: number;
  lng: number;
}

delete (L.Icon.Default.prototype as LeafletDefaultPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function colorIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function clickIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;
      height:32px;
      border-radius:50%;
      background:#3b82f6;
      border:3px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,0.4);
      display:flex;
      align-items:center;
      justify-content:center;
      animation:pulse 1.5s infinite;
    ">
      <div style="width:12px;height:12px;background:white;border-radius:50%"></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const farmMarkers = [
  { lat: 20.5937, lng: 78.9629, color: "#22c55e", label: "Field A – Wheat", status: "Healthy", ndvi: 0.82 },
  { lat: 21.1, lng: 79.5, color: "#eab308", label: "Field B – Cotton", status: "Moderate stress", ndvi: 0.54 },
  { lat: 19.8, lng: 77.8, color: "#ef4444", label: "Field C – Soybean", status: "High risk", ndvi: 0.31 },
  { lat: 22.2, lng: 80.1, color: "#22c55e", label: "Field D – Rice", status: "Healthy", ndvi: 0.79 },
  { lat: 20.0, lng: 76.0, color: "#f97316", label: "Field E – Sugarcane", status: "Severe stress", ndvi: 0.42 },
];

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapViewProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: ClickMarker | null;
}

export default function MapView({ onLocationSelect, selectedLocation }: MapViewProps) {
  const [clickedLocation, setClickedLocation] = useState<ClickMarker | null>(selectedLocation ?? null);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newLoc = { lat, lng };
    setClickedLocation(newLoc);
    onLocationSelect?.(lat, lng);
  }, [onLocationSelect]);

  return (
    <div style={{ height: 420, borderRadius: 10, overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="topleft" />
        <MapClickHandler onMapClick={handleMapClick} />
        
        {farmMarkers.map((m, i) => (
          <Marker key={`farm-${i}`} position={[m.lat, m.lng]} icon={colorIcon(m.color)}>
            <Popup>
              <div style={{ fontSize: 13, minWidth: 160 }}>
                <strong>{m.label}</strong>
                <div style={{ marginTop: 4 }}>Status: <span style={{ color: m.color, fontWeight: 600 }}>{m.status}</span></div>
                <div>NDVI: {m.ndvi}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {clickedLocation && (
          <Marker position={[clickedLocation.lat, clickedLocation.lng]} icon={clickIcon()}>
            <Popup>
              <div style={{ fontSize: 13, minWidth: 160 }}>
                <strong>Selected Location</strong>
                <div style={{ marginTop: 4 }}>Lat: {clickedLocation.lat.toFixed(4)}</div>
                <div>Lng: {clickedLocation.lng.toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      <div style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        background: "white",
        padding: "6px 12px",
        borderRadius: 6,
        fontSize: 12,
        color: "#6b7280",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        zIndex: 1000,
      }}>
        Click anywhere on the map to analyze location
      </div>
    </div>
  );
}
