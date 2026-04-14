import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    console.warn(`[Redis] Retrying connection... Attempt: ${times}`);
    return Math.min(times * 50, 5000); 
  },
});

redis.on("connect", () => {
  console.log("✅ Redis client connected successfully");
});

redis.on("error", (error) => {
  console.error("❌ Redis connection error:", error.message);
});

export default redis;