const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisClient = require('../utils/redisClient');
const crypto = require('crypto');

const hash = (input) => crypto.createHash('sha256').update(input).digest('hex');

const resetOtp30s = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ResetOtp30s',
  points: 1,
  duration: 30,
});

const resetOtpPerDayEmail = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ResetOtpPerDayEmail',
  points: 5,
  duration: 60 * 60 * 24,
});

const resetOtpPerDayIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ResetOtpPerDayIP',
  points: 5,
  duration: 60 * 60 * 24,
});

const otpLimiter = async (req, res, next) => {
  const {email} = req.body;
  const emailKey = hash(email);
  const ipKey = req.ip;

  try {
    const [emailRes, ipRes] = await Promise.all([
      resetOtpPerDayEmail.get(emailKey),
      resetOtpPerDayIP.get(ipKey),
    ]);

    if (emailRes?.remainingPoints === 0 || ipRes?.remainingPoints === 0) {
      const retrySecs = Math.max(
        emailRes?.msBeforeNext || 0,
        ipRes?.msBeforeNext || 0
      ) / 1000;
      const retryAfterSeconds = Math.ceil(retrySecs);
      return res.status(429).json({
        message: `This operation has been blocked due to multiple requests. Please try again in ${retryAfterSeconds} seconds.`,
        retryAfterSeconds: retryAfterSeconds
      });
    }

    await resetOtp30s.consume(emailKey);

    await Promise.all([
      resetOtpPerDayEmail.consume(emailKey),
      resetOtpPerDayIP.consume(ipKey),
    ]);

    next();

  } catch (err) {
    if (err && typeof err === 'object' && 'msBeforeNext' in err) {
      return res.status(429).json({
        message: `This operation has been blocked due to multiple requests. Please try again later: ${Math.ceil(err.msBeforeNext / 1000)} seconds.`,
      });
    }

    console.error('Limiter Error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = otpLimiter;