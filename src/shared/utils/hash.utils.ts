import bcrypt from 'bcrypt';
import crypto from "node:crypto";

//hashing password
export const hashPassword = async (password: string): Promise<string> => {
    try {
        const saltRounds = 10;
        const hashedPass = await bcrypt.hash(password, saltRounds);
        return hashedPass;
    } catch (error) {
        console.error("Error hashing password:", error);
        throw new Error("Password hashing failed");
    }
};

//compare hash password with value
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.error("Error comparing passwords:", error);
        return false;
    }
};

//hash OTP using Crypto
//generate
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

//hash
export const hashOTP = (otp: string): string => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

//compare
export const compareOTP = (plainOtp: string, hashedOtp: string): boolean => {
  const hashedInput = hashOTP(plainOtp);
  return crypto.timingSafeEqual(
    Buffer.from(hashedInput),
    Buffer.from(hashedOtp)
  );
};