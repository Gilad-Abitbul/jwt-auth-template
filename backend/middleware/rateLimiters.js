const { RateLimiterRedis } = require('rate-limiter-flexible');

const redisClient = require('../utils/redisClient.js');

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


const handleRateLimiter = (limiter, key, response, next) => {
  limiter.consume(key)
    .then(() => next())
    .catch((rlRejected) => {
      const retrySecs = Math.round(rlRejected.msBeforeNext / 1000) || 1;
      response.set('Retry-After', retrySecs);
      return response.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfterSeconds: retrySecs
      });
    });
};

exports.passwordResetRateLimit = (request, response, next) => {
  const { email } = request.body;
  const ip = request.ip;

  handleRateLimiter(limiterPer30s, email, response, () => {
    handleRateLimiter(limiterPerDayPerEmail, email, response, () => {
      handleRateLimiter(limiterPerDayPerIP, ip, response, next);
    });
  });
};