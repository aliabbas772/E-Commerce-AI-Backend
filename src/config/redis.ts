import IORedis from "ioredis";
import { logger } from "../utils/logger.utils";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const redis = DEMO_MODE
  ? new IORedis(process.env.UPSTASH_REDIS_TCP_URL!, {
      tls: {},
      maxRetriesPerRequest: 3,
    })
  : new IORedis({
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

redis.on("connect", () =>
  logger.info(DEMO_MODE ? "✅ Upstash Redis connected" : "✅ Redis Connected"),
);
redis.on("error", (err) => logger.error(`Redis Error ❌ ${err}`));

export default redis;
