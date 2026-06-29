import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  getAdminProfileService,
  getAllAdminsService,
  getAuditLogsService,
  createAdminService,
  updateAdminPermissionsService,
  deactivateAdminService,
  checkPermission,
} from "../../services/admin.service";

const requireAdmin = (context: Context) => {
  if (!context.user)
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  if (context.user.role !== "admin")
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
};

const adminResolvers = {
  Query: {
    getAdminProfile: (_: unknown, __: unknown, context: Context) => {
      requireAdmin(context);
      return getAdminProfileService(context.user!._id.toString());
    },
    getAllAdmins: async (_: unknown, __: unknown, context: Context) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_admins");
      return getAllAdminsService();
    },
    getAuditLogs: async (
      _: unknown,
      args: { adminId: string; page?: number; limit?: number },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_admins");
      return getAuditLogsService(args.adminId, args);
    },
  },
  Mutation: {
    createAdmin: async (
      _: unknown,
      args: { userId: string; permissions: string[] },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_admins");
      return createAdminService(
        args.userId,
        args.permissions as any,
        context.user!._id.toString(),
      );
    },
    updateAdminPermissions: async (
      _: unknown,
      args: { adminId: string; permissions: string[] },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_admins");
      return updateAdminPermissionsService(
        args.adminId,
        args.permissions as any,
      );
    },
    deactivateAdmin: async (
      _: unknown,
      args: { adminId: string },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_admins");
      return deactivateAdminService(args.adminId);
    },
  },
};

export default adminResolvers;
