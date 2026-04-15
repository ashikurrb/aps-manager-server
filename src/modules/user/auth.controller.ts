import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../shared/lib/prismaClient.js";
import logger from "../../shared/lib/logger.js";
import {
  comparePassword,
  hashOTP,
  hashPassword,
} from "../../shared/utils/hash.utils.js";
import { createUserSchema, loginUserSchema } from "./auth.validation.js";
import { handleOTP } from "./auth.service.js";
import { sendEmail } from "../../shared/helpers/email.helper.js";
import { sendSingleSMS } from "../../shared/helpers/sms.helper.js";
import redis from "../../shared/lib/redis.js";
import { otpSMS } from "../../shared/templates/smsTemplates.js";

//user data without password
const UserValues = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  address: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  role: true,
  status: true,
  createdAt: true,
  createdById: true,
};

/*--------------------------------------------------------------------------------------------------*/

//Create New User / Register
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = createUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: validationResult.error.issues[0]?.message,
      });
    }

    const { fullName, email, phone, password, address } = validationResult.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    const hashedPassword = await hashPassword(password);
    let user;

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(409).json({
          success: false,
          message: "User already exists",
        });
      }

      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { fullName, address: address ?? null, password: hashedPassword },
      });
    } else {
      user = await prisma.user.create({
        data: {
          fullName,
          email,
          phone,
          address: address ?? null,
          password: hashedPassword,
          isEmailVerified: false,
          isPhoneVerified: false,
          ...(req.user?.id && { createdBy: { connect: { id: req.user.id } } }),
        },
      });
    }

    // Generate OTP
    const otp = await handleOTP(user.id, "EMAIL_VERIFICATION");

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Your Verification Code",
      templateName: "emailOTP",
      templateData: {
        name: user.fullName,
        otp: otp,
      },
    });

    //Send sms
    const smsOtp = await handleOTP(user.id, "PHONE_VERIFICATION");
    const message = otpSMS(user.fullName, smsOtp); //using own created template to maintain consistency
    const smsResult = await sendSingleSMS(user.phone, message);

    if (!smsResult.success) {
      console.error("SMS GATEWAY ERROR:", smsResult.error);
      return res.status(500).json({
        success: false,
        message: "User created, but failed to send SMS OTP.",
        smsError: smsResult.error,
      });
    }

    res.status(201).json({
      success: true,
      message: "Please verify your email to activate your account",
    });
  } catch (error) {
    next(error);
  }
};

/*--------------------------------------------------------------------------------------------------*/

//verify otp
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, type, otp } = req.body;

    if (!email || !type || !otp) {
      return res.status(400).json({
        success: false,
        message: "email, type, and otp are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const redisKey = `verification:${type}:${user.id}`;
    const storedHashedOtp = await redis.get(redisKey);

    if (!storedHashedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or invalid",
      });
    }
    const isMatch = hashOTP(otp) === storedHashedOtp;

    if (isMatch) {
      const updateData: any = {};

      if (type === "EMAIL_VERIFICATION") {
        updateData.isEmailVerified = true;
        updateData.emailVerifiedAt = new Date();
      } else if (type === "PHONE_VERIFICATION") {
        updateData.isPhoneVerified = true;
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid verification type" });
      }

      const verifiedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: UserValues,
      });

      await redis.del(redisKey);

      if (type === "EMAIL_VERIFICATION") {
        await sendEmail({
          to: verifiedUser.email,
          subject: "Welcome to Aesthetic Pixel Studio!",
          templateName: "welcome",
          templateData: { name: verifiedUser.fullName },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Verification successful",
        user: verifiedUser,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    next(error);
  }
};

/*--------------------------------------------------------------------------------------------------*/

//User Login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const loginValidationResult = loginUserSchema.safeParse(req.body);

    if (!loginValidationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: loginValidationResult.error.issues[0]?.message,
      });
    }

    const { identifier, password } = loginValidationResult.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
      });
    }

    if (!user.isEmailVerified || !user.isPhoneVerified) {
      const otp = await handleOTP(user.id, "EMAIL_VERIFICATION");
      await sendEmail({
        to: user.email,
        subject: "Verify your account",
        templateName: "emailOTP",
        templateData: { name: user.fullName, otp },
      });

      // //Send sms
      // const smsOtp = await handleOTP(user.id, "PHONE_VERIFICATION");
      // const smsResult = await sendSingleSMS(
      //   user.phone,
      //   `Your verification code is: ${smsOtp}`,
      // );

      // if (!smsResult.success) {
      //   console.error("SMS GATEWAY ERROR:", smsResult.error);
      //   return res.status(500).json({
      //     success: false,
      //     message: "User created, but failed to send SMS OTP.",
      //     smsError: smsResult.error,
      //   });
      // }

      return res.status(403).json({
        success: false,
        status: "UNVERIFIED",
        message: "OTP sent to your email",
        email: user.email,
        phone: user.phone,
      });
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" },
    );

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // sameSite: "strict" as const,
      sameSite: "none" as const,
    };

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.fullName}`,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

//get self info
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: UserValues,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    logger.error("Error fetching user info:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//Logout User
export const logout = async (req: Request, res: Response) => {
  try {
    const rToken = req.cookies.refreshToken;

    if (rToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: rToken },
      });
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
