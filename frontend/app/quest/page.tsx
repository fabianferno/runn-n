"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { GlassCard } from "@/components/glass-card";
import { BottomNav } from "@/components/bottom-nav";
import { CameraComponent } from "@/components/camera-component";
import { LocationVerificationComponent } from "@/components/location-verification-component";
import { ApiService } from "@/services/api.service";
import { useMintDatacoin } from "@/lib/ipfs-utils";

interface Quest {
  id: string;
  _id?: string;
  title: string;
  questName: string;
  description: string;
  questDescription: string;
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
  dataCoinAddress?: string;
  poolAddress?: string;
  creator?: string;
}

export default function QuestPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { mintDatacoin, isLoading: isMinting, data: mintData, error: mintError } = useMintDatacoin();
  
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationVerification, setShowLocationVerification] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCompletions, setPendingCompletions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');

  // Fetch quests and pending completions from backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch quests
        const questResult = await ApiService.getAllQuests({
          status: "active",
          limit: 100
        });

        if (questResult.success && questResult.quests) {
          const transformedQuests: Quest[] = questResult.quests.map((quest: any) => {
            const difficultyMap: { [key: string]: "Easy" | "Medium" | "Hard" } = {
              "easy": "Easy",
              "medium": "Medium",
              "hard": "Hard",
              "Easy": "Easy",
              "Medium": "Medium",
              "Hard": "Hard",
              "expert": "Hard"
            };
            
            const statusMap: { [key: string]: "available" | "in_progress" | "completed" } = {
              "active": "available",
              "available": "available",
              "in_progress": "in_progress",
              "completed": "completed",
              "cancelled": "completed"
            };

            return {
              id: quest._id || quest.id,
              _id: quest._id,
              title: quest.questName,
              questName: quest.questName,
              description: quest.questDescription,
              questDescription: quest.questDescription,
              location: `${quest.chainName || 'Unknown'} Network`,
              reward: `${quest.coinSymbol || 'Tokens'}`,
              difficulty: difficultyMap[quest.difficulty] || "Medium",
              status: statusMap[quest.status] || "available",
              analysisCriteria: quest.questDescription,
              dataCoinAddress: quest.dataCoinAddress,
              poolAddress: quest.poolAddress,
              creator: quest.creator,
            } as Quest;
          });
          
          setQuests(transformedQuests);
        } else {
          setError("Failed to fetch quests");
        }

        // Fetch pending completions if user is connected
        if (address) {
          try {
            const completionsResult = await ApiService.getUserPendingCompletions(address);
            if (completionsResult.success && completionsResult.completions) {
              setPendingCompletions(completionsResult.completions);
            }
          } catch (err) {
            console.error("Error fetching completions:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address]);

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

  const handleLocationVerified = async (proofs: { ipfsHash?: string; ipfsUrl?: string }) => {
    if (selectedQuest && address) {
      try {
        // Register quest completion in backend
        const completionResponse = await ApiService.registerQuestCompletion(
          selectedQuest.id,
          address
        );

        if (completionResponse.success) {
          console.log('Quest completion registered:', completionResponse.completionId);
          
          // Update quest status
          const updatedQuest = { 
            ...selectedQuest, 
            status: "completed" as const,
            ipfsHash: proofs.ipfsHash,
            ipfsUrl: proofs.ipfsUrl
          };
          setSelectedQuest(updatedQuest);
          setShowLocationVerification(false);
          
          // Refresh pending completions
          const completionsResult = await ApiService.getUserPendingCompletions(address);
          if (completionsResult.success && completionsResult.completions) {
            setPendingCompletions(completionsResult.completions);
          }
          
          alert(`Quest completed! Check the "Completed" tab to mint your rewards.`);
        } else {
          alert(`Error: ${completionResponse.error}`);
        }
      } catch (error) {
        console.error('Error registering completion:', error);
        alert('Failed to register completion. Please try again.');
      }
    }
  };

  const handleMintAll = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (pendingCompletions.length === 0) {
      alert('No pending completions to mint');
      return;
    }

    try {
      // Group completions by dataCoinAddress to batch mint
      const groupedCompletions: { [key: string]: any[] } = {};
      
      for (const completion of pendingCompletions) {
        const dataCoinAddress = completion.dataCoinAddress;
        if (!groupedCompletions[dataCoinAddress]) {
          groupedCompletions[dataCoinAddress] = [];
        }
        groupedCompletions[dataCoinAddress].push(completion);
      }

      // Mint tokens for each dataCoin
      for (const [dataCoinAddress, completions] of Object.entries(groupedCompletions)) {
        const totalAmount = completions.reduce((sum, c) => sum + (c.mintAmount || 0), 0);
        
        console.log(`Minting ${totalAmount} tokens to ${address} for ${completions.length} completions`);
        
        // Use the ipfs-utils hook to mint
        const result = await mintDatacoin(address, totalAmount);
        
        if (result) {
          // Mark all completions as minted
          for (const completion of completions) {
            try {
              await ApiService.markCompletionAsMinted(completion._id || completion.id, result.txHash);
            } catch (err) {
              console.error('Error marking completion as minted:', err);
            }
          }
        }
      }

      alert('All tokens minted successfully! 🎉');
      
      // Refresh pending completions
      const completionsResult = await ApiService.getUserPendingCompletions(address);
      if (completionsResult.success && completionsResult.completions) {
        setPendingCompletions(completionsResult.completions);
      }
    } catch (error) {
      console.error('Error minting tokens:', error);
      alert('Failed to mint tokens. Please try again.');
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'available'
                ? 'bg-primary/20 text-primary font-semibold'
                : 'bg-white/5 text-muted-foreground'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors relative ${
              activeTab === 'completed'
                ? 'bg-primary/20 text-primary font-semibold'
                : 'bg-white/5 text-muted-foreground'
            }`}
          >
            Completed
            {pendingCompletions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                {pendingCompletions.length}
              </span>
            )}
          </button>
        </div>

        {/* Quest Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <GlassCard className="p-3 text-center">
            <div className="text-lg font-bold text-primary">{quests.length}</div>
            <div className="text-xs text-muted-foreground">Total Quests</div>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <div className="text-lg font-bold text-orange-400">
              {quests.filter(q => q.status === "in_progress").length}
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <div className="text-lg font-bold text-green-400">
              {quests.filter(q => q.status === "completed").length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </GlassCard>
        </div>

        {/* Create DataCoin Button */}
        {activeTab === 'available' && (
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
        )}

        {/* Mint All Button for Completed Tab */}
        {activeTab === 'completed' && pendingCompletions.length > 0 && (
          <GlassCard className="p-4 mb-6 border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">Ready to Mint!</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingCompletions.length} quest{pendingCompletions.length !== 1 ? 's' : ''} completed
                </p>
              </div>
              <div className="text-2xl">🎁</div>
            </div>
            <button
              onClick={handleMintAll}
              disabled={!isConnected || isMinting}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {!isConnected
                ? "Connect Wallet"
                : isMinting
                ? "Minting..."
                : `Mint All (${pendingCompletions.length})`}
            </button>
            {mintError && (
              <p className="text-xs text-center text-red-400 mt-2">
                Error: {mintError}
              </p>
            )}
          </GlassCard>
        )}

        {/* Loading State */}
        {isLoading && (
          <GlassCard className="p-6 text-center mb-6">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Loading Quests
            </h3>
            <p className="text-sm text-muted-foreground">
              Fetching quests from the backend...
            </p>
          </GlassCard>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <GlassCard className="p-6 text-center mb-6 border-red-500/20">
            <div className="text-4xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Error Loading Quests
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors"
            >
              Retry
            </button>
          </GlassCard>
        )}

        {/* Empty State */}
        {!isLoading && !error && quests.length === 0 && (
          <GlassCard className="p-6 text-center mb-6">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Quests Available
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              No quests found in the backend. Create your first quest!
            </p>
          </GlassCard>
        )}

        {/* Quests List */}
        {!isLoading && !error && activeTab === 'available' && quests.length > 0 && (
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
        )}

        {/* Completed Quests List */}
        {!isLoading && !error && activeTab === 'completed' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground mb-3">Completed Quests</h2>
            {pendingCompletions.length === 0 ? (
              <GlassCard className="p-6 text-center">
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Completed Quests
                </h3>
                <p className="text-sm text-muted-foreground">
                  Complete some quests to see them here
                </p>
              </GlassCard>
            ) : (
              pendingCompletions.map((completion: any, idx: number) => (
                <GlassCard key={completion._id || completion.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {completion.questId}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {completion.dataCoinAddress && (
                          <span className="font-mono text-xs break-all">
                            {completion.dataCoinAddress.slice(0, 10)}...{completion.dataCoinAddress.slice(-8)}
                          </span>
                        )}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">🎁</span>
                          <span className="text-primary">{completion.mintAmount || 0} tokens</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 font-medium">
                        Ready
                      </span>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        )}
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
