import { Queue } from "bullmq";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const connection = DEMO_MODE
  ? {
      host: process.env.UPSTASH_REDIS_TCP_HOST!,
      port: Number(process.env.UPSTASH_REDIS_TCP_PORT!) || 6379,
      password: process.env.UPSTASH_REDIS_TCP_PASSWORD!,
      tls: {},
    }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
    };

export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
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

export const invoiceQueue = new Queue("invoice", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export { connection as bullMQConnection };
