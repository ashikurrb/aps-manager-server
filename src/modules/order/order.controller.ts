import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../shared/lib/prismaClient.js";
import { CreateOrderSchema, OrderQuerySchema, UpdateOrderSchema } from "./order.validation.js";

const generateOrderId = () => {
  const date = new Date();
  const yearMonth = `${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${yearMonth}-${randomStr}`;
};

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validation = CreateOrderSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res
        .status(400)
        .json({ success: false, errors: validation.error.format() });
    }

    const { 
      clientId, 
      orderDate, 
      deadline, 
      priority, 
      status,
      note, 
      paymentStatus, 
      paidAmount, 
      items 
    } = validation.data;
    
    const userId = (req as any).user?.id;
    
    const calculatedTotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);
    
    const secureOrderItems = items.map((item) => {
      return {
        productName: item.productName,
        angle: item.angle, 
        quantity: item.quantity,
        rate: item.rate,
        total: item.quantity * item.rate,
      };
    });

    let finalPaymentStatus = paymentStatus;
    let dueAmount = calculatedTotal - paidAmount;

    if (dueAmount < 0) dueAmount = 0;

    if (paidAmount >= calculatedTotal && calculatedTotal > 0) {
      finalPaymentStatus = "COMPLETELY_PAID";
      dueAmount = 0;
    } else if (paidAmount > 0 && paidAmount < calculatedTotal) {
      finalPaymentStatus = "PARTIALLY_PAID";
    } else if (paidAmount === 0) {
      finalPaymentStatus = "NOT_PAID";
    }

    const newOrder = await prisma.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          orderId: generateOrderId(), 
          clientId,
          priority,
          status,
          orderDate: new Date(orderDate),
          deadline: new Date(deadline),
          note: note ?? null,
          totalPrice: calculatedTotal,
          paymentStatus: finalPaymentStatus,
          paidAmount: paidAmount,
          dueAmount: dueAmount,
          createdById: userId,
          updatedById: userId,
          orderItems: {
            create: secureOrderItems, 
          },
        },
        include: {
          orderItems: true,
          client: { select: { name: true } },
        },
      });
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

/*-----------------------------------------------------------------------------------------------------------*/

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit, search } = OrderQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const orderSearch = search ? search.replace(/^["']|["']$/g, "") : undefined;

    const whereClause = orderSearch
      ? {
          OR: [
            { orderId: { contains: orderSearch, mode: "insensitive" as const } },
            { client: { name: { contains: orderSearch, mode: "insensitive" as const } } },
            { 
              orderItems: { 
                some: { productName: { contains: orderSearch, mode: "insensitive" as const } } 
              } 
            },
          ],
        }
      : {};

    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderId: true,
          status: true,
          priority: true,
          paymentStatus: true,
          totalPrice: true,
          paidAmount: true,
          dueAmount: true,
          orderDate: true,
          deadline: true,
          note: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          orderItems: {
            select: {
              id: true,
              productName: true,
              angle: true,
              quantity: true,
              rate: true,
              total: true,
            },
          },
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.order.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      meta: {
        totalOrders,
        totalPages,
        currentPage: page,
        limit,
        search: search || null,
      },
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/*-----------------------------------------------------------------------------------------------------------*/

export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params; 
    const validation = UpdateOrderSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    const userId = (req as any).user?.id;
    const updateData = validation.data;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true }
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let finalTotalPrice = existingOrder.totalPrice;
    let newItemsPayload: any[] = [];

    if (updateData.items) {
      finalTotalPrice = updateData.items.reduce((sum, item) => {
        return sum + (item.quantity * item.rate);
      }, 0);

      newItemsPayload = updateData.items.map((item) => ({
        productName: item.productName,
        angle: item.angle,
        quantity: item.quantity,
        rate: item.rate,
        total: item.quantity * item.rate,
      }));
    }

    const finalPaidAmount = updateData.paidAmount ?? existingOrder.paidAmount;
    let dueAmount = finalTotalPrice - finalPaidAmount;
    if (dueAmount < 0) dueAmount = 0;

    let finalPaymentStatus = updateData.paymentStatus ?? existingOrder.paymentStatus;
    
    if (finalPaidAmount >= finalTotalPrice && finalTotalPrice > 0) {
      finalPaymentStatus = "COMPLETELY_PAID";
    } else if (finalPaidAmount > 0 && finalPaidAmount < finalTotalPrice) {
      finalPaymentStatus = "PARTIALLY_PAID";
    } else if (finalPaidAmount === 0) {
      finalPaymentStatus = "NOT_PAID";
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (updateData.items) {
        await tx.orderItems.deleteMany({
          where: { orderId: id },
        });
      }

      return await tx.order.update({
        where: { id },
        data: {
          clientId: updateData.clientId,
          priority: updateData.priority,
          status: updateData.status,
          orderDate: updateData.orderDate ? new Date(updateData.orderDate) : undefined,
          deadline: updateData.deadline ? new Date(updateData.deadline) : undefined,
          note: updateData.note,
          
          totalPrice: finalTotalPrice,
          paidAmount: finalPaidAmount,
          dueAmount: dueAmount,
          paymentStatus: finalPaymentStatus,
          
          updatedById: userId,

          orderItems: updateData.items ? {
            create: newItemsPayload,
          } : undefined,
        },
        include: {
          orderItems: true,
          client: { select: { name: true } },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};