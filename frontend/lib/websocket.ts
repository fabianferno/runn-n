import { parseAnyRPCResponse } from "@erc7824/nitrolite";

export type WsStatus = "Connecting" | "Connected" | "Disconnected";

type StatusListener = (status: WsStatus) => void;
type MessageListener = (data: unknown) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private status: WsStatus = "Disconnected";
  private statusListeners: Set<StatusListener> = new Set();
  private messageListeners: Set<MessageListener> = new Set();
  private messageQueue: string[] = [];
  private requestId = 1;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  public connect() {
    if (this.socket && this.socket.readyState < 2) return;
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    const wsUrl = process.env.NEXT_PUBLIC_NITROLITE_WS_URL;
    if (!wsUrl) {
      console.error("NEXT_PUBLIC_NITROLITE_WS_URL is not set");
      this.updateStatus("Disconnected");
      return;
    }
    
    this.updateStatus("Connecting");
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log("WebSocket Connected");
      this.updateStatus("Connected");
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.messageQueue.forEach((msg) => this.socket?.send(msg));
      this.messageQueue = [];
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageListeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
    
    this.socket.onclose = () => {
      this.updateStatus("Disconnected");
      this.scheduleReconnect();
    };
    
    this.socket.onerror = () => {
      this.updateStatus("Disconnected");
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached. Stopping reconnection attempts.");
      return;
    }

    // Exponential backoff: 2^attempts seconds, max 30 seconds
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public send(payload: string) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(payload);
    else this.messageQueue.push(payload);
  }

  private updateStatus(newStatus: WsStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => listener(this.status));
  }

  public addStatusListener(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status);
  }

  public removeStatusListener(listener: StatusListener) {
    this.statusListeners.delete(listener);
  }

  public addMessageListener(listener: MessageListener) {
    this.messageListeners.add(listener);
  }

  public removeMessageListener(listener: MessageListener) {
    this.messageListeners.delete(listener);
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.updateStatus("Disconnected");
  }

  public forceReconnect() {
    console.log("Force reconnecting WebSocket...");
    this.reconnectAttempts = 0; // Reset attempts for manual reconnect
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}

export const webSocketService = new WebSocketService();
