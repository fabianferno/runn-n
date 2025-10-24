"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  analysisCriteria?: string;
  analysisResult?: {
    verified: boolean;
    confidence: number;
    explanation: string;
  };
  ipfsHash?: string;
  ipfsUrl?: string;
}

export function QuestPage() {
  const router = useRouter();
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationVerification, setShowLocationVerification] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);



  const quests: Quest[] = [
    {
      id: "1",
      title: "Capture the  Potholes",
      description: "Take a photo of a pothhole and prove your location",
      location: "Golden Gate Bridge, San Francisco",
      reward: "500 XP + Rare Badge",
      difficulty: "Medium",
      status: "available",
      analysisCriteria: "Does the image show the pothp in a road. ",
    },
    {
      id: "2", 
      title: "Urban Explorer",
      description: "Find and photograph a street art mural in downtown",
      location: "Downtown District",
      reward: "300 XP + Explorer Badge",
      difficulty: "Easy",
      status: "available",
      analysisCriteria: "Does the image contain colorful street art or graffiti on a wall or building?",
    },
    {
      id: "3",
      title: "Mountain Peak Challenge",
      description: "Reach the summit and capture the breathtaking view",
      location: "Mount Davidson Peak",
      reward: "800 XP + Peak Conqueror Badge",
      difficulty: "Hard",
      status: "available",
      analysisCriteria: "Does the image show a mountain peak or elevated viewpoint with a panoramic landscape view?",
    },
    {
      id: "4",
      title: "Waterfront Warrior",
      description: "Visit the waterfront and document your adventure",
      location: "Embarcadero Waterfront",
      reward: "400 XP + Water Badge",
      difficulty: "Easy",
      status: "available",
      analysisCriteria: "Does the image show water (ocean, bay, or large body of water) with waterfront features like piers, docks, or shoreline?",
    },
    {
      id: "5",
      title: "Tech Hub Discovery",
      description: "Explore the heart of Silicon Valley and capture the innovation",
      location: "Silicon Valley Tech Hub",
      reward: "600 XP + Innovation Badge",
      difficulty: "Medium",
      status: "available",
      analysisCriteria: "Does the image show modern office buildings, tech company logos, or Silicon Valley landmarks?",
    },
  ];

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
    setShowCamera(true);
  };

  const handlePhotoTaken = async (photoData: string) => {
    if (selectedQuest) {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      try {
        // Analyze the image with OpenAI
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: photoData,
            criteria: selectedQuest.analysisCriteria,
            questId: selectedQuest.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze image');
        }

        const result = await response.json();
        
        if (result.success && typeof result.verified === 'boolean') {
          const updatedQuest = { 
            ...selectedQuest, 
            photo: photoData, 
            status: "in_progress" as const,
            analysisResult: {
              verified: result.verified,
              confidence: result.verified ? 1.0 : 0.0,
              explanation: result.verified ? "Image meets criteria" : "Image does not meet criteria"
            }
          };
          setSelectedQuest(updatedQuest);
          setShowCamera(false);
          
          // If image analysis passes, proceed to location verification
          if (result.verified) {
            setShowLocationVerification(true);
          } else {
            setAnalysisError("Image analysis failed: Image does not meet the quest criteria");
          }
        } else {
          throw new Error('Invalid analysis result');
        }
      } catch (error) {
        console.error('Error analyzing image:', error);
        setAnalysisError('Failed to analyze image. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleLocationVerified = async (proofs: any) => {
    if (selectedQuest) {
      // Update quest status to completed with IPFS data (if available)
      const updatedQuest = { 
        ...selectedQuest, 
        status: "completed" as const,
        ipfsHash: proofs.ipfsHash,
        ipfsUrl: proofs.ipfsUrl
      };
      setSelectedQuest(updatedQuest);
      setShowLocationVerification(false);
      setSelectedQuest(null);
      
      // Show success message
      let successMessage = `Quest completed!`;
      
      if (proofs.ipfsHash) {
        successMessage += `\n\nImage stored on IPFS:\nHash: ${proofs.ipfsHash}\nURL: ${proofs.ipfsUrl}`;
      }
      
      alert(successMessage);
    }
  };

  const testImageAnalysis = async (imageData: string, criteria: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageData,
          criteria: criteria,
          questId: 'test',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      
      if (result.success && typeof result.verified === 'boolean') {
        alert(`Analysis Result:\n\nVerified: ${result.verified ? 'YES' : 'NO'}\n\n${result.verified ? '✅ Image meets the criteria!' : '❌ Image does not meet the criteria.'}`);
      } else {
        throw new Error('Invalid analysis result');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
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

        {/* Create DataCoin Button */}
        <GlassCard 
          className="p-4 mb-6 cursor-pointer hover:bg-white/15 transition-all card-hover"
          onClick={() => router.push('/quest/create')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Create DataCoin</h3>
              <p className="text-sm text-muted-foreground">
                Deploy your own DataCoin and set up allocations
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">+</span>
            </div>
          </div>
        </GlassCard>

        {/* Quests List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-3">Available Quests</h2>
          {quests.map((quest, idx) => (
            <GlassCard
              key={quest.id}
              className="p-4 cursor-pointer hover:bg-white/15 transition-all card-hover touch-manipulation"
              style={{ animationDelay: `${idx * 0.1}s`, touchAction: 'manipulation' }}
              onClick={() => handleQuestClick(quest)}
              onTouchEnd={(e: React.TouchEvent) => {
                e.preventDefault();
                handleQuestClick(quest);
              }}
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

  

      {/* Camera Component */}
      {showCamera && selectedQuest && (
        <CameraComponent
          quest={selectedQuest}
          onPhotoTaken={handlePhotoTaken}
          onClose={() => {
            setShowCamera(false);
            setSelectedQuest(null);
            setAnalysisError(null);
          }}
        />
      )}

      {/* Analysis Status */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" style={{ touchAction: 'manipulation' }}>
          <GlassCard className="w-full max-w-md p-6 text-center" style={{ touchAction: 'manipulation' }}>
            <div className="text-4xl mb-4 animate-spin">🤖</div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Analyzing Image
            </h3>
            <p className="text-sm text-muted-foreground">
              AI is checking if your photo meets the quest requirements...
            </p>
          </GlassCard>
        </div>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" style={{ touchAction: 'manipulation' }}>
          <GlassCard className="w-full max-w-md p-6" style={{ touchAction: 'manipulation' }}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">❌</div>
              <h3 className="text-xl font-bold text-red-400 mb-2">
                Analysis Failed
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {analysisError}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAnalysisError(null);
                  setShowCamera(true);
                }}
                onTouchEnd={(e: React.TouchEvent) => {
                  e.preventDefault();
                  setAnalysisError(null);
                  setShowCamera(true);
                }}
                className="flex-1 px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors min-h-[44px] touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                Retake Photo
              </button>
              <button
                onClick={() => {
                  setAnalysisError(null);
                  setSelectedQuest(null);
                }}
                onTouchEnd={(e: React.TouchEvent) => {
                  e.preventDefault();
                  setAnalysisError(null);
                  setSelectedQuest(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors min-h-[44px] touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                Cancel
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Location Verification Component */}
      {showLocationVerification && selectedQuest && (
        <LocationVerificationComponent
          quest={selectedQuest}
          onVerified={handleLocationVerified}
          onClose={() => {
            setShowLocationVerification(false);
            setSelectedQuest(null);
          }}
        />
      )}

      {/* Test Component */}
     

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
