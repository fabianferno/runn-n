import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { ApiService } from "@/services/api.service";
import { Quest } from "@/types/quest";

export interface QuestManagementState {
  quests: Quest[];
  selectedQuest: Quest | null;
  showCamera: boolean;
  showLocationVerification: boolean;
  isAnalyzing: boolean;
  analysisError: string | null;
  isLoading: boolean;
  error: string | null;
  pendingCompletions: any[];
  activeTab: 'available' | 'completed';
}

export function useQuestManagement() {
  const { address, isConnected } = useAccount();
  
  const [state, setState] = useState<QuestManagementState>({
    quests: [],
    selectedQuest: null,
    showCamera: false,
    showLocationVerification: false,
    isAnalyzing: false,
    analysisError: null,
    isLoading: true,
    error: null,
    pendingCompletions: [],
    activeTab: 'available',
  });

  const updateState = useCallback((updates: Partial<QuestManagementState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Fetch quests and pending completions
  const fetchQuests = useCallback(async () => {
    updateState({ isLoading: true, error: null });
    
    try {
      // Fetch quests
      const questResult = await ApiService.getAllQuests({
        status: "active",
        limit: 100
      });

      if (questResult.success && questResult.quests) {
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

        const transformedQuests: Quest[] = questResult.quests.map((quest: any) => ({
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
        } as Quest));
        
        updateState({ quests: transformedQuests });
      } else {
        updateState({ error: "Failed to fetch quests" });
      }

      // Fetch pending completions if user is connected
      if (address) {
        try {
          const completionsResult = await ApiService.getUserPendingCompletions(address);
          if (completionsResult.success && completionsResult.completions) {
            updateState({ pendingCompletions: completionsResult.completions });
          }
        } catch (err) {
          console.error("Error fetching completions:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      updateState({ error: "Failed to load data. Please try again." });
    } finally {
      updateState({ isLoading: false });
    }
  }, [address, updateState]);

  // Handle quest click
  const handleQuestClick = useCallback((quest: Quest) => {
    updateState({ selectedQuest: quest, showCamera: true });
  }, [updateState]);

  // Handle photo taken
  const handlePhotoTaken = useCallback(async (photoData: string) => {
    if (!state.selectedQuest) return;

    updateState({ isAnalyzing: true, analysisError: null });
    
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: photoData,
          criteria: state.selectedQuest.analysisCriteria,
          questId: state.selectedQuest.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      
      if (result.success && typeof result.verified === 'boolean') {
        const updatedQuest = { 
          ...state.selectedQuest, 
          photo: photoData, 
          status: "in_progress" as const,
          analysisResult: {
            verified: result.verified,
            confidence: result.verified ? 1.0 : 0.0,
            explanation: result.verified ? "Image meets criteria" : "Image does not meet criteria"
          }
        };
        
        updateState({ 
          selectedQuest: updatedQuest, 
          showCamera: false 
        });
        
        if (result.verified) {
          updateState({ showLocationVerification: true });
        } else {
          updateState({ analysisError: "Image analysis failed: Image does not meet the quest criteria" });
        }
      } else {
        throw new Error('Invalid analysis result');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      updateState({ analysisError: 'Failed to analyze image. Please try again.' });
    } finally {
      updateState({ isAnalyzing: false });
    }
  }, [state.selectedQuest, updateState]);

  // Handle location verification
  const handleLocationVerified = useCallback(async (proofs: { ipfsHash?: string; ipfsUrl?: string }) => {
    if (!state.selectedQuest || !address) return;

    try {
      const completionResponse = await ApiService.registerQuestCompletion(
        state.selectedQuest.id,
        address
      );

      if (completionResponse.success) {
        const updatedQuest = { 
          ...state.selectedQuest, 
          status: "completed" as const,
          ipfsHash: proofs.ipfsHash,
          ipfsUrl: proofs.ipfsUrl
        };
        
        updateState({ 
          selectedQuest: updatedQuest,
          showLocationVerification: false 
        });
        
        // Refresh pending completions
        const completionsResult = await ApiService.getUserPendingCompletions(address);
        if (completionsResult.success && completionsResult.completions) {
          updateState({ pendingCompletions: completionsResult.completions });
        }
        
        alert(`Quest completed! Check the "Completed" tab to mint your rewards.`);
      } else {
        alert(`Error: ${completionResponse.error}`);
      }
    } catch (error) {
      console.error('Error registering completion:', error);
      alert('Failed to register completion. Please try again.');
    }
  }, [state.selectedQuest, address, updateState]);

  return {
    ...state,
    setActiveTab: (tab: 'available' | 'completed') => updateState({ activeTab: tab }),
    setShowCamera: (show: boolean) => updateState({ showCamera: show }),
    setShowLocationVerification: (show: boolean) => updateState({ showLocationVerification: show }),
    setSelectedQuest: (quest: Quest | null) => updateState({ selectedQuest: quest }),
    setAnalysisError: (error: string | null) => updateState({ analysisError: error }),
    handleQuestClick,
    handlePhotoTaken,
    handleLocationVerified,
    fetchQuests,
  };
}
