import { GraphQLError } from "graphql";
import { Admin, AdminPermission } from "../models/Admin.model";
import { User } from "../models/User.model";
import { getPaginationParams } from "../utils/pagination.utils";

export const checkPermission = async (
  userId: string,
  permission: AdminPermission,
): Promise<void> => {
  const admin = await Admin.findOne({ user: userId, isActive: true });
  if (!admin) {
    throw new GraphQLError("Admin profile not found", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  if (!admin.permissions.includes(permission)) {
    throw new GraphQLError(`Missing permission: ${permission}`, {
      extensions: { code: "FORBIDDEN" },
    });
  }
};

export const logAdminAction = async (
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  ip?: string,
  changes?: Record<string, any>,
): Promise<void> => {
  const admin = await Admin.findOneAndUpdate(
    { user: userId },
    {
      $push: {
        auditLogs: {
          $each: [
            { action, entity, entityId, ip, changes, timestamp: new Date() },
          ],
          $slice: -500,
        },
      },
    },
  );
  
  if (!admin) {
    throw new GraphQLError("Admin logs error", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

export const getAdminProfileService = async (userId: string) => {
  const admin = await Admin.findOne({ user: userId }).populate("user");
  if (!admin) {
    throw new GraphQLError("Admin profile not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  return admin;
};

export const getAllAdminsService = async () => {
  return Admin.find().populate("user").sort({ createdAt: -1 });
};

export const getAuditLogsService = async (
  adminId: string,
  args: { page?: number; limit?: number },
) => {
  const { page, limit, skip } = getPaginationParams(args);
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new GraphQLError("Admin not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  return admin.auditLogs
    .slice()
    .reverse()
    .slice(skip, skip + limit);
};

export const createAdminService = async (
  userId: string,
  permissions: AdminPermission[],
  createdByUserId: string,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new GraphQLError("User not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const existing = await Admin.findOne({ user: userId });
  if (existing) {
    throw new GraphQLError("User is already an admin", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  await User.findByIdAndUpdate(userId, { role: "admin" });

  const admin = await Admin.create({
    user: userId,
    permissions,
    createdBy: createdByUserId,
  });

  return Admin.findById(admin._id).populate("user");
};

export const updateAdminPermissionsService = async (
  adminId: string,
  permissions: AdminPermission[],
) => {
  const admin = await Admin.findByIdAndUpdate(
    adminId,
    { permissions },
    { new: true },
  ).populate("user");

  if (!admin) {
    throw new GraphQLError("Admin not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  return admin;
};

export const deactivateAdminService = async (adminId: string) => {
  const admin = await Admin.findByIdAndUpdate(
    adminId,
    { isActive: false },
    { new: true },
  );
  if (!admin) {
    throw new GraphQLError("Admin not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  
  await User.findByIdAndUpdate(admin.user, { role: "user" });
  return { message: "Admin deactivated successfully" };
};
