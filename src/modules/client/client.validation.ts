import { z } from "zod";
import { disposableSet } from "../user/auth.validation.js";

//validation for create and update client
export const CreateClientSchema = z.object({
  name: z.string().trim().min(3, "Name is too short"),
  email: z
    .string()
    .min(1, "Email is required")
    .toLowerCase()
    .pipe(z.email("Invalid email address"))
    .refine(
      (email) => {
        const domain = email.split("@")[1]?.toLowerCase();
        return !disposableSet.has(domain || "");
      },
      {
        message:
          "Please use a permanent email address. Temporary domains are not allowed.",
      },
    ),
  phone: z
    .string()
    .trim()
    .regex(/^\d+$/, "Phone number must contain only digits")
    .length(11, "Phone number must be exactly 11 digits"),
  address: z
    .string()
    .trim()
    .max(500, "Address is too long")
    .optional()
    .nullable(),
});

// For pagination in getAllClients
export const ClientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export const ClientIdParamSchema = z.object({
  id: z.string().cuid2({ message: "Invalid ID format" }),
});
