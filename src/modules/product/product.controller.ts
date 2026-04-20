import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../shared/lib/prismaClient.js";
import {
  CreateProductSchema,
  ProductIdParamSchema,
  ProductsQuerySchema,
} from "./product.validation.js";
import slugify from "slugify";

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = CreateProductSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: validationResult.error.issues[0]?.message,
      });
    }

    const { name, price, minQuantity, description } = validationResult.data;

    const slug = slugify(name, { lower: true, strict: true });

    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized Access" });
      return;
    }
    const existingProduct = await prisma.product.findFirst({
      where: { name },
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product with same name already exists",
      });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        price,
        minQuantity,
        description: description ?? null,
        createdById: req.user.id,
        updatedById: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------*/

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit, search } = ProductsQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const cleanSearch = search ? search.replace(/^["']|["']$/g, "") : undefined;

    const whereClause = cleanSearch
      ? {
          OR: [
            { name: { contains: cleanSearch, mode: "insensitive" as const } },
            { slug: { contains: cleanSearch, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          minQuantity: true,
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
      prisma.product.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      meta: {
        totalProducts,
        totalPages,
        currentPage: page,
        limit,
        search: search || null,
      },
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------*/
export const getSingleProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const paramResult = ProductIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const firstIssue = paramResult.error.issues[0];

      return res.status(400).json({
        success: false,
        message: firstIssue ? firstIssue.message : "Invalid request parameters",
      });
    }
    const { id } = paramResult.data;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        minQuantity: true,
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

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------*/

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const paramResult = ProductIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const [firstIssue] = paramResult.error.issues;
      if (firstIssue) {
        return res
          .status(400)
          .json({ success: false, message: firstIssue.message });
      }
    }
    const id = (paramResult as any).data.id;

    const validationResult = CreateProductSchema.partial().safeParse(req.body);
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

    const { name, description, price, minQuantity } = validationResult.data;
    const slug = name
      ? slugify(name, { lower: true, strict: true })
      : undefined;

    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Access" });
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // if (name || description || price || minQuantity) {
    //   const conflictProduct = await prisma.product.findFirst({
    //     where: {
    //       id: { not: id },
    //       OR: [slug ? { slug } : {}].filter(
    //         (obj) => Object.keys(obj).length > 0,
    //       ),
    //     },
    //   });

    //   if (conflictProduct) {
    //     return res.status(409).json({
    //       success: false,
    //       message: "Product slug already exists",
    //     });
    //   }
    // }

    const updateData = Object.fromEntries(
      Object.entries({
        name,
        slug,
        description,
        price,
        minQuantity,
        updatedById: userId,
      }).filter(([_, v]) => v !== undefined),
    );

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------*/
