import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

interface LeaderboardItemProps {
  rank: number;
  name: string;
  score: number;
  territory: number;
  avatar: string;
  isUser?: boolean;
}

export function LeaderboardItem({
  rank,
  name,
  score,
  territory,
  isUser,
}: LeaderboardItemProps) {
  return (
    <GlassCard
      className={cn(
        "p-4 flex items-center gap-4 mb-3",
        isUser && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary font-bold text-sm text-primary-foreground">
        {rank}
      </div>

      <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{territory}% territory</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-bold text-primary">{score.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">pts</p>
      </div>
    </GlassCard>
  );
}
