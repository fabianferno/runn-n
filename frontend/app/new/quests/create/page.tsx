"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

export default function CreateQuestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    questName: "",
    questDescription: "",
    difficulty: "easy",
    lockAmount: "",
  });
  const [showTooltip, setShowTooltip] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Quest created:", formData);
    router.push("/quests");
  };

  return (
    <div className="min-h-screen bg-background p-1">
      {/* Header */}
      <div className="sticky top-0 z-20 pt-4 px-4 pb-4 bg-background animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className=" neumorphic-button"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create Quest
              </h1>
              <p className="text-sm text-muted-foreground">
                Design your challenge
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className=" rounded-full neumorphic-button scale-50 text-2xl"
              >
                i
              </button>
              {showTooltip && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-64 p-4 bg-gradient-to-br from-background/98 to-background/95 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl shadow-black/50 z-50 animate-fade-in">
                  <div className="text-xs text-foreground space-y-2">
                    <div className="font-semibold text-primary mb-2">
                      DataCoin Configuration
                    </div>
                    <div>• Coin Name: QuestCoin (QC)</div>
                    <div>• Creator Allocation: 20%</div>
                    <div>• Contributors Allocation: 50%</div>
                    <div>• Liquidity Allocation: 30%</div>
                    <div>• Vesting Period: 365 days</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-background/98"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6 space-y-2 neumorphic p-3 m-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quest Name */}
          <div className="">
            <label className="text-sm font-bold text-foreground">
              Quest Name
            </label>
            <input
              type="text"
              value={formData.questName}
              onChange={(e) => handleInputChange("questName", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl neumorphic-input "
              required
            />
          </div>

          {/* Quest Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground ">
              Quest Description
            </label>
            <textarea
              value={formData.questDescription}
              onChange={(e) =>
                handleInputChange("questDescription", e.target.value)
              }
              rows={4}
              className="w-full px-4 py-3 rounded-2xl neumorphic-input"
              required
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Difficulty
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => handleInputChange("difficulty", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl neumorphic-input"
            >
              <option value="easy" className="bg-background text-white">
                Easy
              </option>
              <option value="medium" className="bg-background text-white">
                Medium
              </option>
              <option value="hard" className="bg-background text-white">
                Hard
              </option>
              <option value="expert" className="bg-background text-white">
                Expert
              </option>
            </select>
          </div>
          {/* Lock Amount */}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-foreground">
                Lock Amount
              </label>
            </div>
            <input
              type="number"
              value={formData.lockAmount}
              onChange={(e) => handleInputChange("lockAmount", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl  neumorphic-input"
              required
            />
          </div>
          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl  neumorphic-button"
            >
              <span className="relative z-10">Create Quest</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Navigation */}
    </div>
  );
}
