import { z } from "zod";
import { disposableSet } from "../user/auth.validation.js";

export const CreateClientSchema = z.object({
  name: z.string().min(3, "Name is too short"),
  email: z
    .string()
    .min(1, "Email is required")
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
  phone: z.string().min(11, "Phone number must be at least 11 characters"),
  address: z.string().optional().nullable(),
});

// For pagination in getAllClients
export const ClientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const ClientIdParamSchema = z.object({
  id: z.string().cuid2({ message: "Invalid ID format" }),
});