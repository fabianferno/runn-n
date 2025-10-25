import React from "react";

interface MapControlsProps {
  isTracking: boolean;
  isRecording: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onSubmitDataCoin: () => void;
  distance: number;
  elapsedTime: number;
}

export const MapControls: React.FC<MapControlsProps> = ({
  isTracking,
  isRecording,
  onStartTracking,
  onStopTracking,
  onSubmitDataCoin,
  distance,
  elapsedTime,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 1000,
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        minWidth: "250px",
      }}
    >
      <h3
        style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "bold" }}
      >
        Controls
      </h3>

      {/* Start/Stop Button */}
      <button
        onClick={isRecording ? onStopTracking : onStartTracking}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "10px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: isRecording ? "#ef4444" : "#10b981",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {isRecording ? "⏹ Stop" : "▶ Start"}
      </button>

      {/* Submit Data Coin Button */}
      <button
        onClick={onSubmitDataCoin}
        disabled={!isRecording}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "15px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: isRecording ? "#3b82f6" : "#9ca3af",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: isRecording ? "pointer" : "not-allowed",
        }}
      >
        🪙 Submit Data Coin
      </button>

      {/* Stats */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
        <div style={{ marginBottom: "10px" }}>
          <div
            style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
          >
            Status
          </div>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            {isRecording ? "🔴 Recording" : "⚪ Idle"}
          </div>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <div
            style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
          >
            Time
          </div>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            {formatTime(elapsedTime)}
          </div>
        </div>

        <div>
          <div
            style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
          >
            Distance
          </div>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            {formatDistance(distance)}
          </div>
        </div>
      </div>
    </div>
  );
};
