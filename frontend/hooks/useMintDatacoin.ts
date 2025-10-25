import { ethers } from 'ethers';
import { useState, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DatacoinABI = require('../lib/abi/DataCoin');

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
      const DATACOIN_ADDRESS = process.env.NEXT_PUBLIC_DATACOIN_ADDRESS || "";
      
      if (!PRIVATE_KEY) {
        throw new Error('Private key not configured');
      }

      if (!DATACOIN_ADDRESS) {
        throw new Error('Datacoin address not configured');
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
