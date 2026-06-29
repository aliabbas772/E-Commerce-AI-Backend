import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.utils";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = req.headers["x-request-id"];

  logger.error({
    requestId,
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    requestId,
  });
};
