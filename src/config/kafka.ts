// import { Kafka } from "kafkajs";
// import { logger } from "../utils/logger.utils";

// const DEMO_MODE = process.env.DEMO_MODE === "true";

// // List all the topics your e-commerce application uses
// const REQUIRED_TOPICS = ["orders-topic", "products-topic", "reviews-topic"];

// const kafka = DEMO_MODE
//   ? new Kafka({
//       clientId: "ecommerce-app",
//       brokers: [process.env.UPSTASH_KAFKA_BROKER!],
//       ssl: true,
//       sasl: {
//         mechanism: "scram-sha-256",
//         username: process.env.UPSTASH_KAFKA_USERNAME!,
//         password: process.env.UPSTASH_KAFKA_PASSWORD!,
//       },
//     })
//   : new Kafka({
//       clientId: "ecommerce-app",
//       brokers: [process.env.KAFKA_BROKER || "localhost:29092"],
//     });

// export const producer = kafka.producer();
// export const consumer = kafka.consumer({ groupId: "ecommerce-group" });

// export const connectKafka = async (): Promise<void> => {
//   // 1. Connect Admin client to verify/create topics first
//   const admin = kafka.admin();
//   try {
//     await admin.connect();

//     // Check existing topics
//     const existingTopics = await admin.listTopics();
//     const topicsToCreate = REQUIRED_TOPICS.filter(
//       (topic) => !existingTopics.includes(topic),
//     );

//     // Create missing topics before producer/consumer interactions
//     if (topicsToCreate.length > 0) {
//       logger.info(
//         `🔨 Creating missing Kafka topics: ${topicsToCreate.join(", ")}`,
//       );
//       await admin.createTopics({
//         validateOnly: false,
//         waitForLeaders: true,
//         topics: topicsToCreate.map((topic) => ({ topic })),
//       });
//     }
//   } catch (error) {
//     logger.error("❌ Failed to initialize Kafka topics:", error);
//   } finally {
//     await admin.disconnect();
//   }

//   // 2. Connect Producer
//   await producer.connect();
//   logger.info(
//     DEMO_MODE
//       ? "✅ Upstash Kafka producer connected"
//       : "✅ Kafka producer connected",
//   );
// };

// export default kafka;

import { Kafka } from "kafkajs";
import { logger } from "../utils/logger.utils";

const DEMO_MODE = process.env.DEMO_MODE === "true";

// Kafka is fully disabled while Upstash's free Kafka tier is dead and no
// free replacement exists. Flip this back on if you get a real broker later.
export const KAFKA_ENABLED = !DEMO_MODE;

const REQUIRED_TOPICS = ["orders-topic", "products-topic", "reviews-topic"];

// Safe to construct even when disabled — kafkajs doesn't touch the network
// until .connect() is called.
console.log(process.env.KAFKA_BROKER, "KAFKA_BROKER");
const kafka = new Kafka({
  clientId: "ecommerce-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:29092"],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "ecommerce-group" });

let producerConnected = false;

export const connectKafka = async (): Promise<void> => {
  console.log(process.env.KAFKA_BROKER, "KAFKA_BROKER");
  if (!KAFKA_ENABLED) {
    logger.info(
      "⚠️ KAFKA_ENABLED=false (DEMO_MODE) — skipping Kafka connection",
    );
    return;
  }

  const admin = kafka.admin();
  try {
    await admin.connect();
    const existingTopics = await admin.listTopics();
    const topicsToCreate = REQUIRED_TOPICS.filter(
      (topic) => !existingTopics.includes(topic),
    );
    if (topicsToCreate.length > 0) {
      logger.info(
        `🔨 Creating missing Kafka topics: ${topicsToCreate.join(", ")}`,
      );
      await admin.createTopics({
        validateOnly: false,
        waitForLeaders: true,
        topics: topicsToCreate.map((topic) => ({ topic })),
      });
    }
  } catch (error) {
    logger.error("❌ Failed to initialize Kafka topics:", error);
  } finally {
    await admin.disconnect();
  }

  await producer.connect();
  producerConnected = true;
  logger.info("✅ Kafka producer connected");
};

/**
 * Every producer file must call this instead of producer.send() directly.
 * No-ops (and logs) when Kafka is disabled or not yet connected, so a dead
 * broker can never fail checkout, registration, or any other request path.
 */
export const safePublish = async (
  topic: string,
  messages: { key: string; value: string }[],
): Promise<void> => {
  if (!KAFKA_ENABLED || !producerConnected) {
    logger.info(`[DEMO_MODE] Kafka disabled — skipped publish to "${topic}"`);
    return;
  }
  try {
    await producer.send({ topic, messages });
  } catch (error) {
    logger.error(`❌ Kafka publish failed for topic "${topic}":`, error);
  }
};

export default kafka;
