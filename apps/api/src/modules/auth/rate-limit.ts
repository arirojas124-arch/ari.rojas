import type { NextFunction, Request, Response } from 'express';

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 10;

export function authRateLimit(request: Request, response: Response, next: NextFunction) {
  const key = request.ip ?? 'unknown';
  const now = Date.now();
  const current = attempts.get(key);
  const attempt = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  attempt.count += 1;
  attempts.set(key, attempt);

  if (attempt.count > maxAttempts) {
    response.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' } });
    return;
  }

  next();
}