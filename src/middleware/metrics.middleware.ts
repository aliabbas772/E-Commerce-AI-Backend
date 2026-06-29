import { Request, Response, NextFunction } from "express";
import { httpRequestsTotal, httpRequestDuration } from "../config/metrics";

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  // Hook into response finish event
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000; // convert to seconds
    const route = req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration,
    );
  });

  next();
};
