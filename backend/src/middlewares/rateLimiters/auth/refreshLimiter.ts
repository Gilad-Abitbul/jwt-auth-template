import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import HttpError from '../../../utils/HttpError';
import redisClient from '../../../utils/redisClient';

const shortTermLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:refresh:ip:short-term',
  points: 1,
  duration: 5,
});

const dailyLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:refresh:ip:daily',
  points: 50,
  duration: 60 * 60 * 24,
});

const refreshLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ipKey = req.ip ?? 'unknown';

  try {
    const dailyRes = await dailyLimiter.get(ipKey);
    if (dailyRes?.remainingPoints === 0) {
      const retrySecs = (dailyRes?.msBeforeNext || 0) / 1000;
      return next(
        new HttpError(
          `Too many refresh requests. Try again in ${Math.ceil(retrySecs)} seconds.`,
          429,
          undefined,
          { retryAfterSeconds: Math.ceil(retrySecs) }
        )
      );
    }

    await shortTermLimiter.consume(ipKey);
    await dailyLimiter.consume(ipKey);

    next();
  } catch (err: any) {
    if (err && typeof err === 'object' && 'msBeforeNext' in err) {
      const retryAfterSeconds = Math.ceil(err.msBeforeNext / 1000);
      return next(
        new HttpError(
          `Too many refresh requests. Try again later in ${retryAfterSeconds} seconds.`,
          429,
          undefined,
          { retryAfterSeconds }
        )
      );
    }

    return next(new HttpError('Redis Server Error!', 500));
  }
};

export default refreshLimiter;