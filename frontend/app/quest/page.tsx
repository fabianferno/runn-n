"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { BottomNav } from "@/components/bottom-nav";
import { FloatingActionButton } from "@/components/floating-action-button";
import { CameraComponent } from "@/components/camera-component";
import { LocationVerificationComponent } from "@/components/location-verification-component";


interface Quest {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "available" | "in_progress" | "completed";
  photo?: string;
}

export function QuestPage() {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationVerification, setShowLocationVerification] = useState(false);

  const quests: Quest[] = [
    {
      id: "1",
      title: "Capture the Golden Gate",
      description: "Take a photo at the Golden Gate Bridge and prove your location",
      location: "Golden Gate Bridge, San Francisco",
      reward: "500 XP + Rare Badge",
      difficulty: "Medium",
      status: "available",
    },
    {
      id: "2", 
      title: "Urban Explorer",
      description: "Find and photograph a street art mural in downtown",
      location: "Downtown District",
      reward: "300 XP + Explorer Badge",
      difficulty: "Easy",
      status: "available",
    },
    {
      id: "3",
      title: "Mountain Peak Challenge",
      description: "Reach the summit and capture the breathtaking view",
      location: "Mount Davidson Peak",
      reward: "800 XP + Peak Conqueror Badge",
      difficulty: "Hard",
      status: "available",
    },
    {
      id: "4",
      title: "Waterfront Warrior",
      description: "Visit the waterfront and document your adventure",
      location: "Embarcadero Waterfront",
      reward: "400 XP + Water Badge",
      difficulty: "Easy",
      status: "available",
    },
    {
      id: "5",
      title: "Tech Hub Discovery",
      description: "Explore the heart of Silicon Valley and capture the innovation",
      location: "Silicon Valley Tech Hub",
      reward: "600 XP + Innovation Badge",
      difficulty: "Medium",
      status: "available",
    },
  ];

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
    setShowLocationVerification(true);

  };

  const handlePhotoTaken = (photoData: string) => {
    if (selectedQuest) {
      setSelectedQuest({ ...selectedQuest, photo: photoData, status: "in_progress" });
      setShowCamera(false);
      setShowLocationVerification(true);
    }
  };

  const handleLocationVerified = (proofs: any) => {
    if (selectedQuest) {
      // Update quest status to completed
      const updatedQuest = { ...selectedQuest, status: "completed" as const };
      setSelectedQuest(updatedQuest);
      setShowLocationVerification(false);
      setSelectedQuest(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/20 text-green-300";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-300";
      case "Hard":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-blue-500/20 text-blue-300";
      case "in_progress":
        return "bg-orange-500/20 text-orange-300";
      case "completed":
        return "bg-green-500/20 text-green-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="top-0 z-20 pt-4 px-4 pb-4 bg-background animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quests</h1>
            <p className="text-sm text-muted-foreground">
              Complete challenges • Earn rewards • Level up
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary animate-subtle-bounce" />
        </div>

        {/* Quest Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <GlassCard className="p-3 text-center">
            <div className="text-lg font-bold text-primary">5</div>
            <div className="text-xs text-muted-foreground">Total Quests</div>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <div className="text-lg font-bold text-orange-400">0</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <div className="text-lg font-bold text-green-400">0</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </GlassCard>
        </div>


        {/* Quests List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-3">Available Quests</h2>
          {quests.map((quest, idx) => (
            <GlassCard
              key={quest.id}
              className="p-4 cursor-pointer hover:bg-white/15 transition-all card-hover"
              style={{ animationDelay: `${idx * 0.1}s` }}
              onClick={() => handleQuestClick(quest)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">
                      {quest.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(quest.difficulty)}`}>
                      {quest.difficulty}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(quest.status)}`}>
                      {quest.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {quest.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">📍</span>
                      <span className="text-foreground">{quest.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">🎁</span>
                      <span className="text-primary">{quest.reward}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-sm font-bold">→</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

  

      {/* Location Verification Component */}
      {showLocationVerification && selectedQuest && (
        <LocationVerificationComponent
          quest={selectedQuest}
          onVerified={handleLocationVerified}
          onClose={() => setShowLocationVerification(false)}
        />
      )}

      <BottomNav
        items={[
          { href: "/home", label: "Map", icon: "M" },
          { href: "/quest", label: "Quests", icon: "Q" },
          { href: "/clans", label: "Clans", icon: "C" },
          { href: "/profile", label: "Profile", icon: "P" },
        ]}
      />
    </main>
  );
}

export default QuestPage;
