import Redis from "ioredis";
import { logger } from "../utils/logger.utils";

// Why separate connections:
// Subscriber connection enters "subscribe mode" — it can ONLY subscribe/receive
// It cannot run regular Redis commands while subscribed
// So we need a separate publisher connection for regular commands
export const publisher = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
});

export const subscriber = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
});

export const connectPubSub = async (): Promise<void> => {
  await publisher.connect();
  await subscriber.connect();
  logger.info("✅ Redis Pub/Sub connected");
};
