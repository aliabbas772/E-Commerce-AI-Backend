import { redisLockFailures } from "../config/metrics";
import redis from "../config/redis";
import { logger } from "./logger.utils";

const LOCK_TTL = 5000; // 5 seconds max lock duration

export const acquireLock = async (
  key: string,
  ttlMs: number = LOCK_TTL,
): Promise<boolean> => {
  const lockKey = `lock:${key}`;
  const result = await redis.set(lockKey, "1", "PX", ttlMs, "NX");

  return result === "OK";
};

export const releaseLock = async (key: string): Promise<void> => {
  await redis.del(`lock:${key}`);
};

export const withLock = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = LOCK_TTL,
): Promise<T> => {
  const acquired = await acquireLock(key, ttlMs);

  if (!acquired) {
    redisLockFailures.inc();
    throw new Error("Resource is currently being processed. Please try again.");
  }

  try {
    return await fn();
  } finally {
    // Always release lock — even if fn throws
    await releaseLock(key);
  }
};
