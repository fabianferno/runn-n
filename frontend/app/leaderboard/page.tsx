"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { BottomNav } from "@/components/bottom-nav";

interface UserStats {
  rank: number;
  userId: string;
  color: string;
  stats: {
    totalHexes: number;
    totalRegions: number;
    largestCapture: number;
    totalCaptures: number;
    lastActive: string;
  };
  activeRegions: string[];
  activeRegionsCount: number;
  totalPaths: number;
  totalQuestsCompleted: number;
  averageHexesPerCapture: number;
  createdAt: string;
}

interface LeaderboardData {
  leaderboard: UserStats[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);

  const fetchLeaderboard = async (skipValue: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?limit=${limit}&skip=${skipValue}`);
      const data = await response.json();

      if (data.success) {
        setLeaderboardData(data.data);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch leaderboard");
      }
    } catch (err) {
      setError("Failed to fetch leaderboard data");
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(skip);
  }, [skip]);

  const handleNextPage = () => {
    if (leaderboardData?.pagination.hasMore) {
      setSkip(skip + limit);
    }
  };

  const handlePrevPage = () => {
    if (skip > 0) {
      setSkip(Math.max(0, skip - limit));
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return dateString;
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-300";
    if (rank === 2) return "bg-gray-400/20 text-gray-300";
    if (rank === 3) return "bg-orange-500/20 text-orange-300";
    return "bg-white/5 text-muted-foreground";
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 pt-4 px-4 pb-4 bg-background/95 backdrop-blur-sm animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">🏆 Leaderboard</h1>
            <p className="text-sm text-muted-foreground">
              Top players by territory captured
            </p>
          </div>
          {leaderboardData && (
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {leaderboardData.pagination.total}
              </p>
              <p className="text-xs text-muted-foreground">Total Players</p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <GlassCard className="p-4 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {leaderboardData.leaderboard[0]?.stats.totalHexes.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Top Player Hexes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {leaderboardData.leaderboard
                    .reduce((sum, user) => sum + user.stats.totalHexes, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Hexes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {leaderboardData.leaderboard
                    .reduce((sum, user) => sum + user.stats.totalRegions, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Regions</p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-6">
        {loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        )}

        {error && (
          <GlassCard className="p-6 border-red-500/20">
            <div className="text-center">
              <div className="text-4xl mb-2">❌</div>
              <p className="text-red-400 font-semibold mb-2">Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </GlassCard>
        )}

        {!loading && !error && leaderboardData && (
          <>
            <div className="space-y-3">
              {leaderboardData.leaderboard.map((user, index) => (
                <GlassCard
                  key={user.userId}
                  className="p-4 card-hover"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${getRankColor(
                        user.rank
                      )}`}
                    >
                      {getRankEmoji(user.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: user.color }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-mono text-foreground truncate">
                              {user.userId.slice(0, 10)}...{user.userId.slice(-8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Joined {formatDate(user.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xl font-bold text-primary">
                            {user.stats.totalHexes.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Hexes</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-sm font-semibold text-foreground">
                            {user.stats.totalRegions}
                          </p>
                          <p className="text-xs text-muted-foreground">Regions</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-sm font-semibold text-foreground">
                            {user.stats.largestCapture}
                          </p>
                          <p className="text-xs text-muted-foreground">Largest</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-sm font-semibold text-foreground">
                            {user.totalPaths}
                          </p>
                          <p className="text-xs text-muted-foreground">Paths</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-sm font-semibold text-foreground">
                            {user.averageHexesPerCapture}
                          </p>
                          <p className="text-xs text-muted-foreground">Avg</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>🎯 {user.stats.totalCaptures} captures</span>
                        {user.totalQuestsCompleted > 0 && (
                          <span>✨ {user.totalQuestsCompleted} quests</span>
                        )}
                        <span>🕐 {formatTimeAgo(user.stats.lastActive)}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePrevPage}
                disabled={skip === 0}
                className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
              >
                ← Previous
              </button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Showing {skip + 1} - {Math.min(skip + limit, leaderboardData.pagination.total)} of{" "}
                  {leaderboardData.pagination.total}
                </p>
              </div>
              <button
                onClick={handleNextPage}
                disabled={!leaderboardData.pagination.hasMore}
                className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

    
    </main>
  );
}

