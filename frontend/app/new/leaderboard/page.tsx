"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Medal } from "lucide-react";

interface LeaderboardUser {
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
  leaderboard: LeaderboardUser[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

type SortBy = "totalHexes" | "totalRegions" | "totalCaptures" | "totalPaths";

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortBy>("totalHexes");
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(50);
  const [currentUserId] = useState("0x12w312"); // This should come from auth context

  const fetchLeaderboard = async (skipValue: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/leaderboard?limit=${limit}&skip=${skipValue}`
      );
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

  // Helper function to truncate user IDs
  const truncateUserId = (userId: string) => {
    if (userId.length <= 12) return userId;
    return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
  };

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

  const sortedData = leaderboardData
    ? [...leaderboardData.leaderboard].sort((a, b) => {
        switch (sortBy) {
          case "totalHexes":
            return b.stats.totalHexes - a.stats.totalHexes;
          case "totalRegions":
            return b.stats.totalRegions - a.stats.totalRegions;
          case "totalCaptures":
            return b.stats.totalCaptures - a.stats.totalCaptures;
          case "totalPaths":
            return b.totalPaths - a.totalPaths;
          default:
            return 0;
        }
      })
    : [];

  const currentUserRank =
    sortedData.findIndex((u) => u.userId === currentUserId) + 1;
  const currentUser = sortedData.find((u) => u.userId === currentUserId);

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

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Leaderboard
        </h1>
        {leaderboardData && (
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">
              {leaderboardData.pagination.total}
            </p>
            <p className="text-xs text-muted-foreground">Total Players</p>
          </div>
        )}
      </div>

      {/* Current user rank card */}
      {!loading && currentUser && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-6 neumorphic-inset p-4 border border-accent/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs mb-1">
                Your Rank
              </div>
              <div className="text-3xl font-bold text-accent">
                #{currentUserRank}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs mb-1">
                Total Hexes
              </div>
              <div className="text-2xl font-bold text-accent">
                {currentUser.stats.totalHexes.toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-2 px-6 mt-6 mb-4 pb-2 ">
        {(
          ["totalHexes", "totalRegions", "totalCaptures", "totalPaths"] as const
        ).map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              sortBy === sort
                ? "neumorphic bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {sort === "totalHexes" && "Hexes"}
            {sort === "totalRegions" && "Regions"}
            {sort === "totalCaptures" && "Captures"}
            {sort === "totalPaths" && "Paths"}
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      <div className="flex-1 px-6 space-y-3">
        {loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-red-400 font-semibold mb-2">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          sortedData.map((user, index) => {
            const medal = getMedalIcon(index + 1);
            return (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`neumorphic-inset p-4 flex items-center gap-4 ${
                  user.userId === currentUserId ? "border border-accent/50" : ""
                }`}
              >
                {/* Avatar Background */}
                <div className="relative flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  {/* DiceBear Glass Avatar as Background */}
                  <img
                    src={`https://api.dicebear.com/9.x/glass/svg?seed=${user.userId}&radius=0`}
                    alt="User Avatar"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground truncate font-mono text-sm">
                      {truncateUserId(user.userId)}
                    </h3>
                    <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded whitespace-nowrap font-semibold">
                      #{index + 1}
                    </span>
                    {user.userId === currentUserId && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded whitespace-nowrap">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span>{user.stats.totalCaptures} captures</span>
                    {user.totalQuestsCompleted > 0 && (
                      <>
                        <span>•</span>
                        <span>✨ {user.totalQuestsCompleted} quests</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-accent">
                    {sortBy === "totalHexes" &&
                      user.stats.totalHexes.toLocaleString()}
                    {sortBy === "totalRegions" && user.stats.totalRegions}
                    {sortBy === "totalCaptures" && user.stats.totalCaptures}
                    {sortBy === "totalPaths" && user.totalPaths}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sortBy === "totalHexes" && "hexes"}
                    {sortBy === "totalRegions" && "regions"}
                    {sortBy === "totalCaptures" && "captures"}
                    {sortBy === "totalPaths" && "paths"}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Pagination */}
      {!loading && !error && leaderboardData && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={handlePrevPage}
            disabled={skip === 0}
            className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
          >
            ← Previous
          </button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Showing {skip + 1} -{" "}
              {Math.min(skip + limit, leaderboardData.pagination.total)} of{" "}
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
      )}
    </div>
  );
}
