import Redis from "ioredis";
import { logger } from "../utils/logger.utils";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error("❌ Redis connection failed");
      return null;
    }
    return times * 200;
  },
});

redis.on("connect", () => logger.info("✅ Redis Connected"));
redis.on("error", (err) => logger.info(`Redis Error ❌`, err));

export default redis;
