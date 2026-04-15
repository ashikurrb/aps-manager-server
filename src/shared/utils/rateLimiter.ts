import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../lib/redis.js";

//global limiter for all requests to prevent abuse
export const globalLimiter = rateLimit({
  skip: () => process.env.NODE_ENV !== "production",
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.call(args[0]!, ...args.slice(1)) as any,
  }),
});

//auth limiter to prevent brute-force
export const authLimiter = rateLimit({
  skip: () => process.env.NODE_ENV !== "production",
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 mins.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.call(args[0]!, ...args.slice(1)) as any,
  }),
});

//rate limiter for OTP requests to prevent abuse
export const otpLimiter = rateLimit({
  skip: () => process.env.NODE_ENV !== "production",
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait before trying again.",
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.call(args[0]!, ...args.slice(1)) as any,
  }),
});
