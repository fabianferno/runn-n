import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import { RegionModel } from '@/lib/models/region.model';
import { PathService } from '@/lib/services/path.service';
import { H3Service } from '@/lib/services/h3.service';

interface HexCaptureMessage {
  type: 'hex_capture';
  userId: string;
  hexId: string;
  lat: number;
  lng: number;
  color: string;
  timestamp: number;
}

interface PathCompleteMessage {
  type: 'path_complete';
  userId: string;
  path: [number, number][];
  distance: number;
  color: string;
  timestamp: number;
}

type NitroliteMessage = HexCaptureMessage | PathCompleteMessage;

/**
 * API Route to process Nitrolite messages server-side
 */
export async function POST(request: NextRequest) {
  try {
    const message: NitroliteMessage = await request.json();
    
    console.log('📥 Server processing Nitrolite message:', message.type);

    await connectDB();

    switch (message.type) {
      case 'hex_capture':
        await processHexCapture(message);
        break;
      case 'path_complete':
        await processPathComplete(message);
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown message type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error processing Nitrolite message:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Process hex capture and save to MongoDB
 */
async function processHexCapture(message: HexCaptureMessage) {
  try {
    console.log(`💾 Processing hex capture: ${message.hexId} by ${message.userId}`);

    // Get region ID
    const regionId = H3Service.getRegionForHex(message.hexId, 4);
    
    // Get or create region
    let region = await RegionModel.findById(regionId);

    if (!region) {
      console.log(`📦 Creating new region: ${regionId}`);
      region = new RegionModel({
        _id: regionId,
        territories: new Map(),
        metadata: {
          hexCount: 0,
          lastUpdate: Date.now(),
          playerCounts: new Map(),
          contestedBy: [],
        },
      });
    }

    // Update territory
    region.territories.set(message.hexId, {
      user: message.userId,
      color: message.color,
      capturedAt: message.timestamp,
      method: "click",
    });

    // Update metadata
    region.metadata.hexCount = region.territories.size;
    region.metadata.lastUpdate = Date.now();
    
    const currentCount = region.metadata.playerCounts.get(message.userId) || 0;
    region.metadata.playerCounts.set(message.userId, currentCount + 1);

    if (!region.metadata.contestedBy.includes(message.userId)) {
      region.metadata.contestedBy.push(message.userId);
    }

    await region.save();
    
    console.log(`✅ ✅ ✅ HEX STORED IN DB: ${message.hexId} (region: ${regionId}) ✅ ✅ ✅`);
    return true;
  } catch (error) {
    console.error(`❌ ❌ ❌ FAILED TO STORE HEX IN DB: ${message.hexId} ❌ ❌ ❌`);
    console.error('Error details:', error);
    throw error;
  }
}

/**
 * Process complete path and save to MongoDB
 */
async function processPathComplete(message: PathCompleteMessage) {
  try {
    console.log(`💾 Processing path: ${message.path.length} points by ${message.userId}`);

    // Use existing PathService to process
    const result = await PathService.processPath({
      user: message.userId,
      color: message.color,
      path: message.path,
      options: {
        autoClose: true,
        minLoopSize: 3,
      },
    });

    console.log(`✅ ✅ ✅ PATH STORED IN DB: ${result.hexesCaptured} hexes, type: ${result.pathType} ✅ ✅ ✅`);
    return true;
  } catch (error) {
    console.error(`❌ ❌ ❌ FAILED TO STORE PATH IN DB ❌ ❌ ❌`);
    console.error('Error details:', error);
    throw error;
  }
}

