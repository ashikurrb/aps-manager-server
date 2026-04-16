import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../shared/lib/prismaClient.js";
import { ClientIdParamSchema, ClientsQuerySchema, CreateClientSchema } from "./client.validation.js";

export const createClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = CreateClientSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: validationResult.error.issues[0]?.message,
      });
    }

    const { name, email, phone, address } = validationResult.data;

    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized Access" });
      return;
    }
    const existingClient = await prisma.client.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        message: "Client with same email or phone already exists",
      });
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address: address ?? null,
        createdById: req.user.id,
        updatedById: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: newClient,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------*/

export const getAllClients = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = ClientsQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [clients, totalClients] = await Promise.all([
      prisma.client.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.count(),
    ]);

    const totalPages = Math.ceil(totalClients / limit);

    res.status(200).json({
      success: true,
      message: "Clients retrieved successfully",
      meta: {
        totalClients,
        totalPages,
        currentPage: page,
        limit,
      },
      data: clients,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------*/

export const getClientProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = ClientIdParamSchema.parse(req.params);

    const client = await prisma.client.findUnique({
      where: { id },
      include:{
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
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client profile retrieved successfully",
      data: client,
    });
  } catch (error) {
    next(error);
  }
};
