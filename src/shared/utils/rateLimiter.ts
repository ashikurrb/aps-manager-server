import type { Request, Response } from "express";
import {
  rateLimit,
  ipKeyGenerator,
  type RateLimitInfo,
} from "express-rate-limit";
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
    prefix: "rl:global:",
  }),
});

/*--------------------------------------------------------------------------------------------------*/

//auth limiter to prevent brute-force
export const authLimiter = rateLimit({
  skip: () => process.env.NODE_ENV !== "production",
  windowMs: 15 * 60 * 1000,
  max: 5,

  //@ashikurrb note: block user based on email or phone. if user is not on db than blocked based in IP. rate limiter works based on the identifier. if same user get blocked with email and he tried with phone, he can login.

  keyGenerator: (req: Request, res: Response) => {
    if (req.body?.identifier) {
      return req.body.identifier.toString().toLowerCase();
    }
    return ipKeyGenerator(req.ip || "unknown");
  },

  message: (req: Request, res: Response) => {
    //define the exact time left
    const rateLimitReq = req as Request & { rateLimit?: RateLimitInfo };
    const resetTime = rateLimitReq.rateLimit?.resetTime;
    if (resetTime) {
      const msLeft = resetTime.getTime() - Date.now();
      const minutes = Math.floor(msLeft / 60000);
      const seconds = Math.floor((msLeft % 60000) / 1000);
      return {
        success: false,
        message: `Too many login attempts. Try again in ${minutes}m ${seconds}s.`,
      };
    }
    return {
      success: false,
      message: `Too many login attempts. Try again later.`,
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.call(args[0]!, ...args.slice(1)) as any,
    prefix: "rl:auth:",
  }),
});

/*--------------------------------------------------------------------------------------------------*/

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
    prefix: "rl:otp:",
  }),
});
