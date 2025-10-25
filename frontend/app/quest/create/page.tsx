"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/glass-card";
import { BottomNav } from "@/components/bottom-nav";
import { useAccount, useChainId } from "wagmi";
import { QuestFormData, DEFAULT_FORM_DATA } from "@/types/quest";
import { useDataCoinCreation } from "@/hooks/useDataCoinCreation";

export default function CreateQuestPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [formData, setFormData] = useState<QuestFormData>(DEFAULT_FORM_DATA);
  
  // Use the custom hook for DataCoin creation
  const {
    isCreating,
    creationStep,
    error,
    success,
    approvalHash,
    creationHash,
    dataCoinAddress,
    poolAddress,
    mintAccessGranted,
    isPending,
    isConfirming,
    writeError,
    createQuest,
    handleTransactionConfirmation,
  } = useDataCoinCreation({ formData });

  // Handle transaction confirmation
  useEffect(() => {
    handleTransactionConfirmation();
  }, [handleTransactionConfirmation]);

  // Monitor writeContract errors
  useEffect(() => {
    if (writeError) {
      console.error("WriteContract error detected:", writeError);
    }
  }, [writeError]);

  // Form input handlers
  const handleInputChange = (field: keyof QuestFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
                Your quest &quot;{formData.questName}&quot; has been created with a DataCoin reward system.
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
            onClick={createQuest}
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
        {(approvalHash || creationHash) && approvalHash !== "pending" && creationHash !== "pending" && (
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
