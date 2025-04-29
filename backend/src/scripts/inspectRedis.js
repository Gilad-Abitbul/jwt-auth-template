const redisClient = require('../utils/redisClient.js');

(async () => {
  console.log('Inspecting Redis...\n');

  try {
    const keys = await redisClient.keys('*');

    if (keys.length === 0) {
      console.log('Redis is empty!');
    } else {
      for (const key of keys) {
        const value = await redisClient.get(key);
        const ttl = await redisClient.ttl(key);

        console.log(`Key: ${key}`);
        console.log(`Value: ${value}`);
        console.log(`TTL: ${ttl === -1 ? 'No expiration' : ttl + ' seconds'}`);
        console.log('----------------------------');
      }
    }
  } catch (err) {
    console.error('Error inspecting Redis:', err);
  } finally {
    await redisClient.quit();
    console.log('\nRedis connection closed!');
  }
})();