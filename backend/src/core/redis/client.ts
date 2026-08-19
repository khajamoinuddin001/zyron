import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Prevent multiple connections in development (hot-reloading)
const globalForRedis = global as unknown as {
  redisClient: Redis;
};

export const redis =
  globalForRedis.redisClient ||
  new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redisClient = redis;
