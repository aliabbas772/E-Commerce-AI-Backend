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
import { GoogleGenAI } from "@google/genai";
import { Order } from "../models/Order.model";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SUPPORT_RATE_LIMIT = 10;
const SUPPORT_RATE_WINDOW = 900;

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

export const askSupportChatService = async (
  query: string,
  userId: string,
): Promise<{ reply: string }> => {
  const attemptsKey = `SupportChatAttempts:${userId}`;
  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) await redis.expire(attemptsKey, SUPPORT_RATE_WINDOW);
  if (attempts > SUPPORT_RATE_LIMIT) {
    throw new GraphQLError("Too many support requests, try again later", {
      extensions: { code: "RATE_LIMITED" },
    });
  }

  const recentOrder = await Order.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .populate("items.product")
    .lean();

  let orderContext = "No orders found for this account.";
  if (recentOrder) {
    const itemsList = recentOrder.items
      .map(
        (i: any) =>
          `${i.product?.name ?? "item"} (size ${i.size}, qty ${i.quantity})`,
      )
      .join(", ");
    orderContext = `
      - Order ID: ${recentOrder._id}
      - Items: ${itemsList}
      - Total: ₹${recentOrder.totalAmount}
      - Payment status: ${recentOrder.paymentStatus}
      - Delivery status: ${recentOrder.deliveryStatus}
    `;
  }

  const prompt = `
    You are a customer support assistant for an e-commerce platform.
    Use the [USER CONTEXT DATA] below to answer accurately.
    If the context doesn't answer the question, say you don't have that info.

    [STORE POLICY]
    - Shipping takes 3-5 days.
    - Returns allowed within 14 days of delivery.

    [USER CONTEXT DATA]
    ${orderContext}

    Customer question: "${query}"
    Answer:
  `;

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return { reply: response.text ?? "Sorry, I couldn't generate a response." };
};
