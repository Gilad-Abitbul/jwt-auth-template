/**
 * Rate Limiter Middleware for Password Reset Flow
 *
 * This module uses the `rate-limiter-flexible` package with Redis to enforce rate limiting
 * on specific password reset-related actions such as requesting OTP, verifying OTP,
 * and executing the password reset.
 *
 * The configuration allows applying multiple limiters per action, with different keys and durations
 * (e.g., per email or per IP), to prevent abuse while allowing legitimate use.
 */

const { RateLimiterRedis } = require('rate-limiter-flexible');

const redisClient = require('../utils/redisClient.js');
const logger = require('../utils/logger.js');

/**
 * Creates a Redis-backed rate limiter instance.
 *
 * @param {string} keyPrefix - A unique prefix for the rate limiter key.
 * @param {number} points - Number of points a user can consume before being rate-limited.
 * @param {number} duration - Time window in seconds for the rate limit.
 * @returns {RateLimiterRedis} A configured rate limiter instance.
 */
const createRedisLimiter = (keyPrefix, points, duration) =>
  new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix,
    points,
    duration,
  });

/**
 * Rate limiting configuration per action.
 * Each entry includes multiple limiters targeting different keys (e.g., email or IP).
 */
const limiterConfigs = {
  passwordResetOtpRequest: [
    { keyPrefix: 'PasswordResetOtpRequestPer30s', points: 1, duration: 30, key: (req) => req.body.email },
    { keyPrefix: 'PasswordResetOtpRequestPerDayPerEmail', points: 3, duration: 60 * 60 * 24, key: (req) => req.body.email },
    { keyPrefix: 'PasswordResetOtpRequestPerDayPerIP', points: 5, duration: 60 * 60 * 24, key: (req) => req.ip },
  ],
  passwordResetOtpVerify: [
    { keyPrefix: 'PasswordResetOtpVerifyPerEmail', points: 5, duration: 60 * 5, key: (req) => req.body.email },
    { keyPrefix: 'PasswordResetOtpVerifyPerIP', points: 10, duration: 60 * 10, key: (req) => req.ip },
  ],
  passwordResetExecution: [
    { keyPrefix: 'PasswordResetPerIP', points: 1, duration: 60 * 10, key: (req) => req.ip },
  ],
};

/**
 * Generates an array of limiter instances based on the config for a specific action.
 *
 * @param {Array} configArray - Array of limiter configuration objects.
 * @returns {Array} An array of objects, each containing a limiter and its key function.
 */
const generateLimiters = (configArray) =>
  configArray.map(({ keyPrefix, points, duration, key }) => ({
    limiter: createRedisLimiter(keyPrefix, points, duration),
    key,
  }));

// Predefined limiter groups for specific password reset stages
const passwordResetOtpRequestLimits = generateLimiters(limiterConfigs.passwordResetOtpRequest);
const passwordResetOtpVerifyRequestLimits = generateLimiters(limiterConfigs.passwordResetOtpVerify);
const passwordResetRequestLimits = generateLimiters(limiterConfigs.passwordResetExecution);

/**
 * Executes a single limiter check and calls the next middleware if successful.
 *
 * @param {RateLimiterRedis} limiter - The rate limiter to apply.
 * @param {string} key - The unique key for this limiter (e.g., IP or email).
 * @param {object} response - Express response object.
 * @param {function} next - Express next middleware function.
 */
const handleRateLimiter = (limiter, key, response, next) => {
  limiter.consume(key)
    .then(() => next())
    .catch((rlRejected) => {
      const retrySecs = Math.round(rlRejected.msBeforeNext / 1000) || 1;
      response.set('Retry-After', retrySecs);
      logger.warn(`Rate limit hit: key=${key}, retry after=${retrySecs}s`);
      return response.status(429).json({
        message: `Too many requests. Please try again after ${retrySecs} seconds.`,
        retryAfterSeconds: retrySecs
      });
    });
};

/**
 * Recursively applies multiple limiters for a single request.
 * If any limiter is triggered, the request is blocked.
 *
 * @param {Array} limitersArray - Array of { limiter, key } objects.
 * @param {object} request - Express request object.
 * @param {object} response - Express response object.
 * @param {function} next - Express next middleware function.
 * @param {number} index - Current index of the limiter to apply (used for recursion).
 */
const applyRateLimits = (limitersArray, request, response, next, index = 0) => {
  if (index >= limitersArray.length) {
    return next();
  }
  const { limiter, key } = limitersArray[index];
  handleRateLimiter(limiter, key(request), response, () =>
    applyRateLimits(limitersArray, request, response, next, index + 1)
  );
};

/**
 * Middleware for rate-limiting password reset OTP request endpoint.
 */
exports.passwordResetOtpRequestRateLimit = (req, res, next) => {
  applyRateLimits(passwordResetOtpRequestLimits, req, res, next);
};


/**
 * Middleware for rate-limiting password reset OTP verification endpoint.
 */
exports.passwordResetOtpVerifyRequestRateLimit = (req, res, next) => {
  applyRateLimits(passwordResetOtpVerifyRequestLimits, req, res, next);
};

/**
 * Middleware for rate-limiting actual password reset execution endpoint.
 */
exports.passwordResetRequestRateLimit = (req, res, next) => {
  applyRateLimits(passwordResetRequestLimits, req, res, next);
};