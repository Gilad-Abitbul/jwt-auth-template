import { RateLimiterRedis } from 'rate-limiter-flexible';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import HttpError from '../../../utils/HttpError';
import redisClient from '../../../utils/redisClient';

const hash = (input: string): string =>
  crypto.createHash('sha256').update(input).digest('hex');

const signupShortTermLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:signup:email:short-term',
  points: 1,
  duration: 10,
});

const signupDailyEmailLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:signup:email:daily',
  points: 3,
  duration: 60 * 60 * 24,
});

const signupDailyIpLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:signup:ip:daily',
  points: 5,
  duration: 60 * 60 * 24,
});

const signupLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

  const email = typeof req.body?.email === 'string' ? req.body.email : null;

  if (!email) {
    return next(new HttpError('Email is required for rate limiting', 400));
  }

  const emailKey = hash(email);
  const ipKey = req.ip ?? 'unknown';

  try {
    const [emailRes, ipRes] = await Promise.all([
      signupDailyEmailLimiter.get(emailKey),
      signupDailyIpLimiter.get(ipKey),
    ]);

    if (emailRes?.remainingPoints === 0 || ipRes?.remainingPoints === 0) {
      const retrySecs = Math.max(emailRes?.msBeforeNext || 0, ipRes?.msBeforeNext || 0) / 1000;
      const retryAfterSeconds = Math.ceil(retrySecs);

      return next(
        new HttpError(
          `Too many signup attempts. Please try again in ${retryAfterSeconds} seconds.`,
          429,
          undefined,
          { retryAfterSeconds }
        )
      );
    }

    await signupShortTermLimiter.consume(emailKey);
    await Promise.all([
      signupDailyEmailLimiter.consume(emailKey),
      signupDailyIpLimiter.consume(ipKey),
    ]);

    next();
  } catch (err: any) {
    if (err && typeof err === 'object' && 'msBeforeNext' in err) {
      const retryAfterSeconds = Math.ceil(err.msBeforeNext / 1000);
      return next(
        new HttpError(
          `Too many signup attempts. Try again later in ${retryAfterSeconds} seconds.`,
          429,
          undefined,
          { retryAfterSeconds }
        )
      );
    }

    return next(new HttpError('Redis Server Error!', 500));
  }
};

export default signupLimiter;