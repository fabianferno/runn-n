import { webSocketService } from '@/lib/websocket';

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
  private static listener: ((rawData: unknown) => Promise<void>) | null = null;

  /**
   * Start listening to Nitrolite messages and process them
   */
  static startProcessing() {
    if (this.listening) {
      console.log('⚠️ NitroliteProcessor: Already listening');
      return;
    }
    
    this.listening = true;
    console.log('🎧 NitroliteProcessor: Started listening for Nitrolite messages...');
    console.log('🎧 Total message listeners registered');

    // Create the listener function
    this.listener = async (rawData: unknown) => {
      console.log('🔔 NitroliteProcessor: Received raw data from websocket');
      
      try {
        // Parse the Nitrolite RPC response
        const data = rawData as any;
        
        console.log('🔍 NitroliteProcessor analyzing data:', {
          hasMethod: !!data.method,
          method: data.method,
          hasParams: !!data.params,
          hasSessionData: !!data.params?.session_data,
        });
        
        // Check if it's a SubmitAppState message (our coordinates!)
        if (data.method === 'SubmitAppState' && data.params?.session_data) {
          console.log('📥 ✅ Found SubmitAppState with session_data!');
          const sessionData = JSON.parse(data.params.session_data);
          
          console.log('📦 Parsed session data:', sessionData);
          console.log('📥 Processing Nitrolite message type:', sessionData.type);
          
          // Process the message
          await this.processMessage(sessionData);
        } else {
          console.log('⏭️ Skipping non-SubmitAppState message:', data.method);
        }
      } catch (error) {
        console.log('❌ NitroliteProcessor error:', error);
      }
    };

    // Hook into existing websocket.ts message listeners
    webSocketService.addMessageListener(this.listener);
    console.log('✅ NitroliteProcessor: Listener registered with webSocketService');
  }

  /**
   * Process incoming Nitrolite message by sending to API route
   */
  private static async processMessage(message: NitroliteMessage) {
    try {
      console.log(`🚀 Sending message to API for processing:`, message.type);
      
      // Send to server-side API route for processing
      const response = await fetch('/api/nitrolite-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API processing failed:', error);
        return;
      }

      const result = await response.json();
      console.log('✅ API processing successful:', result);
    } catch (error) {
      console.error('❌ Error calling processing API:', error);
    }
  }

  static stopProcessing() {
    if (this.listener) {
      webSocketService.removeMessageListener(this.listener);
      this.listener = null;
    }
    this.listening = false;
    console.log('🔇 NitroliteProcessor: Stopped listening');
  }
}

