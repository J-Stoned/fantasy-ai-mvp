import { Redis } from 'ioredis';

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  }
});

// Create pub/sub clients
const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

// Cache helpers
export const cache = {
  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    const value = await redisClient.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  },

  // Set cached value with expiration
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttlSeconds) {
      await redisClient.setex(key, ttlSeconds, stringValue);
    } else {
      await redisClient.set(key, stringValue);
    }
  },

  // Delete cached value
  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },

  // Clear all cache with pattern
  async clear(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    return await redisClient.incr(key);
  },

  // Add to sorted set
  async zadd(key: string, score: number, member: string): Promise<void> {
    await redisClient.zadd(key, score, member);
  },

  // Get top from sorted set
  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return await redisClient.zrevrange(key, start, stop);
  },

  // Get with scores from sorted set
  async zrevrangeWithScores(key: string, start: number, stop: number): Promise<Array<{ member: string; score: number }>> {
    const result = await redisClient.zrevrange(key, start, stop, 'WITHSCORES');
    const items: Array<{ member: string; score: number }> = [];
    
    for (let i = 0; i < result.length; i += 2) {
      items.push({
        member: result[i],
        score: parseFloat(result[i + 1])
      });
    }
    
    return items;
  }
};

// Pub/Sub helpers
export const pubsub = {
  // Publish message
  async publish(channel: string, message: any): Promise<void> {
    const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);
    await pubClient.publish(channel, stringMessage);
  },

  // Subscribe to channel
  subscribe(channel: string, callback: (message: any) => void): void {
    subClient.subscribe(channel);
    subClient.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch {
          callback(message);
        }
      }
    });
  },

  // Unsubscribe from channel
  unsubscribe(channel: string): void {
    subClient.unsubscribe(channel);
  }
};

// Rate limiting helper
export async function checkRateLimit(
  key: string, 
  limit: number, 
  windowSeconds: number
): Promise<boolean> {
  const current = await redisClient.incr(key);
  
  if (current === 1) {
    await redisClient.expire(key, windowSeconds);
  }
  
  return current <= limit;
}

// Session management
export const sessions = {
  // Store session
  async set(sessionId: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    await cache.set(`session:${sessionId}`, data, ttlSeconds);
  },

  // Get session
  async get<T>(sessionId: string): Promise<T | null> {
    return await cache.get<T>(`session:${sessionId}`);
  },

  // Delete session
  async del(sessionId: string): Promise<void> {
    await cache.del(`session:${sessionId}`);
  }
};

// Leaderboard helpers
export const leaderboards = {
  // Add score
  async addScore(leaderboardKey: string, userId: string, score: number): Promise<void> {
    await cache.zadd(leaderboardKey, score, userId);
  },

  // Get top players
  async getTop(leaderboardKey: string, count: number = 10): Promise<Array<{ userId: string; score: number }>> {
    const results = await cache.zrevrangeWithScores(leaderboardKey, 0, count - 1);
    return results.map(r => ({ userId: r.member, score: r.score }));
  },

  // Get user rank
  async getUserRank(leaderboardKey: string, userId: string): Promise<number | null> {
    const rank = await redisClient.zrevrank(leaderboardKey, userId);
    return rank !== null ? rank + 1 : null;
  }
};

// Queue helpers for background jobs
export const queues = {
  // Add job to queue
  async add(queueName: string, job: any): Promise<void> {
    await redisClient.lpush(`queue:${queueName}`, JSON.stringify(job));
  },

  // Get job from queue
  async get(queueName: string): Promise<any | null> {
    const job = await redisClient.rpop(`queue:${queueName}`);
    if (!job) return null;
    
    try {
      return JSON.parse(job);
    } catch {
      return job;
    }
  },

  // Get queue length
  async length(queueName: string): Promise<number> {
    return await redisClient.llen(`queue:${queueName}`);
  }
};

export { redisClient, pubClient, subClient };