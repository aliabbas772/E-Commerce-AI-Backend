import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  getMyWishlistService,
  addToWishlistService,
  removeFromWishlistService,
  clearWishlistService,
} from "../../services/wishlist.service";

const requireAuth = (context: Context) => {
  if (!context.user)
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
};

const wishlistResolvers = {
  Query: {
    getMyWishlist: (_: unknown, __: unknown, context: Context) => {
      requireAuth(context);
      return getMyWishlistService(context.user!._id.toString());
    },
  },
  Mutation: {
    addToWishlist: (
      _: unknown,
      args: { productId: string },
      context: Context,
    ) => {
      requireAuth(context);
      return addToWishlistService(context.user!._id.toString(), args.productId);
    },
    removeFromWishlist: (
      _: unknown,
      args: { productId: string },
      context: Context,
    ) => {
      requireAuth(context);
      return removeFromWishlistService(
        context.user!._id.toString(),
        args.productId,
      );
    },
    clearWishlist: (_: unknown, __: unknown, context: Context) => {
      requireAuth(context);
      return clearWishlistService(context.user!._id.toString());
    },
  },
};

export default wishlistResolvers;
