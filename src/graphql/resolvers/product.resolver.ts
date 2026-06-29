import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  getProductsService,
  getProductByIdService,
  // searchProductsService,
  createProductService,
  updateProductService,
  deleteProductService,
  uploadProductImageService,
} from "../../services/product.service";
import { checkPermission, logAdminAction } from "../../services/admin.service";

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

const productResolvers = {
  Query: {
    getProducts: (_: unknown, args: any) => getProductsService(args),
    getProductById: (_: unknown, args: { id: string }) =>
      getProductByIdService(args.id),
    // searchProducts: (_: unknown, args: any) => searchProductsService(args),
  },
  Mutation: {
    createProduct: async (
      _: unknown,
      args: { input: any },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_products");
      const product = await createProductService(args.input);
      await logAdminAction(
        context.user!._id.toString(),
        "CREATE",
        "Product",
        product!._id.toString(),
        context.req.ip,
      );
      return product;
    },
    updateProduct: async (
      _: unknown,
      args: { id: string; input: any },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_products");
      const product = await updateProductService(args.id, args.input);
      await logAdminAction(
        context.user!._id.toString(),
        "UPDATE",
        "Product",
        args.id,
        context.req.ip,
        args.input,
      );
      return product;
    },
    deleteProduct: async (
      _: unknown,
      args: { id: string },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_products");
      const result = await deleteProductService(args.id);
      await logAdminAction(
        context.user!._id.toString(),
        "DEACTIVATE",
        "Product",
        args.id,
        context.req.ip,
      );
      return result;
    },
    uploadProductImage: async (
      _: unknown,
      args: { productId: string; base64Image: string },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_products");
      return uploadProductImageService(args.productId, args.base64Image);
    },
  },
};

export default productResolvers;
