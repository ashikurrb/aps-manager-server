import dotenv from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import helmetPkg from "helmet";
const helmet = helmetPkg as any;
import compression from "compression";
import cookieParser from "cookie-parser";
import { prisma } from "./shared/lib/prismaClient.js";
import "./shared/lib/redis.js";
import authRoutes from "./modules/user/auth.routes.js";
import clientRoutes from "./modules/client/client.routes.js";
import productRoutes from "./modules/product/product.routes.js";
import analyticsRoute from "./modules/analytics/analytics.routes.js";
import { globalLimiter } from "./shared/utils/rateLimiter.js";
import logger from "./shared/lib/logger.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";

// dotenv config
dotenv.config();

//initialize express app
const app = express();
app.set("trust proxy", 1);

// cors config
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : false,
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));

//middleware
app.use(helmet());
app.use(compression());
app.use(cookieParser());

//global rate limiter
app.use("/api", globalLimiter);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Server home
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("APS Manager Server is Running...");
});

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use ("/api/v1/products", productRoutes)
app.use ("/api/v1/analytics", analyticsRoutes)




// Global error handles
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;

  logger.error(err.message, {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message,
  });
});

// Define PORT
const PORT = process.env.PORT || 5000;

//Server  & DB Console Log
app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("Database Connected Successfully ✅");
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error("❌ Prisma connection failed:", error);
    process.exit(1);
  }
});
