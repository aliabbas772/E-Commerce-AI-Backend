import { z } from "zod";

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
        size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
      }),
    )
    .min(1),
  addressId: z.string().min(1),
});
