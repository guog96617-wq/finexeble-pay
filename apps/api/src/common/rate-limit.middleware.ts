import { NextFunction, Request, Response } from "express";

const buckets = new Map<string, { count: number; resetAt: number }>();
const windowMs = 60_000;
const limit = 100;

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (bucket.count >= limit) {
    res.status(429).json({
      success: false,
      error: { code: 429, message: "Rate limit exceeded" },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  bucket.count += 1;
  next();
}
