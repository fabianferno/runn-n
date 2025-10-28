"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
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
      const groupedCompletions: { [key: string]: Array<{dataCoinAddress: string; mintAmount?: number; _id?: string; id?: string}> } = {};

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

      alert("All tokens minted successfully!");

      // Refresh pending completions
      fetchQuests();
    } catch (error) {
      console.error("Error minting tokens:", error);
      alert("Failed to mint tokens. Please try again.");
    }
  };

  const difficultyColors = {
    Easy: "text-green-400",
    Medium: "text-yellow-400",
    Hard: "text-red-400",
  };

  const difficultyBg = {
    Easy: "bg-green-400/10",
    Medium: "bg-yellow-400/10",
    Hard: "bg-red-400/10",
  };

  const getDifficultyColor = (difficulty: string) => {
    return difficultyColors[difficulty as keyof typeof difficultyColors] || "text-gray-400";
  };

  const getDifficultyBg = (difficulty: string) => {
    return difficultyBg[difficulty as keyof typeof difficultyBg] || "bg-gray-400/10";
  };

    const filteredQuests = quests.filter((quest) => {
      if (activeTab === "completed") {
        return pendingCompletions.some(
          (c: {questId: string}) => c.questId === quest.id || c.questId === quest._id
        );
      }
      return quest.status === "available" || quest.status === "in_progress";
    });

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
        className="mx-6 mt-6 neumorphic-inset p-4 grid grid-cols-3 gap-4"
      >
        <div className="text-center">
          <div className="text-muted-foreground text-xs mb-1">Total</div>
          <div className="text-2xl font-bold text-accent">
            {quests.length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs mb-1">Progress</div>
          <div className="text-2xl font-bold text-accent">
            {quests.filter((q) => q.status === "in_progress").length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs mb-1">Done</div>
          <div className="text-2xl font-bold text-accent">
            {quests.filter((q) => q.status === "completed").length}
          </div>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex flex-row items-center justify-between mx-6">
        <div className="flex gap-2 mt-6 mb-4 justify-center text-center scale-90 -ml-1">
          {(["available", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`neumorphic-button text-xs transition-all ${
                activeTab === tab
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => router.push("/quest/create")}
          className="neumorphic-button text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all"
        >
          Create Quest +
        </button>
      </div>

      {/* Mint All Button for Completed Tab */}
      {activeTab === "completed" && pendingCompletions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 neumorphic-inset p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">
                Ready to Mint
              </h3>
              <p className="text-xs text-muted-foreground">
                {pendingCompletions.length} quest
                {pendingCompletions.length !== 1 ? "s" : ""} completed
              </p>
            </div>
          </div>
          <button
            onClick={handleMintAll}
            disabled={!isConnected || isMinting}
            className="w-full neumorphic-button px-6 py-3 font-semibold text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        </motion.div>
      )}

      {/* Quests list */}
      <div className="flex-1 px-6 space-y-4">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="neumorphic-inset p-6 text-center"
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Loading Quests
            </h3>
            <p className="text-sm text-muted-foreground">
              Fetching quests from the backend...
            </p>
          </motion.div>
        )}

        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="neumorphic-inset p-6 text-center border border-red-500/20"
          >
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Error Loading Quests
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="neumorphic-button px-4 py-2 bg-accent text-foreground"
            >
              Retry
            </button>
          </motion.div>
        )}

        {!isLoading && !error && filteredQuests.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No quests found</p>
          </motion.div>
        )}

        {!isLoading &&
          !error &&
          filteredQuests.map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => activeTab === "available" && handleQuestClick(quest)}
              className={`neumorphic-inset p-4 ${
                activeTab === "available" ? "cursor-pointer" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground">{quest.title}</h3>
                    {activeTab === "completed" && (
                      <CheckCircle className="w-4 h-4 text-accent" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {quest.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      getDifficultyBg(quest.difficulty)
                    } ${getDifficultyColor(quest.difficulty)}`}
                  >
                    {quest.difficulty}
                  </div>
                </div>
              </div>

              {/* Quest Info */}
              <div className="flex items-center gap-4 text-xs mt-2">
                <span className="text-muted-foreground">Location: {quest.location}</span>
                <span className="text-accent font-bold">
                  Reward: {quest.reward}
                </span>
              </div>
            </motion.div>
          ))}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md neumorphic-inset p-6 text-center"
            style={{ touchAction: "manipulation" }}
          >
            <h3 className="text-xl font-bold text-foreground mb-2">
              Analyzing Image
            </h3>
            <p className="text-sm text-muted-foreground">
              AI is checking if your photo meets the quest requirements...
            </p>
          </motion.div>
        </div>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          style={{ touchAction: "manipulation" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md neumorphic-inset p-6 border border-red-500/20"
            style={{ touchAction: "manipulation" }}
          >
            <div className="text-center mb-4">
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
                className="flex-1 neumorphic-button px-4 py-2 bg-accent text-foreground font-semibold"
              >
                Retake Photo
              </button>
              <button
                onClick={() => {
                  setAnalysisError(null);
                  setSelectedQuest(null);
                }}
                className="flex-1 neumorphic-button px-4 py-2 text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </motion.div>
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
    </div>
  );
}
