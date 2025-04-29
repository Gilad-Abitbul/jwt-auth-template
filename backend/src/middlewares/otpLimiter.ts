/**
 * OTP Request Rate Limiting Middleware
 * 
 * This middleware enforces rate limits on OTP reset requests to prevent abuse.
 * It applies both short-term and long-term rate limits based on the user's email and IP address.
 * 
 * Rate Limits:
 * - 1 request per 30 seconds per email
 * - 5 requests per 24 hours per email
 * - 5 requests per 24 hours per IP address
 * 
 * Uses Redis as a backend store via the `rate-limiter-flexible` library.
 */
import { RateLimiterRedis } from 'rate-limiter-flexible';
import redisClient from '../utils/redisClient';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import HttpError from '../utils/HttpError';

/**
 * Hashes the input string using SHA-256 algorithm.
 * Used to anonymize email addresses when used as Redis keys.
 * 
 * @param input - The input string to hash (e.g., an email address)
 * @returns A SHA-256 hash of the input string in hex format
 */
const hash = (input: string): string =>
  crypto.createHash('sha256').update(input).digest('hex');

/**
 * Short-term limiter: Allows 1 OTP request every 30 seconds per email.
 */
const resetOtp30s = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ResetOtp30s',
  points: 1,
  duration: 30,
});

/**
 * Daily limiter per email: Allows up to 5 OTP requests per email per 24 hours.
 */
const resetOtpPerDayEmail = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ResetOtpPerDayEmail',
  points: 5,
  duration: 60 * 60 * 24,
});

/**
 * Daily limiter per IP: Allows up to 5 OTP requests per IP per 24 hours.
 */
const resetOtpPerDayIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ResetOtpPerDayIP',
  points: 5,
  duration: 60 * 60 * 24,
});

/**
 * Express middleware that enforces OTP request rate limits.
 * 
 * Limits requests based on a combination of hashed email and IP address,
 * with progressive penalties for exceeding limits.
 * 
 * @param req - Express Request object containing the email in the body
 * @param res - Express Response object
 * @param next - Express NextFunction callback
 */
const otpLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.body;
  const emailKey = hash(email);
  const ipKey: string = req.ip ?? 'unknown';

  try {
    const [emailRes, ipRes] = await Promise.all([
      resetOtpPerDayEmail.get(emailKey),
      resetOtpPerDayIP.get(ipKey),
    ]);

    // Check if the request exceeds the daily limit
    if (emailRes?.remainingPoints === 0 || ipRes?.remainingPoints === 0) {
      const retrySecs = Math.max(emailRes?.msBeforeNext || 0, ipRes?.msBeforeNext || 0) / 1000;
      const retryAfterSeconds = Math.ceil(retrySecs);
      const error = new HttpError(
        `This operation has been blocked due to multiple requests. Please try again in ${retryAfterSeconds} seconds.`,
        429,
        undefined,
        { retryAfterSeconds }
      );

      // res.status(429).json({
      //   message: `This operation has been blocked due to multiple requests. Please try again in ${retryAfterSeconds} seconds.`,
      //   retryAfterSeconds,
      // });
      return next(error);
    }

    await resetOtp30s.consume(emailKey);
    await Promise.all([
      resetOtpPerDayEmail.consume(emailKey),
      resetOtpPerDayIP.consume(ipKey),
    ]);

    next();

  } catch (err: any) {
    if (err && typeof err === 'object' && 'msBeforeNext' in err) {
      const retryAfterSeconds: number = Math.ceil(err.msBeforeNext / 1000);
      const error = new HttpError(`This operation has been blocked due to multiple requests. Please try again later: ${retryAfterSeconds} seconds.`, 429, undefined, { retryAfterSeconds });
      next(error);
    } else {
      const error = new HttpError('Redis Server Error!', 500);
      next(error);
    }
  }
};

export default otpLimiter;