"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  type: "distance" | "time" | "streak";
  target: number;
  unit: string;
  progress: number;
  completed: boolean;
  reward: number;
  difficulty: "easy" | "medium" | "hard";
}

const QUESTS: Quest[] = [
  {
    id: "1",
    title: "First Steps",
    description: "Complete your first 1km run",
    type: "distance",
    target: 1,
    unit: "km",
    progress: 0.5,
    completed: false,
    reward: 50,
    difficulty: "easy",
  },
  {
    id: "2",
    title: "Marathon Starter",
    description: "Run a total of 5km",
    type: "distance",
    target: 5,
    unit: "km",
    progress: 2.3,
    completed: false,
    reward: 150,
    difficulty: "medium",
  },
  {
    id: "3",
    title: "Speed Demon",
    description: "Complete a 10km run",
    type: "distance",
    target: 10,
    unit: "km",
    progress: 0,
    completed: false,
    reward: 300,
    difficulty: "hard",
  },
  {
    id: "4",
    title: "Endurance Test",
    description: "Run for 30 minutes straight",
    type: "time",
    target: 30,
    unit: "min",
    progress: 12,
    completed: false,
    reward: 200,
    difficulty: "medium",
  },
  {
    id: "5",
    title: "Consistency King",
    description: "Run 7 days in a row",
    type: "streak",
    target: 7,
    unit: "days",
    progress: 3,
    completed: false,
    reward: 250,
    difficulty: "hard",
  },
  {
    id: "6",
    title: "Morning Runner",
    description: "Complete a run before 8 AM",
    type: "time",
    target: 1,
    unit: "run",
    progress: 1,
    completed: true,
    reward: 75,
    difficulty: "easy",
  },
];

const difficultyColors = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

const difficultyBg = {
  easy: "bg-green-400/10",
  medium: "bg-yellow-400/10",
  hard: "bg-red-400/10",
};

export default function QuestsPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "completed"
  >("all");

  const filteredQuests = QUESTS.filter((quest) => {
    if (selectedFilter === "active") return !quest.completed;
    if (selectedFilter === "completed") return quest.completed;
    return true;
  });

  const completedCount = QUESTS.filter((q) => q.completed).length;
  const totalRewards = QUESTS.reduce(
    (sum, q) => sum + (q.completed ? q.reward : 0),
    0
  );

  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-accent">Quests</h1>
        <div className="w-10" />
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-6 mt-6 neumorphic-inset p-4 grid grid-cols-2 gap-4"
      >
        <div className="text-center">
          <div className="text-muted-foreground text-xs mb-1">Completed</div>
          <div className="text-2xl font-bold text-accent">
            {completedCount}/{QUESTS.length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs mb-1">
            Total Rewards
          </div>
          <div className="text-2xl font-bold text-accent">{totalRewards}</div>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex flex-row items-center justify-between mx-6">
        <div className="flex gap-2 mt-6 mb-4 justify-center text-center scale-90 -ml-1">
          {(["active", "completed"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={` rounded-lg mt- text-xs transition-all ${
                selectedFilter === filter
                  ? "neumorphic-button bg-accent text-foreground"
                  : "neumorphic-button text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => router.push("/quests/create")}
          className="neumorphic-button text-foregroundx-4 py-2rounded-lg font-medium text-sm transition-all  "
        >
          Create Quest +
        </button>
      </div>

      {/* Quests list */}
      <div className="flex-1 px-6 space-y-4">
        {filteredQuests.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`neumorphic-inset p-4 ${
              quest.completed ? "opacity-75" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-foreground">{quest.title}</h3>
                  {quest.completed && (
                    <CheckCircle className="w-4 h-4 text-accent" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {quest.description}
                </p>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  difficultyBg[quest.difficulty]
                } ${difficultyColors[quest.difficulty]}`}
              >
                {quest.difficulty}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">
                  {quest.progress} / {quest.target} {quest.unit}
                </span>
                <span className="text-xs font-bold text-accent">
                  +{quest.reward} XP
                </span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(quest.progress / quest.target) * 100}%`,
                  }}
                  transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {quest.completed ? (
                <span className="text-xs text-accent font-semibold">
                  Completed
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {Math.round((quest.progress / quest.target) * 100)}% complete
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {filteredQuests.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No quests found</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
