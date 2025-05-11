import Redis from 'ioredis';
import { env } from '../env';

interface ExtendedRedis extends Redis {
  showAllKeysAndValues: () => Promise<void>;
  deleteAllKeys: () => Promise<void>;
  deleteKey: (key: string) => Promise<void>;
}

const redisClient = new Redis({
  host: env.redisHost || '127.0.0.1',
  port: env.redisPort ? env.redisPort : 6379,
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

export async function printRateLimiterKeys(prefix: string) {
  const keys = await redisClient.keys(`${prefix}*`);
  console.log(`Found ${keys.length} keys for prefix "${prefix}":`);
  for (const key of keys) {
    const data = await redisClient.get(key);
    console.log(`${key} => ${data}`);
  }
}

export default redisClient as ExtendedRedis;