import { GraphQLError } from "graphql";
import { outfitSchema, sizeSchema } from "../validators/ai.validators";
import { logger } from "../utils/logger.utils";
import redis from "../config/redis";
import {
  getOutfitRecommendation,
  getSizeRecommendation,
} from "../utils/ai.utils";
import { timeout } from "../utils/timeout.utils";
import { aiRequestsTotal } from "../config/metrics";

const AI_RATE_LIMIT = 5;
const AI_RATE_WINDOW = 900;
const AI_CACHE_TTL = 7200;

export const getOutfitRecommendationService = async (
  args: { occasion: string; budget: number; gender: string },
  userId: string,
): Promise<{ recommendation: string }> => {
  try {
    outfitSchema.parse(args);

    const cacheKey = `ai-outfit:${args.occasion}:${args.budget}:${args.gender}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info("AI outfit cache hit");
      aiRequestsTotal.inc({ type: "outfit", cache_status: "hit" });
      return { recommendation: JSON.parse(cached as string) };
    }

    // Rate limit per user
    const attemptsKey = `AiOutfitAttempts:${userId}`;
    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) {
      await redis.expire(attemptsKey, AI_RATE_WINDOW);
    }
    if (attempts > AI_RATE_LIMIT) {
      throw new GraphQLError("Too many AI requests, try after some time", {
        extensions: { code: "RATE_LIMITED" },
      });
    }

    const recommendation = (await Promise.race([
      getOutfitRecommendation(args.occasion, args.budget, args.gender),
      timeout(10000),
    ])) as string;

    await redis.setex(cacheKey, AI_CACHE_TTL, JSON.stringify(recommendation));

    aiRequestsTotal.inc({ type: "outfit", cache_status: "miss" });

    return { recommendation };
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export const getSizeRecommendationService = async (
  args: { height: number; weight: number; gender: string; category: string },
  userId: string,
): Promise<{ recommendation: string }> => {
  try {
    sizeSchema.parse(args);

    const cacheKey = `ai-size:${args.height}:${args.weight}:${args.gender}:${args.category}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info("AI size cache hit");
      aiRequestsTotal.inc({ type: "size", cache_status: "hit" });
      return { recommendation: JSON.parse(cached as string) };
    }

    const attemptsKey = `AiSizeAttempts:${userId}`;
    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) {
      await redis.expire(attemptsKey, AI_RATE_WINDOW);
    }
    if (attempts > AI_RATE_LIMIT) {
      throw new GraphQLError("Too many AI requests, try after some time", {
        extensions: { code: "RATE_LIMITED" },
      });
    }

    const recommendation = (await Promise.race([
      getSizeRecommendation(
        args.height,
        args.weight,
        args.gender,
        args.category,
      ),
      timeout(10000),
    ])) as string;

    await redis.setex(cacheKey, AI_CACHE_TTL, JSON.stringify(recommendation));

    aiRequestsTotal.inc({ type: "size", cache_status: "miss" });

    return { recommendation };
  } catch (error) {
    logger.error(error);
    throw error;
  }
};
