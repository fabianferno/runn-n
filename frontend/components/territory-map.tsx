"use client";

import { GlassCard } from "./glass-card";

interface Territory {
  id: string;
  name: string;
  color: string;
  percentage: number;
  clan: string;
}

interface TerritoryMapProps {
  territories: Territory[];
  userTerritory?: number;
}

export function TerritoryMap({
  territories,
  userTerritory = 35,
}: TerritoryMapProps) {
  return (
    <GlassCard className="p-6 h-96 relative overflow-hidden">
      {/* Map background with grid */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#grid)" />
        </svg>
      </div>

      {/* Territory regions */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-64">
          <div className="absolute inset-0 rounded-full bg-primary/30 border border-primary/50 glow-pulse flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Your Territory</p>
              <p className="text-2xl font-bold text-primary">
                {userTerritory}%
              </p>
            </div>
          </div>

          {/* Clan territories - positioned around */}
          {territories.map((territory, idx) => {
            const angle = (idx / territories.length) * Math.PI * 2;
            const radius = 100;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div
                key={territory.id}
                className="absolute w-16 h-16 rounded-full border-2 flex items-center justify-center text-xs font-semibold text-center p-1 transition-all duration-300 hover:scale-110"
                style={{
                  left: `calc(50% + ${x}px - 32px)`,
                  top: `calc(50% + ${y}px - 32px)`,
                  backgroundColor: `${territory.color}20`,
                  borderColor: territory.color,
                }}
              >
                <span className="text-foreground">{territory.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
        {territories.slice(0, 3).map((territory) => (
          <div key={territory.id} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: territory.color }}
            />
            <span className="text-muted-foreground">{territory.clan}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
