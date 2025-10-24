"use client";

import React from "react";
import { MapComponent } from "@/components/Map/MapComponent";

export default function GamePage() {
  const userId = "player1";
  const userColor = "#FF6B6B";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        paddingTop: "20px",
        paddingBottom: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <h1
          style={{
            color: "white",
            textAlign: "center",
            fontSize: "36px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Territory Capture Game
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
            fontSize: "16px",
            marginBottom: "30px",
          }}
        >
          Track your path and capture hexagonal territories
        </p>

        <MapComponent userId={userId} userColor={userColor} />
      </div>
    </div>
  );
}
