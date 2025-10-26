"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Trophy, Flame, Medal } from "lucide-react";

interface LeaderboardUser {
  id: string;
  rank: number;
  address: string;
  distance: number;
  time: number;
  runs: number;
  xp: number;
  isCurrentUser: boolean;
}

const LEADERBOARD_DATA: LeaderboardUser[] = [
  {
    id: "1",
    rank: 1,
    address: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
    distance: 156.8,
    time: 1240,
    runs: 42,
    xp: 2850,
    isCurrentUser: false,
  },
  {
    id: "2",
    rank: 2,
    address: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234",
    distance: 142.3,
    time: 1120,
    runs: 38,
    xp: 2650,
    isCurrentUser: false,
  },
  {
    id: "3",
    rank: 3,
    address: "0x3c4d5e6f7890abcdef1234567890abcdef123456",
    distance: 128.5,
    time: 1050,
    runs: 35,
    xp: 2420,
    isCurrentUser: false,
  },
  {
    id: "4",
    rank: 4,
    address: "0x12w312",
    distance: 45.2,
    time: 380,
    runs: 12,
    xp: 890,
    isCurrentUser: true,
  },
  {
    id: "5",
    rank: 5,
    address: "0x4d5e6f7890abcdef1234567890abcdef12345678",
    distance: 38.9,
    time: 320,
    runs: 10,
    xp: 750,
    isCurrentUser: false,
  },
  {
    id: "6",
    rank: 6,
    address: "0x5e6f7890abcdef1234567890abcdef1234567890",
    distance: 32.1,
    time: 280,
    runs: 8,
    xp: 620,
    isCurrentUser: false,
  },
  {
    id: "7",
    rank: 7,
    address: "0x6f7890abcdef1234567890abcdef1234567890ab",
    distance: 28.4,
    time: 240,
    runs: 7,
    xp: 540,
    isCurrentUser: false,
  },
];

type SortBy = "distance" | "time" | "runs" | "xp";

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortBy>("distance");

  // Helper function to truncate addresses
  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const sortedData = [...LEADERBOARD_DATA].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        return b.distance - a.distance;
      case "time":
        return b.time - a.time;
      case "runs":
        return b.runs - a.runs;
      case "xp":
        return b.xp - a.xp;
      default:
        return 0;
    }
  });

  const currentUserRank = sortedData.findIndex((u) => u.isCurrentUser) + 1;

  const formatDistance = (km: number) => `${km.toFixed(1)}km`;
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
        <div className="w-10" />
      </div>

      {/* Current user rank card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-6 mt-6 neumorphic-inset p-4 border border-accent/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-muted-foreground text-xs mb-1">Your Rank</div>
            <div className="text-3xl font-bold text-accent">
              #{currentUserRank}
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-xs mb-1">Total XP</div>
            <div className="text-2xl font-bold text-accent">890</div>
          </div>
        </div>
      </motion.div>

      {/* Sort tabs */}
      <div className="flex gap-2 px-6 mt-6 mb-4 pb-2 ">
        {(["distance", "time", "runs", "xp"] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              sortBy === sort
                ? "neumorphic bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {sort === "distance" && "Distance"}
            {sort === "time" && "Time"}
            {sort === "runs" && "Runs"}
            {sort === "xp" && "XP"}
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      <div className="flex-1 px-6 space-y-3">
        {sortedData.map((user, index) => {
          const medal = getMedalIcon(index + 1);
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`neumorphic-inset  p-4 flex items-center gap-4 ${
                user.isCurrentUser ? "border border-accent/50" : ""
              }`}
            >
              {/* Avatar Background */}
              <div className="relative flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                {/* DiceBear Glass Avatar as Background */}
                <img
                  src={`https://api.dicebear.com/9.x/glass/svg?seed=${user.address}&radius=0`}
                  alt="User Avatar"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-foreground truncate font-mono text-sm">
                    {truncateAddress(user.address)}
                  </h3>
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded whitespace-nowrap font-semibold">
                    #{index + 1}
                  </span>
                  {user.isCurrentUser && (
                    <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded whitespace-nowrap">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span>{user.runs} runs</span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-accent">
                  {sortBy === "distance" && formatDistance(user.distance)}
                  {sortBy === "time" && formatTime(user.time)}
                  {sortBy === "runs" && user.runs}
                  {sortBy === "xp" && user.xp}
                </div>
                <div className="text-xs text-muted-foreground">
                  {sortBy === "distance" && "distance"}
                  {sortBy === "time" && "time"}
                  {sortBy === "runs" && "runs"}
                  {sortBy === "xp" && "XP"}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
