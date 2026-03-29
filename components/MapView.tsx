"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
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

const farmMarkers = [
  { lat: 20.5937, lng: 78.9629, color: "#22c55e", label: "Field A – Wheat", status: "Healthy", ndvi: 0.82 },
  { lat: 21.1, lng: 79.5, color: "#eab308", label: "Field B – Cotton", status: "Moderate stress", ndvi: 0.54 },
  { lat: 19.8, lng: 77.8, color: "#ef4444", label: "Field C – Soybean", status: "High risk", ndvi: 0.31 },
  { lat: 22.2, lng: 80.1, color: "#22c55e", label: "Field D – Rice", status: "Healthy", ndvi: 0.79 },
  { lat: 20.0, lng: 76.0, color: "#f97316", label: "Field E – Sugarcane", status: "Severe stress", ndvi: 0.42 },
];

export default function MapView() {
  return (
    <div style={{ height: 420, borderRadius: 10, overflow: "hidden" }}>
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
        {farmMarkers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} icon={colorIcon(m.color)}>
            <Popup>
              <div style={{ fontSize: 13, minWidth: 160 }}>
                <strong>{m.label}</strong>
                <div style={{ marginTop: 4 }}>Status: <span style={{ color: m.color, fontWeight: 600 }}>{m.status}</span></div>
                <div>NDVI: {m.ndvi}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
