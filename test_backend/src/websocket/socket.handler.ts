import { Server as SocketIOServer, Socket } from "socket.io";
import { mockRegions } from "../data/mock-data";

export class SocketHandler {
  private io: SocketIOServer;
  private subscribedRegions: Map<string, Set<string>>; // socketId -> Set of regionIds

  constructor(io: SocketIOServer) {
    this.io = io;
    this.subscribedRegions = new Map();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log("Client connected:", socket.id);

      this.subscribedRegions.set(socket.id, new Set());

      // Handle authentication
      socket.on("authenticate", (data: { userId: string; token?: string }) => {
        console.log("User authenticated:", data.userId);
        socket.emit("authenticated", {
          userId: data.userId,
          sessionId: socket.id,
        });
      });

      // Handle region subscription
      socket.on("subscribe-regions", (data: { regionIds: string[] }) => {
        console.log("Subscribing to regions:", data.regionIds);

        const subscribed = this.subscribedRegions.get(socket.id) || new Set();

        data.regionIds.forEach((regionId) => {
          subscribed.add(regionId);
          socket.join(`region:${regionId}`);
        });

        this.subscribedRegions.set(socket.id, subscribed);

        // Send current state of subscribed regions
        const regionsData: any = {};
        let hexCount = 0;

        data.regionIds.forEach((regionId) => {
          const region = mockRegions.get(regionId);
          if (region) {
            regionsData[regionId] = {};
            Object.entries(region.territories).forEach(([hexId, territory]) => {
              regionsData[regionId][hexId] = {
                user: territory.user,
                color: territory.color,
              };
              hexCount++;
            });
          }
        });

        socket.emit("subscribed", {
          regionIds: data.regionIds,
          hexCount,
        });

        socket.emit("initial-state", {
          regions: regionsData,
        });
      });

      // Handle region unsubscription
      socket.on("unsubscribe-regions", (data: { regionIds: string[] }) => {
        console.log("Unsubscribing from regions:", data.regionIds);

        const subscribed = this.subscribedRegions.get(socket.id) || new Set();

        data.regionIds.forEach((regionId) => {
          subscribed.delete(regionId);
          socket.leave(`region:${regionId}`);
        });

        this.subscribedRegions.set(socket.id, subscribed);

        socket.emit("unsubscribed", {
          regionIds: data.regionIds,
        });
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        this.subscribedRegions.delete(socket.id);
      });
    });
  }

  /**
   * Broadcast territory update to subscribed clients
   */
  broadcastRegionUpdate(
    regionId: string,
    changes: { [hexId: string]: { user: string; color: string } | null },
    updatedBy: string
  ) {
    this.io.to(`region:${regionId}`).emit("region-update", {
      regionId,
      changes,
      updatedBy,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast path captured event
   */
  broadcastPathCaptured(data: {
    pathId: string;
    user: string;
    username: string;
    pathType: string;
    hexesCaptured: number;
    regionsAffected: string[];
  }) {
    // Broadcast to all clients subscribed to affected regions
    data.regionsAffected.forEach((regionId) => {
      this.io.to(`region:${regionId}`).emit("path-captured", {
        ...data,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Broadcast stats update to specific user
   */
  sendStatsUpdate(userId: string, stats: any) {
    // In a real implementation, you'd track user socket IDs
    this.io.emit("stats-update", stats);
  }
}
