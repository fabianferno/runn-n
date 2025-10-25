import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { ApiService } from "@/services/api.service";
import { useMintDatacoin } from "./useMintDatacoin";
import { Quest } from "@/types/quest";

export interface QuestCompletionState {
  selectedQuest: Quest | null;
  showCamera: boolean;
  showLocationVerification: boolean;
  isAnalyzing: boolean;
  analysisError: string | null;
  pendingCompletions: any[];
  activeTab: 'available' | 'completed';
}

export function useQuestCompletion() {
  const { address, isConnected } = useAccount();
  const { mintDatacoin, isLoading: isMinting, error: mintError } = useMintDatacoin();

  const [state, setState] = useState<QuestCompletionState>({
    selectedQuest: null,
    showCamera: false,
    showLocationVerification: false,
    isAnalyzing: false,
    analysisError: null,
    pendingCompletions: [],
    activeTab: 'available',
  });

  const updateState = useCallback((updates: Partial<QuestCompletionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleQuestClick = useCallback((quest: Quest) => {
    updateState({ selectedQuest: quest, showCamera: true });
  }, [updateState]);

  const handlePhotoTaken = useCallback(async (photoData: string, quest: Quest) => {
    updateState({ isAnalyzing: true, analysisError: null });

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: photoData,
          criteria: quest.analysisCriteria,
          questId: quest.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();

      if (result.success && typeof result.verified === 'boolean') {
        const updatedQuest = {
          ...quest,
          photo: photoData,
          status: "completed" as const,
          analysisResult: {
            verified: result.verified,
            confidence: result.verified ? 1.0 : 0.0,
            explanation: result.verified ? "Image meets criteria" : "Image does not meet criteria"
          }
        };
        
        updateState({
          selectedQuest: updatedQuest,
          showCamera: false,
        });

        if (result.verified) {
          updateState({ showLocationVerification: true });
        } else {
          updateState({ 
            analysisError: "Image analysis failed: Image does not meet the quest criteria",
            isAnalyzing: false 
          });
        }
      } else {
        throw new Error('Invalid analysis result');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      updateState({
        analysisError: 'Failed to analyze image. Please try again.',
        isAnalyzing: false
      });
    }
  }, [updateState]);

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
          showLocationVerification: false,
        });

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

  const handleMintAll = useCallback(async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (state.pendingCompletions.length === 0) {
      alert('No pending completions to mint');
      return;
    }

    try {
      const groupedCompletions: { [key: string]: any[] } = {};

      for (const completion of state.pendingCompletions) {
        const dataCoinAddress = completion.dataCoinAddress;
        if (!groupedCompletions[dataCoinAddress]) {
          groupedCompletions[dataCoinAddress] = [];
        }
        groupedCompletions[dataCoinAddress].push(completion);
      }

      for (const [dataCoinAddress, completions] of Object.entries(groupedCompletions)) {
        const totalAmount = completions.reduce((sum, c) => sum + (c.mintAmount || 0), 0);

        const result = await mintDatacoin(address, totalAmount);

        if (result) {
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

      const completionsResult = await ApiService.getUserPendingCompletions(address);
      if (completionsResult.success && completionsResult.completions) {
        updateState({ pendingCompletions: completionsResult.completions });
      }
    } catch (error) {
      console.error('Error minting tokens:', error);
      alert('Failed to mint tokens. Please try again.');
    }
  }, [isConnected, address, state.pendingCompletions, mintDatacoin, updateState]);

  const closeCamera = useCallback(() => {
    updateState({ showCamera: false, selectedQuest: null, analysisError: null });
  }, [updateState]);

  const closeLocationVerification = useCallback(() => {
    updateState({ showLocationVerification: false, selectedQuest: null });
  }, [updateState]);

  const retryPhoto = useCallback(() => {
    updateState({ analysisError: null, showCamera: true });
  }, [updateState]);

  const cancelPhoto = useCallback(() => {
    updateState({ analysisError: null, selectedQuest: null });
  }, [updateState]);

  return {
    ...state,
    isMinting,
    mintError,
    handleQuestClick,
    handlePhotoTaken,
    handleLocationVerified,
    handleMintAll,
    closeCamera,
    closeLocationVerification,
    retryPhoto,
    cancelPhoto,
    updateState,
  };
}
