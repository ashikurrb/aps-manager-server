import express from "express";
import { createClient, getAllClients } from "./client.controller.js";
import {
  isActive,
  isLoggedIn,
  isEmailVerified,
  isPhoneVerified,
} from "../../shared/middlewares/auth.middleware.js";

//declare router
const router = express.Router();

//Create
router.post("/", isLoggedIn, isPhoneVerified, createClient);

//Get All
router.get("/", isLoggedIn, isActive, isEmailVerified, isPhoneVerified, getAllClients);

//Get Single
router.get("/:id", isLoggedIn, isActive, isEmailVerified, isPhoneVerified);

//Update
router.patch("/:id", isLoggedIn, isActive, isEmailVerified, isPhoneVerified);

//Delete
router.delete("/:id", isLoggedIn, isActive, isEmailVerified, isPhoneVerified);

export default router;