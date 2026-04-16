import express from "express";
import {
  createUser,
  getMe,
  login,
  logout,
  verifyOtp,
} from "./auth.controller.js";
import {
  isActive,
  isLoggedIn,
  isEmailVerified,
  isPhoneVerified,
} from "../../shared/middlewares/auth.middleware.js";
import { authLimiter } from "../../shared/utils/rateLimiter.js";

//declare router
const router = express.Router();

//Create User/Register
router.post("/create-user", authLimiter, createUser);

//Login
router.post("/login", authLimiter, login);

//Logout
router.post("/logout", isLoggedIn, logout);

//Get Self Info
router.get(
  "/me",
  isLoggedIn,
  isActive,
  isEmailVerified,
  isPhoneVerified,
  getMe,
);

//Verify OTP
router.post("/verify-otp", verifyOtp);

export default router;
