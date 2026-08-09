import Redis from 'ioredis';
import winston from 'winston';
import { env } from './env';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

let redisClient: Redis | null = null;

export const connectRedis = (): Redis => {
  if (redisClient) return redisClient;

  logger.info(`Connecting to Redis at ${env.REDIS_URL}`);
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Failed to connect to Redis. Continuing without Redis caching layer.');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    }
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected successfully');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  return redisClient;
};

export const getRedisClient = (): Redis | null => {
  return redisClient;
};
