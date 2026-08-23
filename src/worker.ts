// import express from "express";
// import { connectDB } from "./config/db";
// import { connectKafka } from "./config/kafka";
// import { startEmailConsumer } from "./kafka/consumers/email.consumer";
// import { startEmailWorker } from "./queues/workers/email.worker";
// import { startNotificationWorker } from "./queues/workers/notification.worker";
// import { logger } from "./utils/logger.utils";
// import { startInvoiceWorker } from "./queues/workers/invoice.worker";

// const startWorker = async () => {
//   await connectDB();

//   if (process.env.DEMO_MODE === "true") {
//     logger.info("⚠️ Running in DEMO_MODE, skipping worker start");
//     await connectKafka();
//     await startEmailConsumer();
//     startEmailWorker();
//     startNotificationWorker();
//     startInvoiceWorker();
//   }

//   logger.info("✅ All workers started");

//   // Dummy HTTP server — Render free tier requires a bound port + health response
//   const app = express();
//   app.get("/health", (_req, res) => res.status(200).send("worker alive"));
//   const PORT = process.env.PORT || 10000;
//   app.listen(PORT, () => logger.info(`Worker health server on port ${PORT}`));
// };

// startWorker();

import express from "express";
import { connectDB } from "./config/db";
import { connectKafka, KAFKA_ENABLED } from "./config/kafka";
import { startEmailConsumer } from "./kafka/consumers/email.consumer";
import { startEmailWorker } from "./queues/workers/email.worker";
import { startNotificationWorker } from "./queues/workers/notification.worker";
import { logger } from "./utils/logger.utils";
import { startInvoiceWorker } from "./queues/workers/invoice.worker";

const startWorker = async () => {
  await connectDB();

  // BullMQ workers run on Redis, not Kafka — always start these regardless
  // of DEMO_MODE.
  startEmailWorker();
  startNotificationWorker();
  startInvoiceWorker();

  if (KAFKA_ENABLED) {
    await connectKafka();
    await startEmailConsumer();
  } else {
    logger.info("⚠️ KAFKA_ENABLED=false (DEMO_MODE) — skipping Kafka consumer");
  }

  logger.info("✅ Worker started");

  const app = express();
  app.get("/health", (_req, res) => res.status(200).send("worker alive"));
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => logger.info(`Worker health server on port ${PORT}`));
};

startWorker();
