import redis from "../config/redis";
import { producer, consumer } from "../config/kafka";
import { publisher, subscriber } from "../config/redisPubSub";
import { logger } from "./logger.utils";

export const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");

  try {
    await producer.disconnect();
    await consumer.disconnect();
    await redis.quit();
    await publisher.quit();
    await subscriber.quit();
  } catch (err) {
    logger.error(`Shutdown error: ${err}`);
  }

  process.exit(0);
};
