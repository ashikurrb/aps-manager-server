import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../shared/lib/prismaClient.js";
import {
  ClientIdParamSchema,
  ClientsQuerySchema,
  CreateClientSchema,
} from "./client.validation.js";

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
    const { page, limit, search } = ClientsQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const cleanSearch = search ? search.replace(/^["']|["']$/g, "") : undefined;

    const whereClause = cleanSearch
      ? {
          OR: [
            { name: { contains: cleanSearch, mode: "insensitive" as const } },
            { email: { contains: cleanSearch, mode: "insensitive" as const } },
            { phone: { contains: cleanSearch, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [clients, totalClients] = await Promise.all([
      prisma.client.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
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
      prisma.client.count({
        where: whereClause,
      }),
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
        search: search || null,
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
    const paramResult = ClientIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const firstIssue = paramResult.error.issues[0];

      return res.status(400).json({
        success: false,
        message: firstIssue ? firstIssue.message : "Invalid request parameters",
      });
    }
    const { id } = paramResult.data;

    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
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

/* ---------------------------------------------------------------------------*/

export const updateClientProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const paramResult = ClientIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const [firstIssue] = paramResult.error.issues;
      if (firstIssue) {
        return res
          .status(400)
          .json({ success: false, message: firstIssue.message });
      }
    }
    const id = (paramResult as any).data.id;

    const validationResult = CreateClientSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      const [firstIssue] = validationResult.error.issues;
      if (firstIssue) {
        return res.status(400).json({
          success: false,
          message: firstIssue.message,
        });
      }
      return res
        .status(400)
        .json({ success: false, message: "Validation error" });
    }

    const { name, email, phone, address } = validationResult.data;

    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Access" });
    }

    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    if (email || phone) {
      const conflictClient = await prisma.client.findFirst({
        where: {
          id: { not: id },
          OR: [email ? { email } : {}, phone ? { phone } : {}].filter(
            (obj) => Object.keys(obj).length > 0,
          ),
        },
      });

      if (conflictClient) {
        return res.status(409).json({
          success: false,
          message: "Email or phone number already exists",
        });
      }
    }

    const updateData = Object.fromEntries(
      Object.entries({
        name,
        email,
        phone,
        address,
        updatedById: userId,
      }).filter(([_, v]) => v !== undefined),
    );

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: updatedClient,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------*/
