import express from "express";
import {
  isActive,
  isLoggedIn,
  isEmailVerified,
  isPhoneVerified,
} from "../../shared/middlewares/auth.middleware.js";
import { createProduct, getAllProducts, getSingleProduct, updateProduct } from "./product.controller.js";

//declare router
const router = express.Router();

//Create
router.post("/", isLoggedIn, isPhoneVerified, createProduct);

//Get All
router.get("/", isLoggedIn, isActive, isEmailVerified, isPhoneVerified, getAllProducts);

//Get Single
router.get("/:id", isLoggedIn, isActive, isEmailVerified, isPhoneVerified, getSingleProduct);

//Update
router.patch("/:id", isLoggedIn, isActive, isEmailVerified, isPhoneVerified, updateProduct);

//Delete
router.delete("/:id", isLoggedIn, isActive, isEmailVerified, isPhoneVerified);



export default router;