import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../shared/lib/prismaClient.js";
import { DashboardQuerySchema, getStartDate } from "./analytics.validation.js";

export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = DashboardQuerySchema.safeParse(req.query);
    if (!query.success) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid timeframe" });
    }

    const { timeframe } = query.data;

    const startDate = getStartDate(timeframe);
    const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

    const [totalUsers, totalProducts, totalClients] = await Promise.all([
      prisma.user.count({ where: dateFilter }),
      prisma.client.count({ where: dateFilter }),
      prisma.product.count({ where: dateFilter }),
    ]);

    // Send response
    res.status(200).json({
      success: true,
      data: {
        timeframe,
        totalUsers,
        totalClients,
        totalProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};
