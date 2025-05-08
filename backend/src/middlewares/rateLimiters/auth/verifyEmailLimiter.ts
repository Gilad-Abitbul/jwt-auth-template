import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import HttpError from '../../../utils/HttpError';
import redisClient from '../../../utils/redisClient';

const shortTermLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:verify-email:ip:short-term',
  points: 1,
  duration: 10,
});

const hourlyLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:verify-email:ip:hourly',
  points: 10,
  duration: 60 * 60,
});

const verifyEmailLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ipKey = req.ip ?? 'unknown';

  try {
    const [shortTermRes, hourlyRes] = await Promise.all([
      shortTermLimiter.get(ipKey),
      hourlyLimiter.get(ipKey),
    ]);

    if (shortTermRes?.remainingPoints === 0 || hourlyRes?.remainingPoints === 0) {
      const retrySecs = Math.max(shortTermRes?.msBeforeNext || 0, hourlyRes?.msBeforeNext || 0) / 1000;
      const retryAfterSeconds = Math.ceil(retrySecs);

      return next(
        new HttpError(
          `Too many verification attempts. Please try again in ${retryAfterSeconds} seconds.`,
          429,
          undefined,
          { retryAfterSeconds }
        )
      );
    }

    await Promise.all([
      shortTermLimiter.consume(ipKey),
      hourlyLimiter.consume(ipKey),
    ]);

    next();
  } catch (err: any) {
    if (err && typeof err === 'object' && 'msBeforeNext' in err) {
      const retryAfterSeconds = Math.ceil(err.msBeforeNext / 1000);
      return next(
        new HttpError(
          `Too many verification attempts. Try again later in ${retryAfterSeconds} seconds.`,
          429,
          undefined,
          { retryAfterSeconds }
        )
      );
    }

    return next(new HttpError('Redis Server Error!', 500));
  }
};

export default verifyEmailLimiter;