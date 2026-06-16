import { Worker } from "bullmq";
import { bullMQConnection } from "../index";
import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  sendShippingEmail,
} from "../../utils/email.utils";
import { logger } from "../../utils/logger.utils";

export const startEmailWorker = () => {
  const worker = new Worker(
    "email",
    async (job) => {
      const { type, data } = job.data;

      logger.info(`Processing email job: ${type}`);

      switch (type) {
        case "welcome":
          await sendWelcomeEmail(data.email, data.name);
          break;
        case "order_confirmation":
          await sendOrderConfirmationEmail(
            data.email,
            data.name,
            data.orderId,
            data.totalAmount,
          );
          break;
        case "payment_success":
          await sendPaymentSuccessEmail(
            data.email,
            data.name,
            data.orderId,
            data.totalAmount,
          );
          break;
        case "shipping":
          await sendShippingEmail(data.email, data.name, data.orderId);
          break;
        default:
          logger.warn(`Unknown email job type: ${type}`);
      }
    },
    { connection: bullMQConnection },
  );

  worker.on("completed", (job) => {
    logger.info(`Email job ${job.id} completed: ${job.data.type}`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Email job ${job?.id} failed: ${err.message}`);
  });

  logger.info("✅ BullMQ email worker started");
  return worker;
};
