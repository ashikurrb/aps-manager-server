import redis from "../../shared/lib/redis.js";
import { generateOTP, hashOTP } from "../../shared/utils/hash.utils.js";

export type VerificationType = "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET";

export async function handleOTP(userId: string, type: VerificationType) {
  const plainOtp = generateOTP();
  const hashedOtp = hashOTP(plainOtp);
  const redisKey = `verification:${type}:${userId}`;
  await redis.set(redisKey, hashedOtp, "EX", 300);
  return plainOtp; 
}