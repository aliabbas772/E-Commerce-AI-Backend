import { z } from "zod";

export const initiateRefundSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(5).max(500),
});
