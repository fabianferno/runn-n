import { NextRequest, NextResponse } from 'next/server';
import lighthouse from '@lighthouse-web3/sdk';

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

    return NextResponse.json({
      success: true,
      questId,
      ipfsHash: uploadResponse.data.Hash,
      fileName: uploadResponse.data.Name,
      size: uploadResponse.data.Size,
      ipfsUrl: `https://gateway.lighthouse.storage/ipfs/${uploadResponse.data.Hash}`,
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
