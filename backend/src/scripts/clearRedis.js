const redisClient = require('../utils/redisClient.js');

(async () => {
  try {
    const keys = await redisClient.keys('*');
    if (keys.length === 0) {
      console.log('No keys to delete. Redis is already empty.');
    } else {
      await redisClient.del(...keys);
      console.log(`Deleted ${keys.length} key(s) from Redis.`);
    }
  } catch (err) {
    console.error('Error clearing Redis:', err);
  } finally {
    await redisClient.quit();
    process.exit(0);
  }
})();