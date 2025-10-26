"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { ClanCard } from "@/components/clan-card";
import { LeaderboardItem } from "@/components/leaderboard-item";
import { BottomNav } from "@/components/bottom-nav1";

const mockClans = [
  {
    name: "Phoenix Squad",
    members: 234,
    territory: 28,
    color: "#ff6b6b",
    icon: "P",
  },
  {
    name: "Dragon Force",
    members: 189,
    territory: 22,
    color: "#4ecdc4",
    icon: "D",
  },
  {
    name: "Shadow Ops",
    members: 156,
    territory: 15,
    color: "#95e1d3",
    icon: "S",
  },
  {
    name: "Titan Legion",
    members: 201,
    territory: 18,
    color: "#a8e6cf",
    icon: "T",
  },
];

const mockLeaderboard = [
  { rank: 1, name: "ShadowRunner", score: 45230, territory: 42, avatar: "S" },
  { rank: 2, name: "PhoenixRise", score: 42100, territory: 38, avatar: "P" },
  { rank: 3, name: "DragonSlayer", score: 39850, territory: 35, avatar: "D" },
  {
    rank: 4,
    name: "You",
    score: 28450,
    territory: 28,
    avatar: "Y",
    isUser: true,
  },
  { rank: 5, name: "NightHunter", score: 26780, territory: 25, avatar: "N" },
];

function ClansPage() {
  const [activeTab, setActiveTab] = useState<"clans" | "leaderboard">("clans");

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 pt-4 px-4 pb-4 bg-background animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Clans & Leaderboard
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("clans")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "clans"
                ? "bg-primary text-primary-foreground"
                : "bg-white/10 text-muted-foreground hover:bg-white/15"
            }`}
          >
            Clans
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "leaderboard"
                ? "bg-primary text-primary-foreground"
                : "bg-white/10 text-muted-foreground hover:bg-white/15"
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {activeTab === "clans" ? (
          <div className="space-y-4 animate-scale-in">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground mb-3">
                Your Clan
              </h2>
              <GlassCard className="p-4 border-primary/50 bg-primary/5 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground animate-subtle-bounce">
                      S
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Shadow Ops</h3>
                      <p className="text-xs text-muted-foreground">
                        156 members
                      </p>
                    </div>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all">
                    View
                  </button>
                </div>
              </GlassCard>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">
                Other Clans
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {mockClans.slice(0, 3).map((clan, idx) => (
                  <div
                    key={clan.name}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <ClanCard {...clan} />
                  </div>
                ))}
              </div>
            </div>

            <GlassCard className="p-4 text-center card-hover">
              <button className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all">
                Create New Clan
              </button>
            </GlassCard>
          </div>
        ) : (
          <div className="space-y-4 animate-scale-in">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground mb-3">
                Global Leaderboard
              </h2>
              <div className="space-y-2">
                {mockLeaderboard.map((player, idx) => (
                  <div
                    key={player.rank}
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <LeaderboardItem {...player} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav
        items={[
          { href: "/", label: "Map", icon: "M" },
          { href: "/clans", label: "Clans", icon: "C", active: true },
          { href: "/profile", label: "Profile", icon: "P" },
        ]}
      />
    </main>
  );
}

export default ClansPage;
