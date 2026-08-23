import Redis from "ioredis";
import { logger } from "../utils/logger.utils";

export let publisher: Redis | null = null;
export let subscriber: Redis | null = null;

const DEMO_MODE = process.env.DEMO_MODE === "true";

export const connectPubSub = async (): Promise<void> => {
  const connectionOptions = DEMO_MODE
    ? { tls: {}, lazyConnect: true }
    : {
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        lazyConnect: true,
      };

  publisher = DEMO_MODE
    ? new Redis(process.env.UPSTASH_REDIS_TCP_URL!, connectionOptions)
    : new Redis(connectionOptions as any);

  subscriber = DEMO_MODE
    ? new Redis(process.env.UPSTASH_REDIS_TCP_URL!, connectionOptions)
    : new Redis(connectionOptions as any);

  await publisher.connect();
  await subscriber.connect();

  logger.info(
    DEMO_MODE
      ? "✅ Upstash Redis Pub/Sub connected"
      : "✅ Redis Pub/Sub connected",
  );
};
