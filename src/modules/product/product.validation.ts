import { z } from "zod";

//validation for create and update product
export const CreateProductSchema = z.object({
  name: z.string().min(3, "Name is too short"),
  price: z.number().positive("Price must be a positive number"),
  minQuantity: z
    .number()
    .int()
    .positive("Min. quantity must be a positive number"),
  description: z.string().optional(),
});

// For pagination in get all products
export const ProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export const ProductIdParamSchema = z.object({
  id: z.string().cuid2({ message: "Invalid ID format" }),
});
