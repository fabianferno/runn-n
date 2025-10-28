import lighthouse from '@lighthouse-web3/sdk';
import { useState, useCallback } from 'react';

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
      const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : 'Upload failed';
      setState({ isLoading: false, error: errorMessage, data: null });
      throw error;
    }
  }, []);

  return {
    ...state,
    uploadToIPFS,
  };
}
