import express, { Application } from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";

import territoriesRoutes from "./routes/territories.routes";
import usersRoutes from "./routes/users.routes";
import { SocketHandler } from "./websocket/socket.handler";
import { errorHandler } from "./middleware/error.middleware";
import { connectDatabase } from "./config/database";

// Load environment variables
dotenv.config();

const app: Application = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
(async () => {
  // Connect to MongoDB
  await connectDatabase();

  // ... rest of your server setup ...
})();
// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
  });
});

// Routes
app.use("/api/territories", territoriesRoutes);
app.use("/api/users", usersRoutes);

// Error handler
app.use(errorHandler);

// Initialize WebSocket handler
const socketHandler = new SocketHandler(io);

// Export socketHandler for use in routes if needed
export { socketHandler };

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
