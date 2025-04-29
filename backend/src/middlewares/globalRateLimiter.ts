/**
 * Global Rate Limiter Middleware
 * 
 * This module implements a global rate limiter to protect the application
 * from excessive requests (e.g., brute-force attacks or abuse).
 * 
 * It uses the `rate-limiter-flexible` package in combination with Redis as a backend store,
 * and maintains an in-memory cache of temporarily blocked IPs for fast lookup.
 * 
 * Blocked IPs are stored both in Redis (with TTL) and in-memory, and they are periodically
 * cleaned up to prevent memory bloat.
 */

import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import redisClient from '../utils/redisClient';
import logger from '../utils/logger';
import HttpError from '../utils/HttpError';

/**
 * A map of blocked IP addresses and their unblock timestamps (in milliseconds).
 * This serves as a fast in-memory cache for blocked IPs loaded from Redis and tracked in runtime.
 */
const blockedIps: Map<string, number> = new Map();

/**
 * Loads previously blacklisted IPs from Redis into the in-memory `blockedIps` map.
 * This ensures that temporary bans persist across restarts or redeployments.
 */
const loadBlacklistFromRedis = async (): Promise<void> => {
  console.log("inside redis->blacklist map");

  const keys: string[] = await redisClient.keys('blacklist:*');

  for (const key of keys) {
    const ip = key.split(':').slice(1).join(':');
    const ttl = await redisClient.ttl(key);
    if (ttl > 0) {
      blockedIps.set(ip, Date.now() + ttl * 1000);
    }
  }

  console.log(`Loaded ${blockedIps.size} blacklisted IPs from Redis.`);
};

// Load blacklisted IPs on startup
loadBlacklistFromRedis();


/**
 * Global rate limiter configuration using Redis as the store.
 * Allows up to 10 requests per second per IP address.
 */
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'globalRateLimit',
  points: 10,
  duration: 1,
});

/** Duration (in seconds) to block an IP after it exceeds the rate limit */
const BLOCK_TIME_SECONDS = 3 * 60 * 60; // 3 hours

/**
 * Express middleware to enforce global rate limiting.
 * If an IP is rate-limited, it will be blocked for a predefined duration.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const globalRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ip: string = req.ip ?? 'unknown';

  const blockedUntil = blockedIps.get(ip);
  const now = Date.now();

  if (blockedUntil && blockedUntil > now) {
    const error = new HttpError('Your IP is temporarily blocked. Please try again later.', 429);
    return next(error);
  }

  try {
    await rateLimiter.consume(ip);
    next();
  } catch (err) {
    const blockUntil = now + BLOCK_TIME_SECONDS * 1000;
    blockedIps.set(ip, blockUntil);

    await redisClient.setex(`blacklist:${ip}`, BLOCK_TIME_SECONDS, '1');
    logger.warn(`Blocked IP: ${ip} until ${new Date(blockUntil).toISOString()}`);
    const error = new HttpError('Too many requests. You have been temporarily blocked.', 429);
    next(error);
  }
};

/**
 * Periodically cleans expired IPs from the `blockedIps` in-memory map.
 * This prevents memory bloat from long-term accumulation of expired entries.
 */
setInterval(() => {
  console.log('UPDATE IP BLACK-LIST');

  const now = Date.now();
  for (const [ip, expireTime] of blockedIps.entries()) {
    if (now > expireTime) {
      blockedIps.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export default globalRateLimiter;