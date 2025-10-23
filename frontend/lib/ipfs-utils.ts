import lighthouse from '@lighthouse-web3/sdk';
import { ethers } from 'ethers';
const DatacoinABI = require('./abi/DataCoin');

// Hardcoded wallet address to receive datacoins
const RECEIVER_ADDRESS = "0xB226144791E9F9e89Bd9C32C9AF53016c2c300E7";

async function mintDatacoin() {
  try {
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const DATACOIN_ADDRESS = process.env.DATACOIN_ADDRESS || "0x0b63450b90e26875FB854823AE56092c6a9D3CBE";
    
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

    const amount = 1;
    console.log(`Minting ${amount} datacoins to ${RECEIVER_ADDRESS}`);
    
    const mintTx = await datacoinContract.mint(
      RECEIVER_ADDRESS,
      ethers.parseUnits(amount.toString(), 18)
    );
    
    await mintTx.wait();
    console.log("Datacoin minted successfully. Tx hash:", mintTx.hash);
    
    return {
      success: true,
      txHash: mintTx.hash,
      amount: amount,
      receiver: RECEIVER_ADDRESS
    };
    
  } catch (error) {
    console.error('Error minting datacoin:', error);
    throw error;
  }
}

export async function uploadToIPFSAndMint(imageData: string, questId: string, questTitle: string) {
  try {
    const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;
    
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

    // Mint and send 1 datacoin to user
    let mintResult = null;
    try {
      mintResult = await mintDatacoin();
    } catch (mintError) {
      console.error('Error minting datacoin:', mintError);
      // Continue even if minting fails
    }

    return {
      success: true,
      questId,
      ipfsHash: uploadResponse.data.Hash,
      fileName: uploadResponse.data.Name,
      size: uploadResponse.data.Size,
      ipfsUrl: `https://gateway.lighthouse.storage/ipfs/${uploadResponse.data.Hash}`,
      datacoinMinted: mintResult ? true : false,
      mintTxHash: mintResult?.txHash || null,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}
