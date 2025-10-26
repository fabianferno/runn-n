import { webSocketService } from '@/lib/websocket';
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

export class NitroliteProcessor {
  private static listening = false;

  /**
   * Start listening to Nitrolite messages and process them
   */
  static startProcessing() {
    if (this.listening) return;
    
    this.listening = true;
    console.log('🎧 NitroliteProcessor: Started listening...');

    // Hook into existing websocket.ts message listeners
    webSocketService.addMessageListener(async (rawData: unknown) => {
      try {
        // Parse the Nitrolite RPC response
        const data = rawData as any;
        
        // Check if it's a SubmitAppState message (our coordinates!)
        if (data.method === 'SubmitAppState' && data.params?.session_data) {
          const sessionData = JSON.parse(data.params.session_data);
          
          console.log('📥 Received Nitrolite message:', sessionData.type);
          
          // Process the message
          await this.processMessage(sessionData);
        }
      } catch (error) {
        // Silently fail for non-message data (auth, balances, etc.)
        // console.debug('Not a processable message:', error);
      }
    });
  }

  /**
   * Process incoming Nitrolite message
   */
  private static async processMessage(message: NitroliteMessage) {
    await connectDB();

    switch (message.type) {
      case 'hex_capture':
        await this.processHexCapture(message);
        break;
      case 'path_complete':
        await this.processPathComplete(message);
        break;
      default:
        console.log('Unknown message type:', (message as any).type);
    }
  }

  /**
   * Process hex capture and save to MongoDB
   */
  private static async processHexCapture(message: HexCaptureMessage) {
    try {
      console.log(`💾 Saving hex ${message.hexId} to MongoDB...`);

      // Get region ID
      const regionId = H3Service.getRegionForHex(message.hexId, 4);
      
      // Get or create region
      let region = await RegionModel.findById(regionId);

      if (!region) {
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
      
      console.log(`✅ Saved hex ${message.hexId} to MongoDB`);
    } catch (error) {
      console.error('❌ Error saving hex capture:', error);
    }
  }

  /**
   * Process complete path and save to MongoDB
   */
  private static async processPathComplete(message: PathCompleteMessage) {
    try {
      console.log(`💾 Processing path (${message.path.length} points)...`);

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

      console.log(`✅ Path processed: ${result.hexesCaptured} hexes, type: ${result.pathType}`);
    } catch (error) {
      console.error('❌ Error processing path:', error);
    }
  }

  static stopProcessing() {
    this.listening = false;
    console.log('🔇 NitroliteProcessor: Stopped listening');
  }
}

