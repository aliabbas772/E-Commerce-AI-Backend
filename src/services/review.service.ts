import { GraphQLError } from "graphql";
import { Review } from "../models/Review.model";
import { Product } from "../models/Product.model";
import { Order } from "../models/Order.model";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../validators/review.validators";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.utils";

const checkVerifiedPurchase = async (
  userId: string,
  productId: string,
): Promise<boolean> => {
  const order = await Order.findOne({
    user: userId,
    paymentStatus: "paid",
    "items.product": productId,
  });
  return !!order;
};

const updateProductRating = async (productId: string) => {
  const result = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $count: {} },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

export const getProductReviewsService = async (args: {
  productId: string;
  page?: number;
  limit?: number;
}) => {
  const { page, limit, skip } = getPaginationParams(args);

  const [data, totalCount] = await Promise.all([
    Review.find({ product: args.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ product: args.productId }),
  ]);

  return buildPaginatedResult(data, totalCount, page, limit);
};

export const getMyReviewsService = async (userId: string) => {
  return Review.find({ user: userId }).populate("product");
};

export const createReviewService = async (
  userId: string,
  input: {
    productId: string;
    rating: number;
    title: string;
    body: string;
  },
) => {
  createReviewSchema.parse(input);

  const product = await Product.findById(input.productId);
  if (!product) {
    throw new GraphQLError("Product not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const existingReview = await Review.findOne({
    product: input.productId,
    user: userId,
  });
  if (existingReview) {
    throw new GraphQLError("You have already reviewed this product", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const isVerified = await checkVerifiedPurchase(userId, input.productId);

  const review = await Review.create({
    product: input.productId,
    user: userId,
    rating: input.rating,
    title: input.title,
    body: input.body,
    isVerifiedPurchase: isVerified,
  });

  await updateProductRating(input.productId);

  return Review.findById(review._id)
    .populate("user", "name")
    .populate("product");
};

export const updateReviewService = async (
  id: string,
  userId: string,
  input: Partial<{ rating: number; title: string; body: string }>,
) => {
  updateReviewSchema.parse(input);

  const review = await Review.findById(id);
  if (!review) {
    throw new GraphQLError("Review not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  if (review.user.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  Object.assign(review, input);
  await review.save();

  await updateProductRating(review.product.toString());

  return Review.findById(id).populate("user", "name").populate("product");
};

export const deleteReviewService = async (
  id: string,
  userId: string,
  isAdmin: boolean,
) => {
  const review = await Review.findById(id);
  if (!review) {
    throw new GraphQLError("Review not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (!isAdmin && review.user.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  const productId = review.product.toString();
  await Review.findByIdAndDelete(id);

  await updateProductRating(productId);

  return { message: "Review deleted successfully" };
};
