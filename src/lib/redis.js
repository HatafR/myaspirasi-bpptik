import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redisInstance;
try {
  redisInstance = new Redis(redisUrl, {
    maxRetriesPerRequest: 1, // Fail fast if redis is not available
    retryStrategy(times) {
      // Limit retries
      if (times > 3) return null;
      return Math.min(times * 100, 2000);
    }
  });

  redisInstance.on("error", (err) => {
    console.warn("[REDIS WARNING] Redis connection error:", err.message);
  });
} catch (e) {
  console.warn("[REDIS WARNING] Failed to initialize Redis client:", e.message);
  // Fallback dummy object to prevent runtime crash if it can't even initialize
  redisInstance = {
    get: async () => null,
    set: async () => "OK",
    incr: async () => 1,
    expire: async () => true,
    del: async () => 1,
    on: () => {}
  };
}

export const redis = redisInstance;