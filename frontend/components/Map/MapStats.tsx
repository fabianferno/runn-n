import React from "react";

interface MapStatsProps {
  currentLocation: { latitude: number; longitude: number } | null;
  pathPoints: number;
  capturedHexes: number;
  lastDataCoinLocation: { latitude: number; longitude: number } | null;
}

export const MapStats: React.FC<MapStatsProps> = ({
  currentLocation,
  pathPoints,
  capturedHexes,
  lastDataCoinLocation,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        zIndex: 1000,
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        maxWidth: "400px",
      }}
    >
      <h3
        style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "bold" }}
      >
        Stats
      </h3>

      {/* Current Location */}
      <div style={{ marginBottom: "15px" }}>
        <div
          style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
        >
          Current Location
        </div>
        {currentLocation ? (
          <div style={{ fontSize: "14px", fontFamily: "monospace" }}>
            <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
            <div>Lng: {currentLocation.longitude.toFixed(6)}</div>
          </div>
        ) : (
          <div style={{ fontSize: "14px", color: "#9ca3af" }}>
            No location data
          </div>
        )}
      </div>

      {/* Path Stats */}
      <div style={{ marginBottom: "15px" }}>
        <div
          style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
        >
          Path Points
        </div>
        <div style={{ fontSize: "16px", fontWeight: "bold" }}>{pathPoints}</div>
      </div>

      {/* Captured Hexes */}
      <div style={{ marginBottom: "15px" }}>
        <div
          style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
        >
          Hexes Captured
        </div>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#10b981" }}>
          {capturedHexes}
        </div>
      </div>

      {/* Last Data Coin Location */}
      {lastDataCoinLocation && (
        <div
          style={{
            marginTop: "15px",
            paddingTop: "15px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
          >
            🪙 Last Data Coin
          </div>
          <div style={{ fontSize: "14px", fontFamily: "monospace" }}>
            <div>Lat: {lastDataCoinLocation.latitude.toFixed(6)}</div>
            <div>Lng: {lastDataCoinLocation.longitude.toFixed(6)}</div>
          </div>
        </div>
      )}
    </div>
  );
};
