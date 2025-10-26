"use client";

import { MapComponent } from "@/components/map-component";
import { BottomNav } from "@/components/bottom-nav1";

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Territory Map</h1>
          <p className="text-gray-300 text-lg">
            Explore territories and compete with clans in your fitness journey
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <MapComponent className="h-[600px]" />
        </div>
      </div>
    </div>
  );
}
