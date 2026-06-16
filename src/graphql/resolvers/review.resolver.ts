import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  getProductReviewsService,
  getMyReviewsService,
  createReviewService,
  updateReviewService,
  deleteReviewService,
} from "../../services/review.service";

const requireAuth = (context: Context) => {
  if (!context.user)
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
};

const reviewResolvers = {
  Query: {
    getProductReviews: (
      _: unknown,
      args: { productId: string; page?: number; limit?: number },
    ) => getProductReviewsService(args),

    getMyReviews: (_: unknown, __: unknown, context: Context) => {
      requireAuth(context);
      return getMyReviewsService(context.user!._id.toString());
    },
  },
  Mutation: {
    createReview: (_: unknown, args: { input: any }, context: Context) => {
      requireAuth(context);
      return createReviewService(context.user!._id.toString(), args.input);
    },
    updateReview: (
      _: unknown,
      args: { id: string; input: any },
      context: Context,
    ) => {
      requireAuth(context);
      return updateReviewService(
        args.id,
        context.user!._id.toString(),
        args.input,
      );
    },
    deleteReview: (_: unknown, args: { id: string }, context: Context) => {
      requireAuth(context);
      const isAdmin = context.user!.role === "admin";
      return deleteReviewService(
        args.id,
        context.user!._id.toString(),
        isAdmin,
      );
    },
  },
};

export default reviewResolvers;
