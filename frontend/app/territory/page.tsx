"use client";

import { TerritoryMap } from "@/components/territory-map";

export default function TerritoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Territory Conquest
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Capture hexagonal territories using H3 geospatial indexing. Each
            hexagon can be individually controlled and modified.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
          <div className="h-[600px] w-full">
            <TerritoryMap
              initialCenter={[-74.5, 40]} // New York area
              initialZoom={12}
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">
              H3 Hexagons
            </h3>
            <p className="text-gray-300">
              Uses Uber's H3 geospatial indexing system for consistent,
              hierarchical hexagonal territories that work at any scale.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">
              Dynamic Expansion
            </h3>
            <p className="text-gray-300">
              Territory grid automatically expands as you explore new areas. No
              need to pre-generate the entire world.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">
              Real-time Control
            </h3>
            <p className="text-gray-300">
              Click any hexagon to capture it instantly. Hover to see territory
              information and ownership details.
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Technical Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">
                H3 Geospatial Indexing
              </h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• Hierarchical hexagonal grid system</li>
                <li>• Consistent hexagon sizes at each resolution</li>
                <li>• Efficient spatial queries and operations</li>
                <li>• Used by Uber, Facebook, and other major companies</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">
                Interactive Features
              </h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>
                  • <strong>Click:</strong> Capture territory instantly
                </li>
                <li>
                  • <strong>Hover:</strong> View territory information
                </li>
                <li>
                  • <strong>Dynamic:</strong> Grid expands on map movement
                </li>
                <li>
                  • <strong>Multiplayer:</strong> Ready for real-time sync
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
