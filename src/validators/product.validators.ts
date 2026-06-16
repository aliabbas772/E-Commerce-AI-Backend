import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  category: z.string().min(1),
  sizes: z.array(z.enum(["XS", "S", "M", "L", "XL", "XXL"])).min(1),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();
