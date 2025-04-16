/**
 * @file rateLimiters.js
 * @desc    Defines rate limiting middleware for sensitive authentication actions
 * @uses    rate-limiter-flexible with Redis to control request frequency
 * 
 * @rateLimiters
 * - requestPasswordResetRateLimit: Limits requests for sending reset password OTPs
 *    - max 1 request per 30 seconds (per email)
 *    - max 3 requests per 24 hours (per email)
 *    - max 5 requests per 24 hours (per IP)
 * 
 * - otpVerifyRateLimit: Limits OTP verification attempts
 *    - max 5 attempts per 5 minutes (per email)
 *    - max 10 attempts per 10 minutes (per IP)
 * 
 * - resetPasswordRateLimit: Limits password reset actions
 *    - max 1 reset per 10 minutes (per IP)
 * 
 * @exports
 * - requestPasswordResetRateLimit: Express middleware
 * - otpVerifyRateLimit: Express middleware
 * - resetPasswordRateLimit: Express middleware
 */
const { RateLimiterRedis } = require('rate-limiter-flexible');

const redisClient = require('../utils/redisClient.js');
const logger = require('../utils/logger.js');

const limiterPer30s = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'email_reset_30s',
  points: 1,
  duration: 30
});

const limiterPerDayPerEmail = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'email_reset_daily',
  points: 3,
  duration: 60 * 60 * 24,
});

const limiterPerDayPerIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'reset_ip_daily',
  points: 5,
  duration: 60 * 60 * 24,
});

/**
 * Generic function to handle rate limiting logic using a given limiter instance.
 * If limit exceeded, responds with 429 and `Retry-After` header.
 * 
 * @param {RateLimiterRedis} limiter - The rate limiter instance
 * @param {string} key - The key to identify the requester (IP or email)
 * @param {Response} response - Express response object
 * @param {Function} next - Next middleware callback
 */
const handleRateLimiter = (limiter, key, response, next) => {
  limiter.consume(key)
    .then(() => next())
    .catch((rlRejected) => {
      const retrySecs = Math.round(rlRejected.msBeforeNext / 1000) || 1;
      response.set('Retry-After', retrySecs);
      logger.warn(`Rate limit hit: key=${key}, retry after=${retrySecs}s`);
      return response.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfterSeconds: retrySecs
      });
    });
};

/**
 * Rate limiting middleware for password reset requests.
 * Applies 3 levels of rate limiting:
 *  - 1 request every 30 seconds per email
 *  - 3 requests per day per email
 *  - 5 requests per day per IP
 */
exports.requestPasswordResetRateLimit = (request, response, next) => {
  const { email } = request.body;
  const ip = request.ip;

  handleRateLimiter(limiterPer30s, email, response, () => {
    handleRateLimiter(limiterPerDayPerEmail, email, response, () => {
      handleRateLimiter(limiterPerDayPerIP, ip, response, next);
    });
  });
};

const otpVerifyLimiterEmail = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'otp_verify_email',
  points: 5,
  duration: 60 * 5,
});

const otpVerifyLimiterIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'otp_verify_ip',
  points: 10,
  duration: 60 * 10,
});

/**
 * Rate limiting middleware for OTP verification.
 * Applies limits:
 *  - 5 attempts per 5 minutes per email
 *  - 10 attempts per 10 minutes per IP
 */
exports.otpVerifyRateLimit = (request, response, next) => {
  const { email } = request.body;
  const ip = request.ip;

  handleRateLimiter(otpVerifyLimiterEmail, email, response, () => {
    handleRateLimiter(otpVerifyLimiterIP, ip, response, next);
  });
};

const limiterResetPasswordPerIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'reset_password_ip',
  points: 1, 
  duration: 60 * 10,
});

/**
 * Rate limiting middleware for password reset execution.
 * Applies limit:
 *  - 1 reset attempt per 10 minutes per IP
 */
exports.resetPasswordRateLimit = (request, response, next) => {
  const ip = request.ip;
  handleRateLimiter(limiterResetPasswordPerIP, ip, response, next);
};