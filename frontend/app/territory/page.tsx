"use client";

import React from "react";
import { MapComponent } from "@/components/Map/MapComponent";
import { useAccount } from "wagmi";

export default function GamePage() {
  const { address } = useAccount();
  const userColor = "#FF6B6B";

  // Show connection prompt if no wallet connected
  if (!address) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>
            Connect Wallet
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            Please connect your wallet to start playing the Territory Capture Game
          </p>
          <p style={{ fontSize: "14px", color: "#9ca3af" }}>
            Use the connect button in the top navigation
          </p>
        </div>
      </div>
    );
  }

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
            marginBottom: "10px",
          }}
        >
          Track your path and capture hexagonal territories
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            fontSize: "14px",
            marginBottom: "30px",
          }}
        >
          Wallet: {address}
        </p>

        <MapComponent userId={address} userColor={userColor} />
      </div>
    </div>
  );
}
