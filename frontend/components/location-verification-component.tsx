"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass-card";
import QRCode from "react-qr-code";
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import { useUploadToIPFS } from "@/lib/ipfs-utils";

interface Quest {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "available" | "in_progress" | "completed";
  photo?: string;
}

interface LocationVerificationComponentProps {
  quest: Quest;
  onVerified: (proofs: any) => void;
  onClose: () => void;
}

export function LocationVerificationComponent({ 
  quest, 
  onVerified, 
  onClose 
}: LocationVerificationComponentProps) {
  const [requestUrl, setRequestUrl] = useState('');
  const [proofs, setProofs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);

  // IPFS upload hook
  const { uploadToIPFS, error: ipfsError } = useUploadToIPFS();

  const getVerificationReq = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Your credentials from the Reclaim Protocol Developer Portal
      // Replace these with your actual credentials
      const APP_ID = process.env.NEXT_PUBLIC_RECLAIM_APP_ID || '';
      const APP_SECRET = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET || '';
      const PROVIDER_ID = process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID || '';

      if (!APP_ID || !APP_SECRET || !PROVIDER_ID) {
        throw new Error('Reclaim credentials not configured');
      }

      // Initialize the Reclaim SDK with your credentials
      const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID);

      // Generate the verification request URL
      const requestUrl = await reclaimProofRequest.getRequestUrl();
      setRequestUrl(requestUrl);
      setVerificationStarted(true);

      // Start listening for proof submissions
      await reclaimProofRequest.startSession({
        // Called when the user successfully completes the verification
        onSuccess: async (proofs: any) => {
          console.log('Location verification successful:', proofs);
          setProofs(proofs);
          
          // Upload to IPFS if quest has photo
          if (quest.photo) {
            setIsUploadingToIPFS(true);
            try {
              const ipfsResult = await uploadToIPFS(quest.photo);
              console.log('Image uploaded to IPFS:', ipfsResult);
              
              // Call onVerified with IPFS data
              onVerified({
                ...proofs,
                ipfsHash: ipfsResult.ipfsHash,
                ipfsUrl: ipfsResult.ipfsUrl,
                fileName: ipfsResult.fileName,
                size: ipfsResult.size
              });
            } catch (uploadError) {
              console.error('IPFS upload failed:', uploadError);
              // Still call onVerified even if IPFS fails
              onVerified(proofs);
            } finally {
              setIsUploadingToIPFS(false);
            }
          } else {
            // No photo to upload, just verify
            onVerified(proofs);
          }
        },
        // Called if there's an error during verification
        onError: (error) => {
          console.error('Verification failed', error);
          setError('Location verification failed. Please try again.');
        },
      });
    } catch (err) {
      console.error('Error initializing verification:', err);
      setError('Failed to start location verification. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const openRequestUrl = () => {
    if (requestUrl) {
      // Open in the same page as requested
      window.location.href = requestUrl;
    }
  };

  const completeVerification = async () => {
    // For testing purposes - simulate successful verification
    const mockProofs = {
      questId: quest.id,
      location: quest.location,
      timestamp: new Date().toISOString(),
      verified: true
    };
    
    // Upload to IPFS if quest has photo
    if (quest.photo) {
      setIsUploadingToIPFS(true);
      try {
        const ipfsResult = await uploadToIPFS(quest.photo);
        console.log('Image uploaded to IPFS:', ipfsResult);
        
        // Call onVerified with IPFS data
        onVerified({
          ...mockProofs,
          ipfsHash: ipfsResult.ipfsHash,
          ipfsUrl: ipfsResult.ipfsUrl,
          fileName: ipfsResult.fileName,
          size: ipfsResult.size
        });
      } catch (uploadError) {
        console.error('IPFS upload failed:', uploadError);
        // Still call onVerified even if IPFS fails
        onVerified(mockProofs);
      } finally {
        setIsUploadingToIPFS(false);
      }
    } else {
      // No photo to upload, just verify
      onVerified(mockProofs);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2">
            📍 Verify Location
          </h3>
          <p className="text-sm text-muted-foreground">
            Prove you're at: {quest.location}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {ipfsError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">IPFS Upload Error: {ipfsError}</p>
          </div>
        )}

        {isUploadingToIPFS && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-300 text-sm">Uploading image to IPFS...</p>
            </div>
          </div>
        )}

        {!verificationStarted ? (
          <div className="space-y-4">
            {/* Quest Photo */}
            {quest.photo && (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={quest.photo}
                  alt="Quest photo"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Verification Info */}
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Location Verification</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Click the button below to start location verification. This will use your device's location services to prove you're at the quest location.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Your location will be verified securely</li>
                <li>• No location data is stored permanently</li>
                <li>• Verification is required to complete the quest</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={getVerificationReq}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Starting..." : "Prove Location"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code and Link */}
            {requestUrl && (
              <div className="text-center">
                <div className="mb-4">
                  <QRCode value={requestUrl} size={200} />
                </div>
                
                <button
                  onClick={openRequestUrl}
                  className="w-full px-4 py-3 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors mb-3"
                >
                  Open Verification Link
                </button>
                
                <p className="text-xs text-muted-foreground">
                  Scan QR code or click the link above to verify your location
                </p>
              </div>
            )}

            {/* Verification Status */}
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">
                  Waiting for verification...
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Complete the verification process to finish your quest
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={completeVerification}
                className="flex-1 px-4 py-2 bg-green-500/80 text-white rounded-lg hover:bg-green-500 transition-colors"
              >
                Complete Quest (Test)
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quest Info */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Quest:</span>
            <span className="text-foreground font-medium">{quest.title}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Reward:</span>
            <span className="text-primary font-medium">{quest.reward}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
