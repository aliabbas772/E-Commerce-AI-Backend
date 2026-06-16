import { Queue } from "bullmq";
import redis from "../config/redis";

// Why separate connection for BullMQ:
// BullMQ needs its own Redis connection — it uses blocking commands
// that conflict with ioredis pub/sub and regular commands
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    attempts: 3, // retry 3 times if fails
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s between retries
    },
    removeOnComplete: 100, // keep last 100 completed jobs for debugging
    removeOnFail: 200, // keep last 200 failed jobs for inspection
  },
});

export const notificationQueue = new Queue("notification", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

export { connection as bullMQConnection };
