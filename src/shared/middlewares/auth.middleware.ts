import { type NextFunction, type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import prisma from "../lib/prismaClient.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
      };
    }
  }
}

//check if logged in
export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token = req.cookies.accessToken;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "User not logged in",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!,
    ) as JwtPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      isEmailVerified: decoded.isEmailVerified || false,
      isPhoneVerified: decoded.isPhoneVerified || false,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid",
    });
  }
};

//check if account is active or blocked or inactive
export const isActive = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return res.status(403).json({
      success: false,
      message: "Your account is currently inactive or blocked.",
    });
  }

  next();
};

//check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }
  next();
};

//check if users phone number is verified
export const isPhoneVerified = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { isPhoneVerified: true },
  });

  if (!user || !user.isPhoneVerified) {
    return res.status(403).json({
      success: false,
      message: "Verify your phone first",
    });
  }

  next();
};

//check if users email is verified
export const isEmailVerified = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { isEmailVerified: true },
  });

  if (!user || !user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Verify your email first",
    });
  }

  next();
};