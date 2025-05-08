import { RateLimiterRedis } from 'rate-limiter-flexible';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import HttpError from '../../../utils/HttpError';
import redisClient from '../../../utils/redisClient';

const hash = (input: string): string =>
  crypto.createHash('sha256').update(input).digest('hex');

const verifyShortTermLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:verify-otp:email:short-term',
  points: 1,
  duration: 5,
});

const verifyEmailHourlyLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:verify-otp:email:hourly',
  points: 5,
  duration: 60 * 60,
});

const verifyIpHourlyLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth:verify-otp:ip:hourly',
  points: 10,
  duration: 60 * 60,
});

const verifyOtpLimiter = async (
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
      verifyEmailHourlyLimiter.get(emailKey),
      verifyIpHourlyLimiter.get(ipKey),
    ]);

    if (emailRes?.remainingPoints === 0 || ipRes?.remainingPoints === 0) {
      const retrySecs = Math.max(emailRes?.msBeforeNext || 0, ipRes?.msBeforeNext || 0) / 1000;
      const retryAfterSeconds = Math.ceil(retrySecs);

      return next(
        new HttpError(
          `Too many OTP verification attempts. Please try again in ${retryAfterSeconds} seconds.`,
          429,
          undefined,
          { retryAfterSeconds }
        )
      );
    }

    await verifyShortTermLimiter.consume(emailKey);
    await Promise.all([
      verifyEmailHourlyLimiter.consume(emailKey),
      verifyIpHourlyLimiter.consume(ipKey),
    ]);

    next();
  } catch (err: any) {
    if (err && typeof err === 'object' && 'msBeforeNext' in err) {
      const retryAfterSeconds = Math.ceil(err.msBeforeNext / 1000);
      return next(
        new HttpError(
          `Too many OTP verification attempts. Try again in ${retryAfterSeconds} seconds.`,
          429,
          undefined,
          { retryAfterSeconds }
        )
      );
    }

    return next(new HttpError('Redis Server Error!', 500));
  }
};

export default verifyOtpLimiter;