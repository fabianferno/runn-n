import { NextRequest, NextResponse } from 'next/server';
import lighthouse from '@lighthouse-web3/sdk';
import { ethers } from 'ethers';
const DatacoinABI = require('../../../lib/abi/DataCoin');


// Hardcoded wallet address to receive datacoins
const RECEIVER_ADDRESS = "0xB226144791E9F9e89Bd9C32C9AF53016c2c300E7";

async function mintDatacoin() {
  try {
    // Get environment variables
    const PRIVATE_KEY = process.env.PRIVATE_KEY;

    const DATACOIN_ADDRESS = process.env.DATACOIN_ADDRESS || "0x0b63450b90e26875FB854823AE56092c6a9D3CBE";
    
    if (!PRIVATE_KEY) {
      throw new Error('Private key not configured');
    }

    // Setup blockchain connection

    const provider = new ethers.JsonRpcProvider("https://1rpc.io/sepolia");
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const datacoinContract = new ethers.Contract(
      DATACOIN_ADDRESS,
      DatacoinABI,
      wallet
    );

    // Mint 1 datacoin to the receiver
    const amount = 1; // 1 datacoin
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

export async function POST(request: NextRequest) {
  try {
    const { imageData, questId, questTitle } = await request.json();

    if (!imageData || !questId) {
      return NextResponse.json(
        { error: 'Image data and quest ID are required' },
        { status: 400 }
      );
    }

    // Get Lighthouse API key from environment
    const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;
    
    if (!LIGHTHOUSE_API_KEY) {
      return NextResponse.json(
        { error: 'Lighthouse API key not configured' },
        { status: 500 }
      );
    }

    // Convert base64 data URL to buffer
    const base64Data = imageData.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create a temporary file with quest-specific naming
    const questFolder = questTitle?.toLowerCase().replace(/\s+/g, '-') || questId;
    const fileName = `${questFolder}/${Date.now()}-quest-image.jpg`;
    
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

    return NextResponse.json({
      success: true,
      questId,
      ipfsHash: uploadResponse.data.Hash,
      fileName: uploadResponse.data.Name,
      size: uploadResponse.data.Size,
      ipfsUrl: `https://gateway.lighthouse.storage/ipfs/${uploadResponse.data.Hash}`,
      datacoinMinted: mintResult ? true : false,
      mintTxHash: mintResult?.txHash || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image to IPFS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
