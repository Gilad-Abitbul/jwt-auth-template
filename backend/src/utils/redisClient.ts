/**
 * Redis Client Utility
 *
 * This module provides a custom Redis client implementation using the `ioredis` package, extended with additional methods
 * for managing Redis keys. It includes the ability to show all keys and values, delete all keys, and delete specific keys.
 * The client is configured to connect to a Redis server, handle connection events, and gracefully shut down on process exit.
 *
 * @module redisClient
 * @see {@link https://www.npmjs.com/package/ioredis} for `ioredis` documentation.
 */
import Redis from 'ioredis';

/**
 * Extended Redis Client interface that adds custom methods to the standard Redis client.
 * 
 * @interface ExtendedRedis
 * @extends Redis
 * @property {Function} showAllKeysAndValues - Fetches and logs all Redis keys with their values and TTLs.
 * @property {Function} deleteAllKeys - Deletes all Redis keys stored in the database.
 * @property {Function} deleteKey - Deletes a specific Redis key by name.
 */
interface ExtendedRedis extends Redis {
  showAllKeysAndValues: () => Promise<void>;
  deleteAllKeys: () => Promise<void>;
  deleteKey: (key: string) => Promise<void>;
}

/**
 * Redis client instance used for connecting to a Redis server.
 * The client is configured with host and port from environment variables or defaults.
 *
 * @constant
 * @type {Redis}
 */
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
});

/**
 * Custom method added to the Redis client that fetches and logs all keys stored in Redis,
 * along with their values and TTL (Time To Live). If no keys are found, a message is logged.
 *
 * @function showAllKeysAndValues
 * @async
 * @throws {Error} Will log errors if any occur during the Redis operations.
 */
(redisClient as ExtendedRedis).showAllKeysAndValues = async function () {
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

/**
 * Custom method added to the Redis client that deletes all keys stored in Redis.
 * Logs the number of keys deleted. If no keys are found, a message is logged.
 *
 * @function deleteAllKeys
 * @async
 * @throws {Error} Will log errors if any occur during the Redis operations.
 */
(redisClient as ExtendedRedis).deleteAllKeys = async function () {
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

/**
 * Custom method added to the Redis client that deletes a specific key from Redis.
 * If the key exists, it is deleted; otherwise, a message is logged indicating that the key does not exist.
 *
 * @function deleteKey
 * @async
 * @param {string} key - The name of the Redis key to delete.
 * @throws {Error} Will log errors if any occur during the Redis operations.
 */
(redisClient as ExtendedRedis).deleteKey = async function (key: string) {
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

/**
 * Event listener for the Redis client that logs a message when a successful connection is made.
 *
 * @event Redis#connect
 */
redisClient.on('connect', () => {
  console.log('Redis client connected!');
});

/**
 * Event listener for the Redis client that logs an error message if a connection error occurs.
 *
 * @event Redis#error
 * @param {Error} err - The error encountered during the connection attempt.
 */
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

/**
 * Handles the 'SIGINT' signal (typically when the process is terminated) by gracefully closing the Redis connection
 * and ensuring the process exits properly.
 *
 * @function process.on('SIGINT')
 * @async
 */
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await redisClient.quit();
  process.exit(0);
});

export default redisClient as ExtendedRedis;