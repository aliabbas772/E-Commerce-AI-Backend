import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/category.service";
import { logAdminAction } from "../../services/admin.service";

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

const categoryResolvers = {
  Query: {
    getCategories: () => getCategories(),
    getCategoryById: (_: unknown, args: { id: string }) =>
      getCategoryById(args.id),
    getCategoryBySlug: (_: unknown, args: { slug: string }) =>
      getCategoryBySlug(args.slug),
  },
  Mutation: {
    createCategory: async (
      _: unknown,
      args: { input: any },
      context: Context,
    ) => {
      requireAdmin(context);
      const category = await createCategory(args.input);
      await category.populate("parentCategory");
      await logAdminAction(
        context.user!._id.toString(),
        "CREATE",
        "Category",
        category._id.toString(),
        context.req.ip,
      );
      return category;
    },
    updateCategory: async (
      _: unknown,
      args: { id: string; input: any },
      context: Context,
    ) => {
      requireAdmin(context);
      const category = await updateCategory(args.id, args.input);
      await logAdminAction(
        context.user!._id.toString(),
        "UPDATE",
        "Category",
        args.id,
        context.req.ip,
        args.input,
      );
      return category;
    },
    deleteCategory: async (
      _: unknown,
      args: { id: string },
      context: Context,
    ) => {
      requireAdmin(context);
      const result = await deleteCategory(args.id);
      await logAdminAction(
        context.user!._id.toString(),
        "DELETE",
        "Category",
        args.id,
        context.req.ip,
      );
      return result;
    },
  },
};

export default categoryResolvers;
