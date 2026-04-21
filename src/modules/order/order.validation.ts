import { z } from "zod";

const OrderItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  angle: z
    .array(z.enum(["FRONT", "BACK", "LEFT", "RIGHT", "TOP", "BOTTOM"]))
    .min(1),
  quantity: z.number().int().positive(),
  rate: z.number().min(0),
});

export const CreateOrderSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]),
  orderDate: z.string(),
  deadline: z.string(),
  note: z.string().optional(),

  paymentStatus: z
    .enum(["NOT_PAID", "PARTIALLY_PAID", "COMPLETELY_PAID"])
    .default("NOT_PAID"),
  paidAmount: z.number().min(0).default(0),

  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
});

// For pagination
export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export const OrderIdParamSchema = z.object({
  id: z.string().cuid2({ message: "Invalid ID format" }),
});


//update order schema
export const UpdateOrderSchema = z.object({
  clientId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["NOT_PAID", "PARTIALLY_PAID", "COMPLETELY_PAID"]).optional(),
  orderDate: z.string().optional(),
  deadline: z.string().optional(),
  note: z.string().optional(),
  paidAmount: z.number().min(0).optional(),
  items: z.array(
    z.object({
      productName: z.string().min(1),
      angle: z.array(z.enum(["FRONT", "BACK", "LEFT", "RIGHT", "TOP", "BOTTOM"])),
      quantity: z.number().int().positive(),
      rate: z.number().min(0),
    })
  ).optional(),
});