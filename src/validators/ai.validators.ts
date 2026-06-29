import { z } from "zod";

export const outfitSchema = z.object({
  occasion: z.string().min(2),
  budget: z.number().positive("Budget must be greater than 0"),
  gender: z.string(),
});

export const sizeSchema = z.object({
  height: z.number().positive("Height must be greater than 0"),
  weight: z.number().positive("Weight must be greater than 0"),
  gender: z.string(),
  category: z.string(),
});
