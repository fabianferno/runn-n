"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { StatCard } from "@/components/stat-card";
import { FloatingActionButton } from "@/components/floating-action-button";
import { BottomNav } from "@/components/bottom-nav";
import { MapComponent } from "@/components/map-component";
import ConnectButton from "@/components/connectButton";
import { useWalletClient } from "wagmi";
import ConnectionStatus from "@/components/nitrolite/ConnectionStatus";

function HomePage() {
  const [isCapturing, setIsCapturing] = useState(false);
  const { data: walletClient } = useWalletClient();
  const handleStartCapture = () => {
    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 2000);
  };

  useEffect(
    () => {
      if (walletClient) {
        console.log("Wallet client:", walletClient);
        walletClient.requestAddresses().then((addresses) => {
          console.log("Addresses:", addresses);
        });
      }
    },
    [walletClient]
  )

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className=" top-0 z-20 pt-4 px-4 pb-4 bg-background animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Territory</h1>
            <p className="text-sm text-muted-foreground">
              Capture • Compete • Conquer
            </p>

          </div>
          <div className="w-10 h-10 rounded-full bg-primary animate-subtle-bounce" />

          <ConnectButton />
        </div>
        <div>
          <ConnectionStatus />
        </div>
        <div className="px-4 py-6 animate-scale-in">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <MapComponent
              className="h-[400px]"
              initialCenter={[-74.5, 40]}
              initialZoom={10}
              mapStyle="mapbox://styles/mapbox/outdoors-v12"
              showControls={true}
              showNavigationControl={true}
              showGeolocateControl={true}
              showFullscreenControl={false}
              showScaleControl={true}
              showCoordinates={false}
              height="500px"
              useCurrentLocation={true}
              hideBuildingLabels={false}
              hidePoiLabels={false}
              showGridOverlay={true}
              gridSize={20}
              onMapLoad={(map) => {
                console.log("Map loaded:", map);
              }}
              onMapMove={(lng, lat, zoom) => {
                console.log("Map moved:", { lng, lat, zoom });
              }}
              onLocationFound={(lng, lat) => {
                console.log("Current location found:", { lng, lat });
              }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="Captured"
            value="35%"
            icon="C"
            trend="up"
            trendValue="+2%"
          />
          <StatCard
            label="Distance"
            value="12.4km"
            icon="D"
            trend="up"
            trendValue="+1.2km"
          />
          <StatCard label="Rank" value="#42" icon="R" />
        </div>
      </div>

      {/* Main Map */}

      {/* Active Zones */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-foreground mb-3">Active Zones</h2>
        <div className="space-y-3">
          {[
            {
              zone: "Downtown District",
              contested: true,
              control: "Phoenix Squad",
              distance: "0.8km",
            },
            {
              zone: "Riverside Park",
              contested: false,
              control: "You",
              distance: "1.2km",
            },
            {
              zone: "Tech Hub",
              contested: true,
              control: "Dragon Force",
              distance: "2.1km",
            },
          ].map((item, idx) => (
            <GlassCard
              key={idx}
              className="p-4 cursor-pointer hover:bg-white/15 transition-all card-hover"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {item.zone}
                    </h3>
                    {item.contested && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-medium animate-color-shift">
                        Contested
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Controlled by {item.control}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">
                    {item.distance}
                  </p>
                  <p className="text-xs text-muted-foreground">away</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 py-4 pb-8">
        <h2 className="text-lg font-bold text-foreground mb-3">
          Recent Activity
        </h2>
        <div className="space-y-2">
          {[
            {
              action: "Captured",
              zone: "Central Park",
              time: "2 hours ago",
              icon: "+",
            },
            {
              action: "Lost",
              zone: "Market Street",
              time: "4 hours ago",
              icon: "-",
            },
            {
              action: "Captured",
              zone: "Beach Road",
              time: "1 day ago",
              icon: "+",
            },
          ].map((item, idx) => (
            <GlassCard
              key={idx}
              className="p-3 flex items-center gap-3 card-hover"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${item.icon === "+"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
                  }`}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {item.action} {item.zone}
                </p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={isCapturing ? "S" : "P"}
        onClick={handleStartCapture}
        label={isCapturing ? "Stop Capture" : "Start Capture"}
      />

      <BottomNav
        items={[
          { href: "/", label: "Map", icon: "M" },
          { href: "/territory", label: "Territory", icon: "T" },
          { href: "/clans", label: "Clans", icon: "C" },
          { href: "/profile", label: "Profile", icon: "P" },
        ]}
      />
    </main>
  );
}

export default HomePage;
