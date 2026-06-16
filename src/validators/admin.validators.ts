import { z } from "zod";

const permissions = [
  "manage_products",
  "manage_orders",
  "manage_users",
  "manage_categories",
  "manage_reviews",
  "issue_refunds",
  "view_analytics",
  "manage_admins",
] as const;

export const createAdminSchema = z.object({
  userId: z.string().min(1),
  permissions: z.array(z.enum(permissions)).min(1),
});

export const updateAdminPermissionsSchema = z.object({
  permissions: z.array(z.enum(permissions)).min(1),
});
