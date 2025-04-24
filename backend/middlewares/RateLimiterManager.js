const { RateLimiterRedis } = require('rate-limiter-flexible');
const crypto = require('crypto');
const redisClient = require('../utils/redisClient');
const logger = require('../utils/logger');

class RateLimiterManager {
  constructor(config) {
    this.config = config;
    this.limitersCache = new Map();
  }

  getHashedKey(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  resolveKey(keyBy, req) {
    if (keyBy === 'ip') return req.ip;
    const raw = req.body[keyBy] || req.query[keyBy] || req.params[keyBy];
    return this.getHashedKey(raw || 'unknown');
  }

  getLimiterInstance({ keyPrefix, points, duration }) {
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
    return this.limitersCache.get(cacheKey);
  }

  async applyLimiters(limiters, req, res, next) {
    try {
      const promises = limiters.map(({ limiter, key }) => limiter.consume(key));
      await Promise.all(promises);
      next();
    } catch (err) {
      const retrySecs = Math.round(err.msBeforeNext / 1000) || 1;
      logger.warn(`Rate limit triggered: ${err.message || JSON.stringify(err)}`);
      res.set('Retry-After', retrySecs);
      return res.status(429).json({
        message: `Too many requests. Please try again after ${retrySecs} seconds.`,
        retryAfterSeconds: retrySecs,
      });
    }
  }

  middleware(actionKey) {
    if (!this.config[actionKey]) {
      throw new Error(`Rate limiter config for "${actionKey}" not found`);
    }

    const limiterConfigs = this.config[actionKey];

    return (req, res, next) => {
      const limiters = limiterConfigs.map((cfg) => ({
        limiter: this.getLimiterInstance(cfg),
        key: this.resolveKey(cfg.keyBy, req),
      }));

      this.applyLimiters(limiters, req, res, next);
    };
  }
}

module.exports = RateLimiterManager;