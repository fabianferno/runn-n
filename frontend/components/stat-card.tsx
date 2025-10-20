import type React from "react";
import { GlassCard } from "./glass-card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && trendValue && (
            <p
              className={`text-xs mt-2 ${
                trend === "up" ? "text-green-400" : "text-red-400"
              }`}
            >
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </p>
          )}
        </div>
        {icon && <div className="text-primary text-2xl">{icon}</div>}
      </div>
    </GlassCard>
  );
}
