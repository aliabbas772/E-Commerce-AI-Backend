import mongoose from "mongoose";
import redis from "../config/redis";
import { Request, Response } from "express";

// Health check — before GraphQL middleware
export const healthCheck = async (req: Request, res: Response) => {
  const requestId = req.headers["x-request-id"];

  try {
    // Check MongoDB
    const mongoState = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const mongoStatus = mongoState === 1 ? "healthy" : "unhealthy";

    // Check Redis
    await redis.ping();
    const redisStatus = "healthy";

    const allHealthy = mongoStatus === "healthy" && redisStatus === "healthy";

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "healthy" : "degraded",
      requestId,
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
};
