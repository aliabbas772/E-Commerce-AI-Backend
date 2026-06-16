import { Worker } from "bullmq";
import { bullMQConnection } from "../index";
import { Notification } from "../../models/Notification.model";
import { publishToUser } from "../../utils/pubsub.utils";
import { logger } from "../../utils/logger.utils";

export const startNotificationWorker = () => {
  const worker = new Worker(
    "notification",
    async (job) => {
      const { userId, type, title, message, link, metadata } = job.data;

      // 1. Persist to MongoDB
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        link,
        metadata,
      });

      // 2. Push real-time via Redis Pub/Sub → WebSocket
      await publishToUser(userId, "new_notification", {
        _id: notification._id,
        type,
        title,
        message,
        link,
        isRead: false,
        createdAt: notification.createdAt,
      });

      logger.info(`Notification sent to user ${userId}: ${type}`);
    },
    { connection: bullMQConnection },
  );

  worker.on("failed", (job, err) => {
    logger.error(`Notification job ${job?.id} failed: ${err.message}`);
  });

  logger.info("✅ BullMQ notification worker started");
  return worker;
};
