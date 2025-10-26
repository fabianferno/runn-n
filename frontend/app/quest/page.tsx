"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { GlassCard } from "@/components/glass-card";
import { BottomNav } from "@/components/bottom-nav1";
import { CameraComponent } from "@/components/camera-component";
import { LocationVerificationComponent } from "@/components/location-verification-component";
import { ApiService } from "@/services/api.service";
import { useMintDatacoin } from "@/hooks/useMintDatacoin";
import { useQuestManagement } from "@/hooks/useQuestManagement";

export default function QuestPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const {
    mintDatacoin,
    isLoading: isMinting,
    error: mintError,
  } = useMintDatacoin();

  const {
    quests,
    selectedQuest,
    showCamera,
    showLocationVerification,
    isAnalyzing,
    analysisError,
    isLoading,
    error,
    pendingCompletions,
    activeTab,
    setActiveTab,
    setShowCamera,
    setShowLocationVerification,
    setSelectedQuest,
    setAnalysisError,
    handleQuestClick,
    handlePhotoTaken,
    handleLocationVerified,
    fetchQuests,
  } = useQuestManagement();

  // Fetch quests on mount and when address changes
  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const handleMintAll = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (pendingCompletions.length === 0) {
      alert("No pending completions to mint");
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
      for (const [dataCoinAddress, completions] of Object.entries(
        groupedCompletions
      )) {
        const totalAmount = completions.reduce(
          (sum, c) => sum + (c.mintAmount || 0),
          0
        );

        console.log(
          `Minting ${totalAmount} tokens to ${address} from ${dataCoinAddress} for ${completions.length} completions`
        );

        // Use the minting hook with the correct datacoin address
        const result = await mintDatacoin(
          dataCoinAddress,
          address,
          totalAmount
        );

        if (result) {
          // Mark all completions as minted
          for (const completion of completions) {
            try {
              await ApiService.markCompletionAsMinted(
                completion._id || completion.id,
                result.txHash
              );
            } catch (err) {
              console.error("Error marking completion as minted:", err);
            }
          }
        }
      }

      alert("All tokens minted successfully! 🎉");

      // Refresh pending completions
      fetchQuests();
    } catch (error) {
      console.error("Error minting tokens:", error);
      alert("Failed to mint tokens. Please try again.");
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
            onClick={() => setActiveTab("available")}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "available"
                ? "bg-primary/20 text-primary font-semibold"
                : "bg-white/5 text-muted-foreground"
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors relative ${
              activeTab === "completed"
                ? "bg-primary/20 text-primary font-semibold"
                : "bg-white/5 text-muted-foreground"
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
            <div className="text-lg font-bold text-primary">
              {quests.length}
            </div>
            <div className="text-xs text-muted-foreground">Total Quests</div>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <div className="text-lg font-bold text-orange-400">
              {quests.filter((q) => q.status === "in_progress").length}
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <div className="text-lg font-bold text-green-400">
              {quests.filter((q) => q.status === "completed").length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </GlassCard>
        </div>

        {/* Create DataCoin Button */}
        {activeTab === "available" && (
          <GlassCard
            className="p-4 mb-6 cursor-pointer hover:bg-white/15 transition-all card-hover"
            onClick={() => router.push("/quest/create")}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Create DataCoin
                </h3>
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
        {activeTab === "completed" && pendingCompletions.length > 0 && (
          <GlassCard className="p-4 mb-6 border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">
                  Ready to Mint!
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pendingCompletions.length} quest
                  {pendingCompletions.length !== 1 ? "s" : ""} completed
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
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
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
        {!isLoading &&
          !error &&
          activeTab === "available" &&
          quests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground mb-3">
                Available Quests
              </h2>
              {quests.map((quest, idx) => (
                <GlassCard
                  key={quest.id}
                  className="p-4 cursor-pointer hover:bg-white/15 transition-all card-hover touch-manipulation"
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    touchAction: "manipulation",
                  }}
                  onClick={() => handleQuestClick(quest)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {quest.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(
                            quest.difficulty
                          )}`}
                        >
                          {quest.difficulty}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                            quest.status
                          )}`}
                        >
                          {quest.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {quest.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">📍</span>
                          <span className="text-foreground">
                            {quest.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">🎁</span>
                          <span className="text-primary">{quest.reward}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary text-sm font-bold">
                          →
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

        {/* Completed Quests List */}
        {!isLoading && !error && activeTab === "completed" && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground mb-3">
              Completed Quests
            </h2>
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
                <GlassCard
                  key={completion._id || completion.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {completion.questId}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {completion.dataCoinAddress && (
                          <span className="font-mono text-xs break-all">
                            {completion.dataCoinAddress.slice(0, 10)}...
                            {completion.dataCoinAddress.slice(-8)}
                          </span>
                        )}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">🎁</span>
                          <span className="text-primary">
                            {completion.mintAmount || 0} tokens
                          </span>
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
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          style={{ touchAction: "manipulation" }}
        >
          <GlassCard
            className="w-full max-w-md p-6 text-center"
            style={{ touchAction: "manipulation" }}
          >
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
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          style={{ touchAction: "manipulation" }}
        >
          <GlassCard
            className="w-full max-w-md p-6"
            style={{ touchAction: "manipulation" }}
          >
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
                className="flex-1 px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors min-h-[44px]"
              >
                Retake Photo
              </button>
              <button
                onClick={() => {
                  setAnalysisError(null);
                  setSelectedQuest(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors min-h-[44px]"
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
