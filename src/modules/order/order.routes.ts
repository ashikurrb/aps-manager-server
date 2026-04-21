import express from "express";
import {
  isActive,
  isLoggedIn,
  isEmailVerified,
  isPhoneVerified,
} from "../../shared/middlewares/auth.middleware.js";
import { createOrder, getAllOrders, updateOrder } from "./order.controller.js";

//declare router
const router = express.Router();

//Create
router.post("/", isLoggedIn, isPhoneVerified, createOrder);

//Get All
router.get("/", isLoggedIn, isActive, isEmailVerified, isPhoneVerified, getAllOrders);

//Get Single
router.get("/:id", isLoggedIn, isActive, isEmailVerified, isPhoneVerified);

//Update
router.patch("/:id", isLoggedIn, isActive, isEmailVerified, isPhoneVerified, updateOrder);

//Delete
router.delete("/:id", isLoggedIn, isActive, isEmailVerified, isPhoneVerified);



export default router;