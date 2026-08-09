import express from "express";
import { connectDB } from "./config/db";
import { connectKafka } from "./config/kafka";
import { startEmailConsumer } from "./kafka/consumers/email.consumer";
import { startEmailWorker } from "./queues/workers/email.worker";
import { startNotificationWorker } from "./queues/workers/notification.worker";
import { logger } from "./utils/logger.utils";

const startWorker = async () => {
  await connectDB();
  await connectKafka();
  await startEmailConsumer();

  startEmailWorker();
  startNotificationWorker();

  logger.info("✅ All workers started");

  // Dummy HTTP server — Render free tier requires a bound port + health response
  const app = express();
  app.get("/health", (_req, res) => res.status(200).send("worker alive"));
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => logger.info(`Worker health server on port ${PORT}`));
};

startWorker();
