import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { subscriber } from "../config/redisPubSub";
import { verifyAccessToken } from "../utils/jwt.utils";
import { logger } from "../utils/logger.utils";
import { activeWebSocketConnections } from "../config/metrics";

// Map of userId → Set of WebSocket connections
// Why Set: same user can have multiple tabs open
const clients = new Map<string, Set<WebSocket>>();

const addClient = (userId: string, ws: WebSocket) => {
  if (!subscriber) return;
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
    // Subscribe to Redis channel for this user
    subscriber?.subscribe(`user:${userId}:notifications`, (err) => {
      if (err) logger.error(`Subscribe error for user ${userId}: ${err}`);
    });
  }
  clients.get(userId)!.add(ws);
  activeWebSocketConnections.inc();
};

const removeClient = (userId: string, ws: WebSocket) => {
  if (!subscriber) return;
  const userClients = clients.get(userId);
  if (!userClients) return;

  userClients.delete(ws);
  activeWebSocketConnections.inc();

  if (userClients.size === 0) {
    clients.delete(userId);
    // Unsubscribe from Redis when no connections left
    subscriber?.unsubscribe(`user:${userId}:notifications`);
  }
};

export const setupWebSocket = (server: any): void => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    let userId: string | null = null;

    try {
      // Extract token from query string
      // Frontend connects: new WebSocket('ws://localhost:4000/ws?token=xxx')
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(1008, "Token required");
        return;
      }

      const decoded = verifyAccessToken(token) as { userId: string };
      userId = decoded.userId;

      addClient(userId, ws);
      logger.info(`WebSocket connected: user ${userId}`);

      // Send connection confirmation
      ws.send(JSON.stringify({ event: "connected", data: { userId } }));

      // Handle ping/pong — keep connection alive
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        } catch {
          // Ignore invalid messages
        }
      });

      ws.on("close", () => {
        if (userId) {
          removeClient(userId, ws);
          logger.info(`WebSocket disconnected: user ${userId}`);
        }
      });

      ws.on("error", (err) => {
        logger.error(`WebSocket error for user ${userId}: ${err}`);
        if (userId) removeClient(userId, ws);
      });
    } catch (err) {
      logger.error(`WebSocket auth failed: ${err}`);
      ws.close(1008, "Invalid token");
    }
  });

  // Redis subscriber listens to ALL user channels
  // Routes messages to correct WebSocket clients
  if (!subscriber) return;
  subscriber?.on("message", (channel: string, message: string) => {
    // channel format: "user:userId:notifications"
    const parts = channel.split(":");
    const userId = parts[1];

    const userClients = clients.get(userId);
    if (!userClients) return;

    // Send to all open connections for this user (multiple tabs)
    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  logger.info("✅ WebSocket server running on /ws");
};
