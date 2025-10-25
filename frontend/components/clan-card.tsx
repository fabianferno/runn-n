import { GlassCard } from "./glass-card";

interface ClanCardProps {
  name: string;
  members: number;
  territory: number;
  color: string;
  icon: string;
}

export function ClanCard({
  name,
  members,
  territory,
  color,
}: ClanCardProps) {
  return (
    <GlassCard className="p-4 cursor-pointer hover:bg-white/15 transition-all duration-300">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground">{members} members</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Territory Control</span>
          <span className="font-semibold text-primary">{territory}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${territory}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </GlassCard>
  );
}
