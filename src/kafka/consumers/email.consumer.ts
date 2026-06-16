import { consumer } from "../../config/kafka";
import {
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  sendShippingEmail,
  sendWelcomeEmail,
} from "../../utils/email.utils";
import { logger } from "../../utils/logger.utils";

export const startEmailConsumer = async (): Promise<void> => {
  await consumer.connect();

  await consumer.subscribe({
    topics: [
      "order.created",
      "payment.verified",
      "order.shipped",
      "welcome.email",
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const data = JSON.parse(message.value?.toString() || "{}");

        switch (topic) {
          case "order.created":
            await sendOrderConfirmationEmail(
              data.email,
              data.name,
              data.orderId,
              data.totalAmount,
            );
            break;

          case "payment.verified":
            await sendPaymentSuccessEmail(
              data.email,
              data.name,
              data.orderId,
              data.totalAmount,
            );
            break;

          case "order.shipped":
            await sendShippingEmail(data.email, data.name, data.orderId);
            break;

          case "welcome.email":
            await sendWelcomeEmail(data.email, data.name);
            break;
        }
      } catch (error) {
        logger.error(error);
      }
    },
  });

  logger.info("✅ Kafka email consumer running");
};
