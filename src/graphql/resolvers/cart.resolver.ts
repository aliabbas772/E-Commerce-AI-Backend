import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCart,
} from "../../services/cart.service";

const requireAuth = (context: Context) => {
  if (!context.user) {
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
};

const cartResolvers = {
  Query: {
    getMyCart: (_: unknown, __: unknown, context: Context) => {
      requireAuth(context);

      return getCart(context.user!._id.toString());
    },
  },

  Mutation: {
    addToCart: async (
      _: unknown,
      args: {
        productId: string;
        quantity: number;
        size: string;
      },
      context: Context,
    ) => {
      requireAuth(context);
      addToCart(
        context.user!._id.toString(),
        args.productId,
        args.quantity,
        args.size,
      );
    },
    updateCartItem: async (
      _: unknown,
      args: { productId: string; quantity: number; size: string },
      context: Context,
    ) => {
      requireAuth(context);
      return updateCart(
        context.user!._id.toString(),
        args.productId,
        args.quantity,
        args.size,
      );
    },

    removeFromCart: async (
      _: unknown,
      args: { productId: string; size: string },
      context: Context,
    ) => {
      requireAuth(context);
      return removeFromCart(
        context.user!._id.toString(),
        args.productId,
        args.size,
      );
    },

    clearCart: async (_: unknown, __: unknown, context: Context) => {
      requireAuth(context);
      return clearCart(context.user!._id.toString());
    },
  },
};

export default cartResolvers;
