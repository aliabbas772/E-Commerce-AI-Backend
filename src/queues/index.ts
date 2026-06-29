import { Queue } from "bullmq";
import redis from "../config/redis";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    attempts: 3, 
    backoff: {
      type: "exponential",
      delay: 2000, 
    },
    removeOnComplete: 100, 
    removeOnFail: 200, 
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
