import lighthouse from '@lighthouse-web3/sdk';
import { ethers } from 'ethers';
import { useState, useCallback } from 'react';
const DatacoinABI = require('./abi/DataCoin');

// React Hooks

export interface UploadToIPFSState {
  isLoading: boolean;
  error: string | null;
  data: {
    ipfsHash: string;
    fileName: string;
    size: string;
    ipfsUrl: string;
  } | null;
}

export interface MintDatacoinState {
  isLoading: boolean;
  error: string | null;
  data: {
    txHash: string;
    amount: number;
    receiver: string;
  } | null;
}

/**
 * Hook for uploading images to IPFS
 */
export function useUploadToIPFS() {
  const [state, setState] = useState<UploadToIPFSState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const uploadToIPFS = useCallback(async (imageData: string, fileName?: string) => {
    setState({ isLoading: true, error: null, data: null });

    try {
      const LIGHTHOUSE_API_KEY = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || "";
      
      if (!LIGHTHOUSE_API_KEY) {
        throw new Error('Lighthouse API key not configured');
      }

      // Convert base64 data URL to buffer
      const base64Data = imageData.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Upload to Lighthouse IPFS
      const uploadResponse = await lighthouse.uploadBuffer(
        imageBuffer,
        LIGHTHOUSE_API_KEY
      );

      if (!uploadResponse.data) {
        throw new Error('Failed to upload to IPFS');
      }

      const result = {
        ipfsHash: uploadResponse.data.Hash,
        fileName: uploadResponse.data.Name,
        size: uploadResponse.data.Size,
        ipfsUrl: `https://gateway.lighthouse.storage/ipfs/${uploadResponse.data.Hash}`,
      };

      setState({ isLoading: false, error: null, data: result });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState({ isLoading: false, error: errorMessage, data: null });
      throw error;
    }
  }, []);

  return {
    ...state,
    uploadToIPFS,
  };
}

/**
 * Hook for minting datacoins
 */
export function useMintDatacoin() {
  const [state, setState] = useState<MintDatacoinState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const mintDatacoin = useCallback(async (receiverAddress: string, amount: number = 1) => {
    setState({ isLoading: true, error: null, data: null });

    try {
      const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;
      const DATACOIN_ADDRESS = process.env.NEXT_PUBLIC_DATACOIN_ADDRESS || "0x0b63450b90e26875FB854823AE56092c6a9D3CBE";
      
      if (!PRIVATE_KEY) {
        throw new Error('Private key not configured');
      }

      const provider = new ethers.JsonRpcProvider("https://1rpc.io/sepolia");
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const datacoinContract = new ethers.Contract(
        DATACOIN_ADDRESS,
        DatacoinABI,
        wallet
      );

      console.log(`Minting ${amount} datacoins to ${receiverAddress}`);
      
      const mintTx = await datacoinContract.mint(
        receiverAddress,
        ethers.parseUnits(amount.toString(), 18)
      );
      
      await mintTx.wait();
      console.log("Datacoin minted successfully. Tx hash:", mintTx.hash);
      
      const result = {
        txHash: mintTx.hash,
        amount: amount,
        receiver: receiverAddress,
      };

      setState({ isLoading: false, error: null, data: result });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      setState({ isLoading: false, error: errorMessage, data: null });
      throw error;
    }
  }, []);

  return {
    ...state,
    mintDatacoin,
  };
}

