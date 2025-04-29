import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import crypto from 'crypto';
import redisClient from '../utils/redisClient';
import logger from '../utils/logger';

interface LimiterConfig {
  keyBy: string;
  points: number;
  duration: number;
  keyPrefix: string;
}

interface RateLimiterConfig {
  [key: string]: LimiterConfig[];
}

class RateLimiterManager {
  private config: RateLimiterConfig;
  private limitersCache: Map<string, RateLimiterRedis>;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.limitersCache = new Map();
  }

  private getHashedKey(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private resolveKey(keyBy: string, req: any): string {
    if (keyBy === 'ip') return req.ip;
    const raw = req.body[keyBy] || req.query[keyBy] || req.params[keyBy];
    return this.getHashedKey(raw || 'unknown');
  }

  private getLimiterInstance({ keyPrefix, points, duration }: LimiterConfig): RateLimiterRedis {
    const cacheKey = `${keyPrefix}_${points}_${duration}`;
    if (!this.limitersCache.has(cacheKey)) {
      this.limitersCache.set(
        cacheKey,
        new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix,
          points,
          duration,
        })
      );
    }
    return this.limitersCache.get(cacheKey)!;
  }

  private async applyLimiters(limiters: { limiter: RateLimiterRedis; key: string }[], req: any, res: any, next: any): Promise<void> {
    try {
      const promises = limiters.map(({ limiter, key }) => limiter.consume(key));
      await Promise.all(promises);
      next();
    } catch (err: any) {
      const retrySecs = Math.round(err.msBeforeNext / 1000) || 1;
      logger.warn(`Rate limit triggered: ${err.message || JSON.stringify(err)}`);
      res.set('Retry-After', retrySecs);
      return res.status(429).json({
        message: `Too many requests. Please try again after ${retrySecs} seconds.`,
        retryAfterSeconds: retrySecs,
      });
    }
  }

  middleware(actionKey: string): (req: any, res: any, next: any) => void {
    if (!this.config[actionKey]) {
      throw new Error(`Rate limiter config for "${actionKey}" not found`);
    }

    const limiterConfigs = this.config[actionKey];

    return (req: any, res: any, next: any): void => {
      const limiters = limiterConfigs.map((cfg) => ({
        limiter: this.getLimiterInstance(cfg),
        key: this.resolveKey(cfg.keyBy, req),
      }));

      this.applyLimiters(limiters, req, res, next);
    };
  }
}

export default RateLimiterManager;