import { z } from "zod";

export const DashboardQuerySchema = z.object({
  timeframe: z
    .enum(["daily", "weekly", "monthly", "yearly", "all"])
    .default("all"),
});

export const getStartDate = (timeframe: string): Date | undefined => {
  const now = new Date();
  
  switch (timeframe) {
    case "daily":
      return new Date(now.setHours(0, 0, 0, 0)); 
    case "weekly":
      return new Date(now.setDate(now.getDate() - 7)); 
    case "monthly":
      return new Date(now.setDate(now.getDate() - 30)); 
    case "yearly":
      return new Date(now.setDate(now.getDate() - 365)); 
    default:
      return undefined; 
  }
};