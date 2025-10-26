import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import { RegionModel } from '@/lib/models/region.model';
import { UserModel } from '@/lib/models/user.model';
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

interface SessionEndMessage {
  type: 'session_end';
  userId: string;
  userColor: string;
  sessionStats: {
    hexesCaptured: number;
    distance: number;
    duration: number;
    timestamp: number;
  };
}

type NitroliteMessage = HexCaptureMessage | PathCompleteMessage | SessionEndMessage;

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
      case 'session_end':
        await processSessionEnd(message);
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

/**
 * Process session end and update user stats
 */
async function processSessionEnd(message: SessionEndMessage) {
  try {
    console.log(`👤 Processing session end for user: ${message.userId}`);
    
    // Get or create user
    let user = await UserModel.findById(message.userId);
    
    if (!user) {
      console.log(`📦 Creating new user: ${message.userId}`);
      user = new UserModel({
        _id: message.userId,
        color: message.userColor,
        stats: {
          totalHexes: 0,
          totalRegions: 0,
          largestCapture: 0,
          totalCaptures: 0,
          lastActive: Date.now(),
        },
        activeRegions: [],
      });
    } else {
      // Update color if it changed
      user.color = message.userColor;
    }
    
    // Update user stats
    user.stats.totalHexes += message.sessionStats.hexesCaptured;
    user.stats.totalCaptures += 1;
    user.stats.lastActive = message.sessionStats.timestamp;
    
    // Update largest capture if this session was bigger
    if (message.sessionStats.hexesCaptured > user.stats.largestCapture) {
      user.stats.largestCapture = message.sessionStats.hexesCaptured;
    }
    
    // Check for region ownership - count hexes per region
    const userRegions = await RegionModel.find({
      'metadata.contestedBy': message.userId
    });
    
    const ownedRegions: string[] = [];
    for (const region of userRegions) {
      const userHexCount = region.metadata.playerCounts.get(message.userId) || 0;
      const totalHexes = region.metadata.hexCount;
      
      // Consider region "owned" if user has >50% of hexes
      if (userHexCount > totalHexes * 0.5) {
        ownedRegions.push(region._id);
      }
    }
    
    user.activeRegions = ownedRegions;
    user.stats.totalRegions = ownedRegions.length;
    
    await user.save();
    
    console.log(`✅ ✅ ✅ USER STATS UPDATED: ${message.userId} ✅ ✅ ✅`);
    console.log(`   📊 Total Hexes: ${user.stats.totalHexes} (+${message.sessionStats.hexesCaptured})`);
    console.log(`   🏆 Total Regions Owned: ${user.stats.totalRegions}`);
    console.log(`   ⭐ Largest Capture: ${user.stats.largestCapture}`);
    console.log(`   🎯 Total Sessions: ${user.stats.totalCaptures}`);
    
    return true;
  } catch (error) {
    console.error(`❌ ❌ ❌ FAILED TO UPDATE USER STATS ❌ ❌ ❌`);
    console.error('Error details:', error);
    throw error;
  }
}

