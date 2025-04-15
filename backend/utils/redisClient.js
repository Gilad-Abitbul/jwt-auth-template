const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on('connect', () => {
  console.log('Redis client connected!');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await redisClient.quit();
  process.exit(0);
});

redisClient.showAllKeysAndValues = async function() {
  try {
    const keys = await this.keys('*');
    if (keys.length === 0) {
      console.log('No keys in Redis');
      return;
    }

    for (const key of keys) {
      const value = await this.get(key);
      const ttl = await this.ttl(key);
      console.log(`Key: ${key}`);
      console.log(`Value: ${value}`);
      console.log(`TTL: ${ttl === -1 ? 'No expiration' : ttl + ' seconds'}`);
      console.log('------------------------');
    }
  } catch (err) {
    console.error('Error:', err);
  }
};

redisClient.deleteAllKeys = async function() {
  try {
    const keys = await this.keys('*');
    if (keys.length === 0) {
      console.log('No keys to delete');
      return;
    }

    await this.del(...keys);
    console.log(`${keys.length} keys deleted`);
  } catch (err) {
    console.error('Error deleting keys:', err);
  }
};

redisClient.deleteKey = async function(key) {
  try {
    const exists = await this.exists(key);
    if (exists) {
      await this.del(key);
      console.log(`The key "${key}" has been deleted`);
    } else {
      console.log(`The key "${key}" does not exist`);
    }
  } catch (err) {
    console.error('Error deleting the key:', err);
  }
};

module.exports = redisClient;