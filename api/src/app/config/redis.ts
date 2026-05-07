import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('connect', () => {
  console.log('[redis] connecting...');
});

redisClient.on('ready', () => {
  console.log('[redis] connected');
});

redisClient.on('error', (error) => {
  console.error('[redis] error:', error);
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};