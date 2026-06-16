import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.utils.ts";
import { User } from "../models/User.model.ts";
import redis from "../config/redis.ts";
import { logger } from "../utils/logger.utils.ts";

export const attachUser = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token) as { userId: string };
    const user = await User.findById(decoded.userId);

    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) return next();

    if (user) {
      (req as any).user = user;
    }
  } catch (error) {
    logger.info(error);
    // throw error;
  }

  next();
};
