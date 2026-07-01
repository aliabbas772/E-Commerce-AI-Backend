import { publisher } from "../config/redisPubSub";

export const publishToUser = async (
  userId: string,
  event: string,
  data: object,
): Promise<void> => {
  const channel = `user:${userId}:notifications`;
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  await publisher?.publish(channel, message);
};
