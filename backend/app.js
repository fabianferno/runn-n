import WebSocket from "ws";
import { WebSocketServer } from "ws";
import http from "http";
import express from "express";
import cors from "cors";

// Tile math utilities
class TileMath {
  static R_MAJOR = 6378137; // Earth's major radius in meters

  static latLonToTileId(lat, lon) {
    const x = (this.R_MAJOR * lon * Math.PI) / 180;
    const y = this.R_MAJOR * Math.log(Math.tan(((90 + lat) * Math.PI) / 360));
    const tileX = Math.floor(x / 10);
    const tileY = Math.floor(y / 10);
    return `${tileX}_${tileY}`;
  }

  static getGameChannelName() {
    return "game:running-territory";
  }
}

class RunningGameServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.tiles = new Map(); // tileId -> { ownerId, capturedAt }
    this.users = new Map(); // userId -> { displayName, score, lastSeen }
    this.leaderboard = new Map(); // userId -> score
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupRoutes() {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        tiles: this.tiles.size,
        users: this.users.size,
      });
    });

    // Capture tile endpoint
    this.app.post("/capture", (req, res) => {
      const { userId, lat, lon, accuracy } = req.body;

      // Basic validation
      if (!userId || !lat || !lon) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (accuracy > 25) {
        return res.status(400).json({ error: "GPS accuracy too low" });
      }

      const tileId = TileMath.latLonToTileId(lat, lon);
      const capturedAt = new Date().toISOString();

      // Get previous owner (if any)
      const previousOwner = this.tiles.get(tileId)?.ownerId;

      // Capture/re-capture the tile (territory can change hands!)
      this.tiles.set(tileId, { ownerId: userId, capturedAt });

      // Update scores
      const currentScore = this.leaderboard.get(userId) || 0;
      this.leaderboard.set(userId, currentScore + 1);

      // If there was a previous owner, they lose a point
      if (previousOwner && previousOwner !== userId) {
        const previousScore = this.leaderboard.get(previousOwner) || 0;
        this.leaderboard.set(previousOwner, Math.max(0, previousScore - 1));
      }

      // Update user info
      if (!this.users.has(userId)) {
        this.users.set(userId, {
          displayName: `Runner_${userId.slice(-4)}`,
          score: 0,
          lastSeen: new Date(),
        });
      }
      const user = this.users.get(userId);
      user.score = currentScore + 1;
      user.lastSeen = new Date();

      // Broadcast tile capture to all players
      this.broadcastToAll({
        type: "tile.captured",
        tileId,
        ownerId: userId,
        previousOwner,
        capturedAt,
      });

      // Broadcast leaderboard update
      this.broadcastLeaderboardUpdate();

      res.json({
        success: true,
        tileId,
        capturedAt,
        newScore: currentScore + 1,
        previousOwner,
        territoryChanged: !!previousOwner,
      });
    });

    // Get tiles in viewport
    this.app.get("/tiles", (req, res) => {
      const { minLat, minLon, maxLat, maxLon } = req.query;

      if (!minLat || !minLon || !maxLat || !maxLon) {
        return res.status(400).json({ error: "Missing viewport bounds" });
      }

      const tiles = [];
      for (const [tileId, tile] of this.tiles.entries()) {
        // This is simplified - in production you'd want to check if tile is in bounds
        tiles.push({ tileId, ...tile });
      }

      res.json({ tiles });
    });

    // Get leaderboard
    this.app.get("/leaderboard", (req, res) => {
      const topUsers = Array.from(this.leaderboard.entries())
        .map(([userId, score]) => ({ userId, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      res.json({ leaderboard: topUsers });
    });
  }

  setupWebSocket() {
    this.wss.on("connection", (ws, req) => {
      console.log("🟢 New client connected");

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error("Invalid WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        console.log("🔴 Client disconnected");
      });
    });
  }

  handleWebSocketMessage(ws, message) {
    switch (message.type) {
      case "join_game":
        // Player joins the game
        ws.userId = message.userId;
        console.log(`🎮 Player ${message.userId} joined the game`);

        // Send current game state
        this.sendGameSnapshot(ws);
        break;

      case "position_update":
        const { userId, lat, lon, speed } = message;
        this.broadcastPresence(userId, lat, lon, speed);
        break;
    }
  }

  sendGameSnapshot(ws) {
    const tiles = Array.from(this.tiles.entries()).map(([tileId, tile]) => ({
      tileId,
      ...tile,
    }));

    const leaderboard = Array.from(this.leaderboard.entries())
      .map(([userId, score]) => ({ userId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    ws.send(
      JSON.stringify({
        type: "game.snapshot",
        tiles,
        leaderboard,
        ts: new Date().toISOString(),
      })
    );
  }

  broadcastToAll(message) {
    const channelName = TileMath.getGameChannelName();
    console.log(`📡 Broadcasting to ${channelName}:`, message.type);

    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  broadcastPresence(userId, lat, lon, speed) {
    this.broadcastToAll({
      type: "presence.heartbeat",
      userId,
      lat,
      lon,
      speed,
      ts: new Date().toISOString(),
    });
  }

  broadcastLeaderboardUpdate() {
    const leaderboard = Array.from(this.leaderboard.entries())
      .map(([userId, score]) => ({ userId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    this.broadcastToAll({
      type: "leaderboard.snapshot",
      top: leaderboard,
      ts: new Date().toISOString(),
    });
  }

  start(port = 3001) {
    this.server.listen(port, () => {
      console.log(`🏃‍♂️ Running Game Server started on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🎮 WebSocket: ws://localhost:${port}`);
    });
  }
}

// Start the server
const gameServer = new RunningGameServer();
gameServer.start();
