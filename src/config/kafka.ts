import { Kafka } from "kafkajs";
import { logger } from "../utils/logger.utils";

const kafka = new Kafka({
  clientId: "ecommerce-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "ecommerce-group" });

const DEMO_MODE = process.env.DEMO_MODE === "true";

export const connectKafka = async (): Promise<void> => {
  if (DEMO_MODE) {
    console.log("DEMO_MODE: skipping Kafka connection");
    return;
  }
  
  await producer.connect();
  logger.info("✅ Kafka producer connected");
  logger.info(`Kafka broker: ${process.env.KAFKA_BROKER}`);
};

export default kafka;
