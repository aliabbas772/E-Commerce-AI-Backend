import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import { getAllUsersService } from "../../services/user.service";
import { checkPermission } from "../../services/admin.service";

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

const userResolvers = {
  Query: {
    getAllUsers: async (
      _: unknown,
      args: { search?: string; page?: number; limit?: number },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_users");
      return getAllUsersService(args);
    },
  },
};

export default userResolvers;
