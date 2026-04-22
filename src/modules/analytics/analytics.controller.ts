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

    const [totalUsers, totalClients, totalOrders, earningsResult] =
      await Promise.all([
        prisma.user.count({ where: dateFilter }),
        prisma.client.count({ where: dateFilter }),
        prisma.order.count({ where: dateFilter }),
        prisma.order.aggregate({
          where: dateFilter,
          _sum: {
            totalPrice: true,
            paidAmount: true,
          },
        }),
      ]);

    res.status(200).json({
      success: true,
      message: `Analytics for ${timeframe} retrieved successfully`,
      data: {
        timeframe,
        totalUsers,
        totalClients,
        totalOrders,
        totalEarnings: earningsResult._sum.totalPrice || 0,
        totalCollected: earningsResult._sum.paidAmount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
