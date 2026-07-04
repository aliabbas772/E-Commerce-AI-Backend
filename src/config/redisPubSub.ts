// import Redis from "ioredis";
// import { logger } from "../utils/logger.utils";

// // Why separate connections:
// // Subscriber connection enters "subscribe mode" — it can ONLY subscribe/receive
// // It cannot run regular Redis commands while subscribed
// // So we need a separate publisher connection for regular commands
// const DEMO_MODE = process.env.DEMO_MODE === "true";
// console.log("DEMO_MODE in redisPubSub:", process.env.DEMO_MODE);

// export const publisher = DEMO_MODE
//   ? null
//   : new Redis({
//       host: process.env.REDIS_HOST || "localhost",
//       port: Number(process.env.REDIS_PORT) || 6379,
//       lazyConnect: true,
//     });

// export const subscriber = DEMO_MODE
//   ? null
//   : new Redis({
//       host: process.env.REDIS_HOST || "localhost",
//       port: Number(process.env.REDIS_PORT) || 6379,
//       lazyConnect: true,
//     });

// export const connectPubSub = async (): Promise<void> => {
//   if (DEMO_MODE) {
//     logger.info("Skipping Redis Pub/Sub in demo mode");
//     return;
//   }

//   if (!publisher || !subscriber) return;

//   await publisher.connect();
//   await subscriber.connect();
//   logger.info("✅ Redis Pub/Sub connected");
// };

import Redis from "ioredis";
import { logger } from "../utils/logger.utils";

export let publisher: Redis | null = null;
export let subscriber: Redis | null = null;

export const connectPubSub = async (): Promise<void> => {
  if (process.env.DEMO_MODE === "true") {
    logger.info("Skipping Redis Pub/Sub");
    return;
  }

  publisher = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
  });

  subscriber = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
  });

  await publisher.connect();
  await subscriber.connect();

  logger.info("✅ Redis Pub/Sub connected");
};
