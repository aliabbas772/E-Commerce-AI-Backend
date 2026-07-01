import IORedis from "ioredis";
import { logger } from "../utils/logger.utils";
import { Redis as UpstashRedis} from "@upstash/redis";

const DEMO_MODE = process.env.DEMO_MODE === "true";
let redis: IORedis | UpstashRedis;

if (DEMO_MODE) {
  redis = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
} else {
  redis = new IORedis({
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
}

export default redis;
