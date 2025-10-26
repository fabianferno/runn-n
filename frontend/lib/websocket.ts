import { parseAnyRPCResponse } from "@erc7824/nitrolite";

export type WsStatus = "Connecting" | "Connected" | "Disconnected";

type StatusListener = (status: WsStatus) => void;
type MessageListener = (data: unknown) => void;
type CoordinatesListener = (data: unknown) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private status: WsStatus = "Disconnected";
  private statusListeners: Set<StatusListener> = new Set();
  private messageListeners: Set<MessageListener> = new Set();
  private coordinatesListeners: Set<CoordinatesListener> = new Set();
  private messageQueue: string[] = [];
  private requestId = 1;

  public connect() {
    if (this.socket && this.socket.readyState < 2) return;
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
      this.messageQueue.forEach((msg) => this.socket?.send(msg));
      this.messageQueue = [];
    };
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("On message at websocket: ", event);
        this.messageListeners.forEach((listener) => listener(data));

        // Coordinates handler
        this.coordinatesListeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
    this.socket.onclose = () => this.updateStatus("Disconnected");
    this.socket.onerror = () => this.updateStatus("Disconnected");
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

  public addCoordinatesListener(listener: CoordinatesListener) {
    this.coordinatesListeners.add(listener);
  }

  public removeCoordinatesListener(listener: CoordinatesListener) {
    this.coordinatesListeners.delete(listener);
  }
}

export const webSocketService = new WebSocketService();
