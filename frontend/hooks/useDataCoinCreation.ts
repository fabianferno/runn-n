import { useState, useCallback, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from "wagmi";
import { keccak256, toBytes, decodeEventLog } from "viem";
import { ApiService } from "@/services/api.service";
import { QuestFormData, CHAIN_CONFIGS } from "@/types/quest";

// @ts-expect-error - ABI files are CommonJS modules
import DataCoinFactoryABI from "@/lib/abi/DataCoinFactory";
// @ts-expect-error - ABI files are CommonJS modules
import ERC20ABI from "@/lib/abi/ERC20";
// @ts-expect-error - ABI files are CommonJS modules
import DataCoinABI from "@/lib/abi/DataCoin";

export interface DataCoinCreationState {
  isCreating: boolean;
  creationStep: string;
  error: string | null;
  success: string | null;
  approvalHash: string | null;
  creationHash: string | null;
  waitingForApproval: boolean;
  dataCoinAddress: string | null;
  poolAddress: string | null;
  mintAccessGranted: boolean;
}

export interface CreateQuestParams {
  formData: QuestFormData;
}

export function useDataCoinCreation({ formData }: CreateQuestParams) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  
  const [state, setState] = useState<DataCoinCreationState>({
    isCreating: false,
    creationStep: "",
    error: null,
    success: null,
    approvalHash: null,
    creationHash: null,
    waitingForApproval: false,
    dataCoinAddress: null,
    poolAddress: null,
    mintAccessGranted: false,
  });

  const isCreatingDataCoinRef = useRef(false);
  const isApprovingRef = useRef(false);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const updateState = useCallback((updates: Partial<DataCoinCreationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Validate form data
  const validateForm = useCallback((): string | null => {
    if (!formData.questName.trim()) return "Quest name is required";
    if (!formData.questDescription.trim()) return "Quest description is required";
    if (!formData.difficulty) return "Difficulty is required";
    if (formData.lockAmount <= 0) return "Lock amount must be greater than 0";
    return null;
  }, [formData]);

  // Parse transaction receipt to extract DataCoin address
  const parseDataCoinCreationReceipt = useCallback(async (txHash: string) => {
    if (!publicClient) {
      throw new Error("Public client not available");
    }

    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      console.log("Transaction receipt:", receipt);

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: DataCoinFactoryABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "DataCoinCreated") {
            const eventData = decoded.args as any;
            return {
              coinAddress: eventData.coinAddress,
              poolAddress: eventData.poolAddress,
              name: eventData.name,
              symbol: eventData.symbol,
              tokenURI: eventData.tokenURI,
              lockToken: eventData.lockToken,
              tokensLocked: eventData.tokensLocked,
            };
          }
        } catch {
          continue;
        }
      }

      throw new Error("DataCoinCreated event not found in transaction receipt");
    } catch (err) {
      console.error("Error parsing transaction receipt:", err);
      throw err;
    }
  }, [publicClient]);

  // Grant mint access to specified address
  const grantMintAccess = useCallback(async (dataCoinAddress: string) => {
    const mintRoleAddress = "0xD9bdE6AB21D302427d6ABc3466E1fB991CAd6cFf";
    
    try {
      updateState({ creationStep: "Step 3: Granting mint access..." });
      
      await writeContract({
        address: dataCoinAddress as `0x${string}`,
        abi: DataCoinABI,
        functionName: "grantRole",
        args: [
          keccak256(toBytes("MINTER_ROLE")),
          mintRoleAddress as `0x${string}`
        ],
      });
      
      updateState({ mintAccessGranted: true });
    } catch (err) {
      throw new Error(`Failed to grant mint access: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [writeContract, updateState]);

  // Save quest to backend
  const saveQuestToBackend = useCallback(async (dataCoinAddress: string, poolAddress?: string) => {
    const questData = {
      ...formData,
      dataCoinAddress,
      poolAddress,
      creator: address,
      status: "active"
    };
    
    try {
      const result = await ApiService.createQuest(questData);
      
      // Also save to localStorage as backup
      const localStorageData = {
        id: result.quest?._id || Date.now().toString(),
        ...questData,
        createdAt: new Date().toISOString(),
      };
      
      const existingQuests = JSON.parse(localStorage.getItem("quests") || "[]");
      existingQuests.push(localStorageData);
      localStorage.setItem("quests", JSON.stringify(existingQuests));
      
      return result.quest;
    } catch (error) {
      console.error("Error saving quest to backend:", error);
      
      const localStorageData = {
        id: Date.now().toString(),
        ...questData,
        createdAt: new Date().toISOString(),
      };
      
      const existingQuests = JSON.parse(localStorage.getItem("quests") || "[]");
      existingQuests.push(localStorageData);
      localStorage.setItem("quests", JSON.stringify(existingQuests));
      
      return localStorageData;
    }
  }, [formData, address]);

  // Create DataCoin
  const createDataCoin = useCallback(async () => {
    if (isCreatingDataCoinRef.current) {
      console.log("createDataCoin already in progress, skipping...");
      return;
    }
    
    if (!isConnected || !address) {
      updateState({ error: "Please connect your wallet first" });
      return;
    }

    if (chainId !== 11155111) {
      updateState({ error: `Please switch to Sepolia network. Current chain ID: ${chainId}` });
      return;
    }

    try {
      isCreatingDataCoinRef.current = true;
      updateState({ creationStep: "Step 2: Creating DataCoin..." });
      
      if (!DataCoinFactoryABI || !Array.isArray(DataCoinFactoryABI)) {
        throw new Error("DataCoinFactory ABI not properly loaded");
      }
      
      const config = CHAIN_CONFIGS[formData.chainName as keyof typeof CHAIN_CONFIGS];
      const lockAssetConfig = config.assets[formData.lockAsset as keyof typeof config.assets];
      const lockAmountInWei = BigInt(formData.lockAmount * Math.pow(10, lockAssetConfig.decimal));

      const salt = keccak256(toBytes(`datacoin-${Date.now()}-${Math.random()}`));
      
      await writeContract({
        address: config.factoryAddress,
        abi: DataCoinFactoryABI,
        functionName: "createDataCoin",
        args: [
          formData.coinName,
          formData.coinSymbol,
          formData.tokenURI,
          address,
          formData.creatorAllocationBps,
          formData.creatorVestingDays * 24 * 60 * 60,
          formData.contributorsAllocationBps,
          formData.liquidityAllocationBps,
          lockAssetConfig.address,
          lockAmountInWei,
          salt,
        ],
      });

      updateState({ creationHash: "pending", creationStep: "Step 2: DataCoin creation submitted! Waiting for confirmation..." });
    } catch (err) {
      console.error("Error creating DataCoin:", err);
      updateState({ 
        error: err instanceof Error ? err.message : "Failed to create DataCoin",
        isCreating: false 
      });
      isCreatingDataCoinRef.current = false;
    }
  }, [isConnected, address, chainId, formData, writeContract, updateState]);

  // Handle DataCoin creation completion
  const handleDataCoinCreation = useCallback(async (txHash: string) => {
    try {
      const eventData = await parseDataCoinCreationReceipt(txHash);
      
      updateState({ 
        dataCoinAddress: eventData.coinAddress,
        poolAddress: eventData.poolAddress,
        creationStep: "Step 2: DataCoin created! Granting mint access..." 
      });
      
      await grantMintAccess(eventData.coinAddress);
      await saveQuestToBackend(eventData.coinAddress, eventData.poolAddress);
      
      updateState({
        success: `🎉 Quest "${formData.questName}" created successfully!`,
        creationStep: "",
        isCreating: false,
      });
      
      isCreatingDataCoinRef.current = false;
    } catch (err) {
      console.error("Error parsing DataCoin creation:", err);
      updateState({ 
        error: `Failed to parse DataCoin creation: ${err instanceof Error ? err.message : "Unknown error"}`,
        isCreating: false 
      });
      isCreatingDataCoinRef.current = false;
    }
  }, [parseDataCoinCreationReceipt, grantMintAccess, saveQuestToBackend, formData.questName, updateState]);

  // Handle transaction confirmation
  const handleTransactionConfirmation = useCallback(() => {
    if (!hash) return;

    if (state.waitingForApproval && state.approvalHash === "pending") {
      updateState({ approvalHash: hash, creationStep: "Step 1: Token approval submitted! Waiting for confirmation..." });
    } else if (state.creationHash === "pending") {
      updateState({ creationHash: hash, creationStep: "Step 2: DataCoin creation submitted! Waiting for confirmation..." });
    }
    
    if (isConfirmed && hash) {
      if (state.waitingForApproval && (hash === state.approvalHash || state.approvalHash === "pending")) {
        updateState({ 
          waitingForApproval: false, 
          approvalHash: hash,
          creationStep: "Step 1: Token approval confirmed! Creating DataCoin..." 
        });
        isApprovingRef.current = false;
        setTimeout(() => createDataCoin(), 100);
      } else if (hash === state.creationHash) {
        updateState({ creationStep: "Step 2: DataCoin created! Parsing transaction data..." });
        handleDataCoinCreation(hash);
      }
    }
  }, [hash, isConfirmed, state, updateState, createDataCoin, handleDataCoinCreation]);

  // Main create quest function
  const createQuest = useCallback(async () => {
    if (!isConnected || !address) {
      updateState({ error: "Please connect your wallet first" });
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      updateState({ error: validationError });
      return;
    }

    if (chainId !== 11155111) {
      updateState({ error: `Please switch to Sepolia network. Current chain ID: ${chainId}` });
      return;
    }

    updateState({
      isCreating: true,
      error: null,
      success: null,
      approvalHash: null,
      creationHash: null,
      waitingForApproval: false,
      creationStep: "Preparing quest creation...",
    });

    try {
      if (isApprovingRef.current) {
        console.log("Approval already in progress, skipping...");
        return;
      }
      
      isApprovingRef.current = true;
      const config = CHAIN_CONFIGS[formData.chainName as keyof typeof CHAIN_CONFIGS];
      const lockAssetConfig = config.assets[formData.lockAsset as keyof typeof config.assets];
      
      const lockAmountInWei = BigInt(formData.lockAmount * Math.pow(10, lockAssetConfig.decimal));
      if (lockAmountInWei < BigInt(lockAssetConfig.minLockAmount)) {
        throw new Error(`Lock amount (${formData.lockAmount}) is below minimum required`);
      }

      updateState({ creationStep: "Step 1: Approving token spending..." });

      if (!ERC20ABI || !Array.isArray(ERC20ABI)) {
        throw new Error("ERC20 ABI not properly loaded");
      }

      await writeContract({
        address: lockAssetConfig.address,
        abi: ERC20ABI,
        functionName: "approve",
        args: [config.factoryAddress, lockAmountInWei],
      });

      updateState({
        approvalHash: "pending",
        waitingForApproval: true,
        creationStep: "Step 1: Token approval submitted. Waiting for confirmation..."
      });
    } catch (err) {
      console.error("Error creating DataCoin:", err);
      updateState({ 
        error: err instanceof Error ? err.message : "Failed to create DataCoin",
        isCreating: false,
        waitingForApproval: false 
      });
      isApprovingRef.current = false;
    }
  }, [isConnected, address, chainId, validateForm, formData, writeContract, updateState]);

  return {
    ...state,
    isPending,
    isConfirming,
    writeError,
    createQuest,
    handleTransactionConfirmation,
  };
}
