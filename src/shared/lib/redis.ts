import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS URL is missing");
}

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  connectTimeout: 10000,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 5000);
    console.warn(
      `[Redis] Retrying connection in ${delay}ms... Attempt: ${times}`,
    );
    return delay;
  },
});

redis.on("ready", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("connect", () => {
  console.log("🌐 Redis TCP connection established");
});

redis.on("error", (error) => {
  console.error("❌ Redis connection error:", error.message);
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

export default redis;