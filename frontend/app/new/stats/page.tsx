"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  TrendingUp,
  Zap,
  MapPin,
  User,
  Clock,
  Zap as Lightning,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const weeklyData = [
  { day: "Mon", distance: 5.2, runs: 1 },
  { day: "Tue", distance: 0, runs: 0 },
  { day: "Wed", distance: 8.1, runs: 1 },
  { day: "Thu", distance: 3.5, runs: 1 },
  { day: "Fri", distance: 0, runs: 0 },
  { day: "Sat", distance: 12.3, runs: 2 },
  { day: "Sun", distance: 16.1, runs: 2 },
];

const monthlyData = [
  { week: "Week 1", distance: 15.2 },
  { week: "Week 2", distance: 22.8 },
  { week: "Week 3", distance: 18.5 },
  { week: "Week 4", distance: 45.2 },
];

export default function StatsPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");

  const totalDistance = 45.2;
  const totalRuns = 12;
  const totalTime = 380; // minutes
  const averagePace = 8.4; // min/km
  const longestRun = 16.1;
  const personalRecord = 12.3;

  const stats = [
    {
      label: "Total Distance",
      value: `${totalDistance}km`,
      icon: MapPin,
      color: "text-blue-400",
    },
    {
      label: "Total Runs",
      value: totalRuns,
      icon: User,
      color: "text-green-400",
    },
    {
      label: "Total Time",
      value: `${Math.floor(totalTime / 60)}h ${totalTime % 60}m`,
      icon: Clock,
      color: "text-purple-400",
    },
    {
      label: "Avg Pace",
      value: `${averagePace.toFixed(1)}/km`,
      icon: Lightning,
      color: "text-orange-400",
    },
  ];

  const achievements = [
    {
      title: "Longest Run",
      value: `${longestRun}km`,
      date: "Last Sunday",
    },
    {
      title: "Personal Record",
      value: `${personalRecord}km`,
      date: "This week",
    },
    {
      title: "Streak",
      value: "3 days",
      date: "Current",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Stats
        </h1>
        <div className="w-10" />
      </div>

      {/* Main stats grid */}
      <div className="neumorphic p-6 m-6 grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="neumorphic-inset p-4 text-center"
          >
            <div className="text-2xl mb-2 flex justify-center">
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-xs text-muted-foreground mb-1">
              {stat.label}
            </div>
            <div className={`text-lg font-bold text-accent`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-6 mt-6"
      >
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          Achievements
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + index * 0.05 }}
              className="neumorphic-inset p-3 text-center"
            >
              <div className="text-sm font-bold text-accent mb-1">
                {achievement.value}
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {achievement.title}
              </div>
              <div className="text-xs text-muted-foreground/60">
                {achievement.date}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Charts section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-6 mt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Distance Trend</h2>
          <div className="flex gap-2">
            {(["week", "month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  timeRange === range
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
        </div>

        <div className="neumorphic-inset p-4">
          <ResponsiveContainer width="100%" height={250}>
            {timeRange === "week" ? (
              <BarChart data={weeklyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(157, 78, 221, 0.1)"
                />
                <XAxis
                  dataKey="day"
                  stroke="rgba(139, 146, 179, 0.6)"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="rgba(139, 146, 179, 0.6)"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(19, 24, 41, 0.9)",
                    border: "1px solid rgba(157, 78, 221, 0.3)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#ccff00" }}
                />
                <Bar dataKey="distance" fill="#ccff00" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(157, 78, 221, 0.1)"
                />
                <XAxis
                  dataKey="week"
                  stroke="rgba(139, 146, 179, 0.6)"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="rgba(139, 146, 179, 0.6)"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(19, 24, 41, 0.9)",
                    border: "1px solid rgba(157, 78, 221, 0.3)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#ccff00" }}
                />
                <Line
                  type="monotone"
                  dataKey="distance"
                  stroke="#ccff00"
                  strokeWidth={3}
                  dot={{ fill: "#ccff00" }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
