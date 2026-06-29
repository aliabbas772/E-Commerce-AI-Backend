import { Kafka } from "kafkajs";
import { logger } from "../utils/logger.utils";

const kafka = new Kafka({
  clientId: "ecommerce-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "ecommerce-group" });

export const connectKafka = async (): Promise<void> => {
  await producer.connect();
  logger.info("✅ Kafka producer connected");
  logger.info(`Kafka broker: ${process.env.KAFKA_BROKER}`);
};

export default kafka;
