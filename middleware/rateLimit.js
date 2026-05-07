import { RateLimitHit } from '../models/RateLimitHit.js';
import { HttpError } from './errorHandler.js';

export function rateLimit({ max, windowMs, keyFn }) {
  return async function rateLimitMiddleware(req, _res, next) {
    const key = keyFn(req);
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;

    const hit = await RateLimitHit.findOneAndUpdate(
      { key, windowStart },
      { $inc: { count: 1 } },
      { upsert: true, new: true },
    );

    if (hit.count > max) {
      throw new HttpError(429, 'Too many requests');
    }

    next();
  };
}

export function clientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket.remoteAddress || 'unknown';
}
