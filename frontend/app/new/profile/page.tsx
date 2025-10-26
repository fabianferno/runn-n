"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  Settings,
  Share2,
  Edit2,
  Award,
  User,
  MapPin,
  Clock,
  Zap,
  Trophy,
  Flame,
  Moon,
} from "lucide-react";

interface Badge {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  earned: boolean;
}

const BADGES: Badge[] = [
  {
    id: "1",
    name: "First Run",
    icon: User,
    description: "Complete your first run",
    earned: true,
  },
  {
    id: "2",
    name: "5K Club",
    icon: MapPin,
    description: "Run 5km total",
    earned: true,
  },
  {
    id: "3",
    name: "Marathon",
    icon: Trophy,
    description: "Run 42km total",
    earned: false,
  },
  {
    id: "4",
    name: "Speed Demon",
    icon: Zap,
    description: "Run at 10km/h average",
    earned: false,
  },
  {
    id: "5",
    name: "Consistency",
    icon: Flame,
    description: "7-day running streak",
    earned: false,
  },
  {
    id: "6",
    name: "Night Runner",
    icon: Moon,
    description: "Complete a run after 8 PM",
    earned: true,
  },
];

export default function ProfilePage() {
  const [showSettings, setShowSettings] = useState(false);
  const [userAddress, setUserAddress] = useState("0x12w312"); // Default address, can be updated
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  const userLevel = 4;
  const userXP = 890;
  const nextLevelXP = 1000;
  const xpProgress = (userXP / nextLevelXP) * 100;
  const earnedBadges = BADGES.filter((b) => b.earned).length;

  const handleEditAddress = () => {
    if (isEditingAddress) {
      // Save the new address
      if (newAddress.trim()) {
        setUserAddress(newAddress.trim());
      }
      setIsEditingAddress(false);
      setNewAddress("");
    } else {
      // Start editing
      setNewAddress(userAddress);
      setIsEditingAddress(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-24 ">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-accent">Profile</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-card rounded-lg transition-colors"
        >
          <Settings className="w-6 h-6 text-accent" />
        </button>
      </div>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 mt-6 neumorphic p-6 text-center m-6"
      >
        {/* DiceBear Glass Avatar */}
        <div className=" w-20 h-20 mx-auto mb-4 overflow-hidden neumorphic rounded-xl">
          <img
            src={`https://api.dicebear.com/9.x/glass/svg?seed=${userAddress}`}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">You</h2>
        <p className="text-sm text-muted-foreground mb-2">Running enthusiast</p>

        <div className="neumorphic-inset px-3 py-2 mb-4">
          <p className="text-xs text-muted-foreground font-mono break-all">
            {userAddress}
          </p>
        </div>
      </motion.div>

      {/* Level and XP */}
      <motion.div className="neumorphic p-6 m-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-6 mt-0 neumorphic-inset p-4 "
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-muted-foreground text-xs mb-1">Level</div>
              <div className="text-3xl font-bold text-accent">{userLevel}</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs mb-1">XP</div>
              <div className="text-lg font-bold text-accent">
                {userXP} / {nextLevelXP}
              </div>
            </div>
          </div>
          <div className="w-full h-3 bg-card rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full bg-accent rounded-full"
            />
          </div>
        </motion.div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="  grid grid-cols-3 gap-3 mt-3 -mb-4"
        >
          <div className="neumorphic-inset p-4 text-center">
            <div className="text-2xl mb-2 flex justify-center">
              <User className="w-6 h-6" />
            </div>
            <div className="text-xs text-muted-foreground mb-1">Runs</div>
            <div className="text-lg font-bold text-accent">12</div>
          </div>
          <div className="neumorphic-inset p-4 text-center">
            <div className="text-2xl mb-2 flex justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="text-xs text-muted-foreground mb-1">Distance</div>
            <div className="text-lg font-bold text-accent">45.2km</div>
          </div>
          <div className="neumorphic-inset p-4 text-center">
            <div className="text-2xl mb-2 flex justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-xs text-muted-foreground mb-1">Time</div>
            <div className="text-lg font-bold text-accent">6h 20m</div>
          </div>
        </motion.div>

        {/* Badges section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 mt-6"
        ></motion.div>
      </motion.div>

      {/* Settings panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 mt-6 space-y-2"
        >
          <h3 className="text-lg font-bold text-foreground mb-3">Settings</h3>

          <button className="w-full neumorphic p-4 text-left hover:bg-card/50 transition-colors">
            <div className="font-semibold text-foreground">Notifications</div>
            <div className="text-xs text-muted-foreground">
              Manage push notifications
            </div>
          </button>

          <button className="w-full neumorphic p-4 text-left hover:bg-card/50 transition-colors">
            <div className="font-semibold text-foreground">Privacy</div>
            <div className="text-xs text-muted-foreground">
              Control who sees your runs
            </div>
          </button>

          <button className="w-full neumorphic p-4 text-left hover:bg-card/50 transition-colors">
            <div className="font-semibold text-foreground">Units</div>
            <div className="text-xs text-muted-foreground">
              Switch between km and miles
            </div>
          </button>

          <button className="w-full neumorphic p-4 text-left hover:bg-card/50 transition-colors">
            <div className="font-semibold text-foreground">About</div>
            <div className="text-xs text-muted-foreground">Version 1.0.0</div>
          </button>

          <button className="w-full neumorphic p-4 text-left text-destructive hover:bg-destructive/10 transition-colors">
            <div className="font-semibold">Logout</div>
            <div className="text-xs text-destructive/70">
              Sign out of your account
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
}
