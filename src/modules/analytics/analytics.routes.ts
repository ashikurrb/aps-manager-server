import express from "express";
import {
  isActive,
  isLoggedIn,
  isEmailVerified,
  isPhoneVerified,
} from "../../shared/middlewares/auth.middleware.js";
import { getDashboardData } from "./analytics.controller.js";

//declare router
const router = express.Router();

//Get whole analytics data
router.get("/", isLoggedIn, isActive, isEmailVerified, isPhoneVerified, getDashboardData);

export default router;