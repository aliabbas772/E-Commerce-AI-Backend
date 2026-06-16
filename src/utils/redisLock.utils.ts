import redis from "../config/redis";
import { logger } from "./logger.utils";

const LOCK_TTL = 5000; // 5 seconds max lock duration

export const acquireLock = async (
  key: string,
  ttlMs: number = LOCK_TTL,
): Promise<boolean> => {
  // SET key value NX PX ttl
  // NX = only set if key does NOT exist (atomic operation)
  // PX = millisecond expiry
  const lockKey = `lock:${key}`;
  // Use expiry mode 'PX' then ttl before set mode 'NX' to match ioredis overloads
  const result = await redis.set(lockKey, "1", "PX", ttlMs, "NX");

  // Returns 'OK' if lock acquired, null if already locked
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
    throw new Error("Resource is currently being processed. Please try again.");
  }

  try {
    return await fn();
  } finally {
    // Always release lock — even if fn throws
    await releaseLock(key);
  }
};
