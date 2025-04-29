const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisClient = require('../src/utils/redisClient');
const logger = require('../src/utils/logger');
const blockedIps = new Map();

const loadBlacklistFromRedis = async () => {
  console.log("inside redis->blacklist map");
  
  const keys = await redisClient.keys('blacklist:*');

  for (const key of keys) {
    const ip = key.split(':').slice(1).join(':');
    const ttl = await redisClient.ttl(key); // שניות
    if (ttl > 0) {
      blockedIps.set(ip, Date.now() + ttl * 1000);
    }
  }

  console.log(`Loaded ${blockedIps.size} blacklisted IPs from Redis.`);
};

loadBlacklistFromRedis();
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'globalRateLimit',
  points: 10,
  duration: 1,
}); 

const BLOCK_TIME_SECONDS = 3 * 60 * 60;

const globalRateLimiter = async (req, res, next) => {
  const ip = req.ip;

  const blockedUntil = blockedIps.get(ip);
  const now = Date.now();

  if (blockedUntil && blockedUntil > now) {
    return res.status(429).json({
      message: 'Your IP is temporarily blocked. Please try again later.',
    });
  }

  try {
    await rateLimiter.consume(ip);
    console.log(`[RATE OK] IP ${ip}`);
    next();
  } catch (err) {
    console.warn(`[RATE BLOCKED] IP ${ip}`);
    const blockUntil = now + BLOCK_TIME_SECONDS * 1000;
    blockedIps.set(ip, blockUntil);

    await redisClient.setex(`blacklist:${ip}`, BLOCK_TIME_SECONDS, '1');
    logger.warn(`Blocked IP: ${ip} until ${new Date(blockUntil).toISOString()}`);  
    return res.status(429).json({
      message: 'Too many requests. You have been temporarily blocked.',
    });
  }
};

setInterval(() => {
  console.log('UPDATE IP BLACK-LIST');
  
  const now = Date.now();
  for (const [ip, expireTime] of blockedIps.entries()) {
    if (now > expireTime) {
      blockedIps.delete(ip);
    }
  }
}, 5 * 60 * 1000); 

module.exports = globalRateLimiter;