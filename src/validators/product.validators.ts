import { z } from "zod";

const sizeStockSchema = z.object({
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
  stock: z.number().int().min(0),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  category: z.string(),
  sizes: z.array(sizeStockSchema).min(1),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();
