import { z } from "zod";
import disposableDomains from "../../shared/data/disposableDomain.json" with { type: "json" };

//disposable email domains
export const disposableSet = new Set(disposableDomains);

//user creation / register schema
export const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),

  email: z
    .string()
    .min(1, "Email is required")
    .pipe(z.email("Invalid email address"))
    .refine(
      (email) => {
        const domain = email.split("@")[1]?.toLowerCase();
        return !disposableSet.has(domain || "");
      },
      {
        message:
          "Please use a permanent email address. Temporary domains are not allowed.",
      },
    ),

  phone: z
    .string()
    .min(1, "Phone number is required")
    .min(11, "Phone number is too short")
    .max(11, "Invalid phone number"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),

  address: z.string().optional(),
  isEmailVerified: z.boolean().optional(),
  isPhoneVerified: z.boolean().optional(),
});

//Login schema
export const loginUserSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or Phone is required")
    .refine(
      (val) => {
        const isEmail = z.string().email().safeParse(val).success;
        const isPhone = /^\d{11}$/.test(val);
        return isEmail || isPhone;
      },
      {
        message: "Enter a valid email address or phone number",
      },
    ),
  password: z.string().min(1, "Password is required"),
});

//OTP verification schema
export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z
    .string()
    .min(11, "Phone number is too short")
    .max(11, "Invalid phone number")
    .optional(),
  type: z.enum(["EMAIL_VERIFICATION", "PHONE_VERIFICATION"], {
    required_error: "Verification type is required",
  }),
  otp: z.string().min(1, "OTP is required"),
});
