"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GlassCard } from "@/components/glass-card";
import { BottomNav } from "@/components/bottom-nav";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from "wagmi";
import { keccak256, toBytes, decodeEventLog } from "viem";

// @ts-expect-error - ABI files are CommonJS modules
import DataCoinFactoryABI from "@/lib/abi/DataCoinFactory";
// @ts-expect-error - ABI files are CommonJS modules
import ERC20ABI from "@/lib/abi/ERC20";
// @ts-expect-error - ABI files are CommonJS modules
import DataCoinABI from "@/lib/abi/DataCoin"; 


// Quest form data structure
interface QuestFormData {
  // Quest information
  questName: string;
  questDescription: string;
  difficulty: string;
  
  // DataCoin information (set as defaults)
  coinName: string;
  coinSymbol: string;
  coinDescription: string;
  tokenURI: string;
  
  // Allocation configuration (must total 100% = 10000 basis points)
  creatorAllocationBps: number; // basis points
  contributorsAllocationBps: number; // basis points
  liquidityAllocationBps: number; // basis points
  creatorVestingDays: number; // days
  
  // Lock asset configuration
  lockAsset: string;
  lockAmount: number;
  
  // Chain configuration
  chainName: string;
}

// Default form values
const DEFAULT_FORM_DATA: QuestFormData = {
  questName: "",
  questDescription: "",
  difficulty: "medium",
  coinName: "QuestCoin",
  coinSymbol: "QC",
  coinDescription: "Quest completion reward token",
  tokenURI: "https://ipfs.io/ipfs/QmQuestMetadata",
  creatorAllocationBps: 2000, // 20%
  contributorsAllocationBps: 5000, // 50%
  liquidityAllocationBps: 3000, // 30%
  creatorVestingDays: 365, // 1 year
  lockAsset: "USDC",
  lockAmount: 5,
  chainName: "sepolia",
};

// Chain configurations
const CHAIN_CONFIGS = {
  sepolia: {
    factoryAddress: "0xC7Bc3432B0CcfeFb4237172340Cd8935f95f2990" as `0x${string}`,
    rpc: "https://1rpc.io/sepolia",
    assets: {
      USDC: {
        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
        decimal: 6,
        minLockAmount: 500000,
      },
      WETH: {
        address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9" as `0x${string}`,
        decimal: 18,
        minLockAmount: 100000000000000,
      },
      LSDC: {
        address: "0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE" as `0x${string}`,
        decimal: 18,
        minLockAmount: 10000000000000000000000,
      },
    },
  },
};

export default function CreateQuestPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [formData, setFormData] = useState<QuestFormData>(DEFAULT_FORM_DATA);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [creationHash, setCreationHash] = useState<string | null>(null);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [dataCoinAddress, setDataCoinAddress] = useState<string | null>(null);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [mintAccessGranted, setMintAccessGranted] = useState(false);
  const isCreatingDataCoinRef = useRef(false);
  const isApprovingRef = useRef(false);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Form input handlers
  const handleInputChange = (field: keyof QuestFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form data
  const validateForm = (): string | null => {
    if (!formData.questName.trim()) return "Quest name is required";
    if (!formData.questDescription.trim()) return "Quest description is required";
    if (!formData.difficulty) return "Difficulty is required";
    
    if (formData.lockAmount <= 0) return "Lock amount must be greater than 0";
    
    return null;
  };

  const handleCreateQuest = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    // Validate form data
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if we're on the correct chain (Sepolia = 11155111)
    if (chainId !== 11155111) {
      setError(`Please switch to Sepolia network. Current chain ID: ${chainId}`);
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);
    setApprovalHash(null);
    setCreationHash(null);
    setWaitingForApproval(false);
    setCreationStep("Preparing quest creation...");

    try {
      // Prevent duplicate approval calls
      if (isApprovingRef.current) {
        console.log("Approval already in progress, skipping...");
        return;
      }
      
      isApprovingRef.current = true;
      const config = CHAIN_CONFIGS[formData.chainName as keyof typeof CHAIN_CONFIGS];
      const lockAssetConfig = config.assets[formData.lockAsset as keyof typeof config.assets];
      
      // Validate lock amount
      const lockAmountInWei = BigInt(formData.lockAmount * Math.pow(10, lockAssetConfig.decimal));
      if (lockAmountInWei < BigInt(lockAssetConfig.minLockAmount)) {
        throw new Error(`Lock amount (${formData.lockAmount}) is below minimum required`);
      }

      setCreationStep("Step 1: Approving token spending...");

      // Validate ERC20 ABI is loaded
      if (!ERC20ABI || !Array.isArray(ERC20ABI)) {
        throw new Error("ERC20 ABI not properly loaded");
      }

      // First, approve the factory contract to spend the lock token
      console.log("Calling writeContract for token approval...");
      await writeContract({
        address: lockAssetConfig.address,
        abi: ERC20ABI,
        functionName: "approve",
        args: [
          config.factoryAddress,
          lockAmountInWei
        ],
      });

      console.log("Token approval transaction submitted");
      setApprovalHash("pending");
      setWaitingForApproval(true);
      setCreationStep("Step 1: Token approval submitted. Waiting for confirmation...");
      
      // The actual DataCoin creation will be triggered by the useEffect when approval is confirmed
      
    } catch (err) {
      console.error("Error creating DataCoin:", err);
      setError(err instanceof Error ? err.message : "Failed to create DataCoin");
      setIsCreating(false);
      setWaitingForApproval(false);
      isApprovingRef.current = false;
    }
  };

  const createDataCoin = useCallback(async () => {
    // Prevent duplicate calls
    if (isCreatingDataCoinRef.current) {
      console.log("createDataCoin already in progress, skipping...");
      return;
    }
    
    console.log("createDataCoin called with state:", { isConnected, address, waitingForApproval, approvalHash, chainId });
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    // Check if we're on the correct chain (Sepolia = 11155111)
    if (chainId !== 11155111) {
      setError(`Please switch to Sepolia network. Current chain ID: ${chainId}`);
      return;
    }

    try {
      isCreatingDataCoinRef.current = true;
      console.log("Starting DataCoin creation...");
      
      // Validate ABI is loaded
      if (!DataCoinFactoryABI || !Array.isArray(DataCoinFactoryABI)) {
        throw new Error("DataCoinFactory ABI not properly loaded");
      }
      
      const config = CHAIN_CONFIGS[formData.chainName as keyof typeof CHAIN_CONFIGS];
      const lockAssetConfig = config.assets[formData.lockAsset as keyof typeof config.assets];
      const lockAmountInWei = BigInt(formData.lockAmount * Math.pow(10, lockAssetConfig.decimal));

      setCreationStep("Step 2: Creating DataCoin...");

      // Generate salt for unique deployment
      const salt = keccak256(toBytes(`datacoin-${Date.now()}-${Math.random()}`));

      console.log("Calling writeContract for DataCoin creation with args:", {
        factoryAddress: config.factoryAddress,
        name: formData.coinName,
        symbol: formData.coinSymbol,
        creator: address,
        lockAsset: lockAssetConfig.address,
        lockAmount: lockAmountInWei.toString(),
        salt,
        chainId,
        abiLength: DataCoinFactoryABI.length
      });
      
      // Create the DataCoin
      const result = await writeContract({
        address: config.factoryAddress,
        abi: DataCoinFactoryABI,
        functionName: "createDataCoin",
        args: [
          formData.coinName,
          formData.coinSymbol,
          formData.tokenURI,
          address, // creator address
          formData.creatorAllocationBps,
          formData.creatorVestingDays * 24 * 60 * 60, // convert days to seconds
          formData.contributorsAllocationBps,
          formData.liquidityAllocationBps,
          lockAssetConfig.address,
          lockAmountInWei,
          salt,
        ],
      });

      console.log("DataCoin creation transaction submitted:", result);
      setCreationHash("pending");
      setCreationStep("Step 2: DataCoin creation submitted! Waiting for confirmation...");

      
    } catch (err) {
      console.error("Error creating DataCoin:", err);
      console.error("Write contract error:", writeError);
      setError(err instanceof Error ? err.message : "Failed to create DataCoin");
      setIsCreating(false);
      isCreatingDataCoinRef.current = false;
    }
  }, [isConnected, address, writeContract, chainId, writeError, formData]);

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

      // Look for DataCoinCreated event
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: DataCoinFactoryABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "DataCoinCreated") {
            const eventData = decoded.args as any;
            console.log("DataCoinCreated event found:", eventData);
            
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
        } catch (decodeError) {
          // Skip logs that don't match our ABI
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
      setCreationStep("Step 3: Granting mint access...");
      
      console.log("Granting minter role to:", mintRoleAddress);
      await writeContract({
        address: dataCoinAddress as `0x${string}`,
        abi: DataCoinABI,
        functionName: "grantRole",
        args: [
          keccak256(toBytes("MINTER_ROLE")),
          mintRoleAddress as `0x${string}`
        ],
      });
      
      console.log("Mint access granted successfully");
      setCreationStep("Step 3: Mint access granted! Quest creation complete.");
      setMintAccessGranted(true);
      
    } catch (err) {
      console.error("Error granting mint access:", err);
      setError(`Failed to grant mint access: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [writeContract]);

  // Save quest to localStorage
  const saveQuestToStorage = useCallback((dataCoinAddress: string) => {
    const questData = {
      id: Date.now().toString(),
      ...formData,
      dataCoinAddress,
      creator: address,
      createdAt: new Date().toISOString(),
      status: "active"
    };
    
    // Get existing quests
    const existingQuests = JSON.parse(localStorage.getItem("quests") || "[]");
    
    // Add new quest
    existingQuests.push(questData);
    
    // Save back to localStorage
    localStorage.setItem("quests", JSON.stringify(existingQuests));
    
    console.log("Quest saved to storage:", questData);
    return questData;
  }, [formData, address]);

  // Handle DataCoin creation completion
  const handleDataCoinCreation = useCallback(async (txHash: string) => {
    try {
      // Parse the transaction receipt to get actual DataCoin address
      const eventData = await parseDataCoinCreationReceipt(txHash);
      console.log("Parsed DataCoin creation data:", eventData);
      
      // Set the actual addresses
      setDataCoinAddress(eventData.coinAddress);
      setPoolAddress(eventData.poolAddress);
      
      setCreationStep("Step 2: DataCoin created! Granting mint access...");
      
      // Grant mint access to the mint role address
      await grantMintAccess(eventData.coinAddress);
      
      // Save quest to localStorage with actual data
      const questData = saveQuestToStorage(eventData.coinAddress);
      
      setSuccess(`🎉 Quest "${formData.questName}" created successfully! 
        DataCoin: ${eventData.coinAddress}
        Pool: ${eventData.poolAddress}
        Transaction: ${txHash}`);
      setCreationStep("");
      setIsCreating(false);
      isCreatingDataCoinRef.current = false;
      
    } catch (parseError) {
      console.error("Error parsing DataCoin creation:", parseError);
      setError(`Failed to parse DataCoin creation: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
      setIsCreating(false);
      isCreatingDataCoinRef.current = false;
    }
  }, [parseDataCoinCreationReceipt, grantMintAccess, saveQuestToStorage, formData.questName]);

  // Handle transaction confirmation
  useEffect(() => {
   
    
    if (hash) {
      // Update the appropriate hash based on current state
      if (waitingForApproval && approvalHash === "pending") {
        console.log("Setting approval hash:", hash);
        setApprovalHash(hash);
        setCreationStep("Step 1: Token approval submitted! Waiting for confirmation...");
      } else if (creationHash === "pending") {
        console.log("Setting creation hash:", hash);
        setCreationHash(hash);
        setCreationStep("Step 2: DataCoin creation submitted! Waiting for confirmation...");
      }
    }
    
    if (isConfirmed && hash) {
      console.log("Transaction confirmed:", hash);
      if (waitingForApproval && (hash === approvalHash || approvalHash === "pending")) {
        console.log("Approval confirmed, creating DataCoin...");
        // Approval confirmed, now create the DataCoin
        setWaitingForApproval(false);
        setApprovalHash(hash); // Ensure we have the actual hash
        setCreationStep("Step 1: Token approval confirmed! Creating DataCoin...");
        isApprovingRef.current = false; // Clear approval ref
        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          createDataCoin();
        }, 100);
      } else if (hash === creationHash) {
        console.log("DataCoin creation confirmed");
        // DataCoin creation confirmed - parse receipt and grant mint access
        setCreationStep("Step 2: DataCoin created! Parsing transaction data...");
        
        // Handle the DataCoin creation completion
        handleDataCoinCreation(hash);
      }
    }
  }, [hash, isConfirmed, approvalHash, creationHash, waitingForApproval, createDataCoin, handleDataCoinCreation]);

  // Fallback: If approval is confirmed but DataCoin creation hasn't started, trigger it
  useEffect(() => {
    if (approvalHash && approvalHash !== "pending" && !creationHash && !waitingForApproval && isCreating) {
      console.log("Fallback: Approval confirmed but DataCoin creation not started, triggering now...");
      setTimeout(() => {
        createDataCoin();
      }, 500);
    }
  }, [approvalHash, creationHash, waitingForApproval, isCreating, createDataCoin]);

  // Monitor writeContract errors
  useEffect(() => {
    if (writeError) {
      console.error("WriteContract error detected:", writeError);
      setError(`Contract interaction failed: ${writeError.message || writeError.toString()}`);
      setIsCreating(false);
    }
  }, [writeError]);


  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="top-0 z-20 pt-4 px-4 pb-4 bg-background animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Quest</h1>
            <p className="text-sm text-muted-foreground">
              Create quest • Set difficulty • Lock collateral
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary animate-subtle-bounce" />
        </div>

        {/* Wallet Status */}
        <GlassCard className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Wallet Status</h3>
              <p className="text-sm text-muted-foreground">
                {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : "Not connected"}
              </p>
              <p className="text-xs text-muted-foreground">
                Chain ID: {chainId} {chainId === 11155111 ? "(Sepolia ✓)" : chainId === 1 ? "(Mainnet)" : "(Unknown)"}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        </GlassCard>

        {/* Quest Information */}
        <GlassCard className="p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">Quest Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Quest Name</label>
              <input
                type="text"
                value={formData.questName}
                onChange={(e) => handleInputChange("questName", e.target.value)}
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter quest name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Quest Description</label>
              <textarea
                value={formData.questDescription}
                onChange={(e) => handleInputChange("questDescription", e.target.value)}
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                placeholder="Describe your quest (this will be used for AI analysis)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleInputChange("difficulty", e.target.value)}
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Lock Amount (USDC)</label>
              <input
                type="number"
                value={formData.lockAmount}
                onChange={(e) => handleInputChange("lockAmount", Number(e.target.value))}
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="5"
                min="1"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum: 0.5 USDC • This amount will be locked as collateral
              </p>
            </div>
          </div>
        </GlassCard>

        {/* DataCoin Configuration - Hidden (using defaults) */}
        <GlassCard className="p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">DataCoin Configuration</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Coin Name: QuestCoin (QC)</p>
            <p>• Creator Allocation: 20%</p>
            <p>• Contributors Allocation: 50%</p>
            <p>• Liquidity Allocation: 30%</p>
            <p>• Vesting Period: 365 days</p>
            <p className="text-xs mt-2 text-muted-foreground/70">
              These settings are optimized for quest rewards and can be customized in advanced mode.
            </p>
          </div>
        </GlassCard>

        {/* Creation Status */}
        {(isCreating || isPending || isConfirming) && (
          <GlassCard className="p-4 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-spin">⏳</div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Creating DataCoin
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {creationStep || "Processing transaction..."}
              </p>
              
              {/* Transaction Status Indicators */}
              <div className="space-y-2 text-xs">
                {approvalHash && (
                  <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded">
                    <span className="text-blue-300">Step 1: Token Approval</span>
                    <span className="text-blue-300 font-mono">
                      {approvalHash === "pending" ? "Pending..." : `${approvalHash.slice(0, 8)}...${approvalHash.slice(-6)}`}
                    </span>
                  </div>
                )}
                {creationHash && (
                  <div className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                    <span className="text-green-300">Step 2: DataCoin Creation</span>
                    <span className="text-green-300 font-mono">
                      {creationHash === "pending" ? "Pending..." : `${creationHash.slice(0, 8)}...${creationHash.slice(-6)}`}
                    </span>
                  </div>
                )}
              </div>

              {isPending && (
                <p className="text-xs text-muted-foreground mt-2">
                  Transaction pending...
                </p>
              )}
              {isConfirming && (
                <p className="text-xs text-muted-foreground mt-2">
                  Waiting for confirmation...
                </p>
              )}
            </div>
          </GlassCard>
        )}

        {/* Error Display */}
        {error && (
          <GlassCard className="p-4 mb-6 border-red-500/20">
            <div className="text-center">
              <div className="text-4xl mb-2">❌</div>
              <h3 className="text-xl font-bold text-red-400 mb-2">
                Creation Failed
              </h3>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
            </div>
          </GlassCard>
        )}

        {/* Success Display */}
        {success && (
          <GlassCard className="p-4 mb-6 border-green-500/20">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">
                Quest Created Successfully!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your quest "{formData.questName}" has been created with a DataCoin reward system.
              </p>
              
              {/* DataCoin Information */}
              {dataCoinAddress && (
                <div className="space-y-2 text-left bg-green-500/10 p-3 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground">DataCoin Address:</span>
                    <p className="text-sm font-mono break-all text-green-300">
                      {dataCoinAddress}
                    </p>
                  </div>
                  {poolAddress && (
                    <div>
                      <span className="text-xs text-muted-foreground">Pool Address:</span>
                      <p className="text-sm font-mono break-all text-green-300">
                        {poolAddress}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground">Coin Details:</span>
                    <p className="text-sm text-green-300">
                      {formData.coinName} ({formData.coinSymbol})
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Mint Access:</span>
                    <p className="text-sm text-green-300">
                      {mintAccessGranted ? "✅ Granted" : "⏳ Pending"}
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-3">
                Transaction: {creationHash}
              </p>
            </div>
          </GlassCard>
        )}

        {/* Create Button */}
        <GlassCard className="p-4">
          <button
            onClick={handleCreateQuest}
            disabled={!isConnected || isCreating || isPending || isConfirming}
            className="w-full px-6 py-4 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold mb-3"
          >
            {!isConnected 
              ? "Connect Wallet to Create Quest"
              : isCreating || isPending || isConfirming
              ? "Creating Quest..."
              : success
              ? "Quest Created Successfully!"
              : "Create Quest"
            }
          </button>
          
        </GlassCard>

        {/* Transaction Hash Display */}
        {(approvalHash || creationHash) && (
          <GlassCard className="p-4 mt-4">
            <h3 className="font-semibold text-foreground mb-3">Transaction Hashes</h3>
            <div className="space-y-2">
              {approvalHash && approvalHash !== "pending" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Token Approval:</p>
                  <p className="text-sm text-muted-foreground break-all font-mono bg-blue-500/10 p-2 rounded">
                    {approvalHash}
                  </p>
                </div>
              )}
              {creationHash && creationHash !== "pending" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">DataCoin Creation:</p>
                  <p className="text-sm text-muted-foreground break-all font-mono bg-green-500/10 p-2 rounded">
                    {creationHash}
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>

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
