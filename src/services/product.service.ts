import { GraphQLError } from "graphql";
import { Product } from "../models/Product.model";
import { Category } from "../models/Category.model";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validators";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.utils";
import { uploadImage, deleteImage } from "../utils/cloudinary.utils";
import redis from "../config/redis";
import { logger } from "../utils/logger.utils";
import { indexProduct, removeProductFromIndex } from "./search.service";

const clearProductCache = async () => {
  const keys = await redis.keys("products:*");
  if (keys.length > 0) await redis.del(...keys);
};

export const getProductsService = async (args: {
  filters?: {
    category?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    isActive?: boolean;
  };
  page?: number;
  limit?: number;
}) => {
  const cacheKey = `products:${JSON.stringify(args)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { page, limit, skip } = getPaginationParams(args);
  const query: any = { isActive: true };

  if (args.filters?.category) query.category = args.filters.category;
  if (args.filters?.size) query.sizes = { $in: [args.filters.size] };
  if (args.filters?.tags?.length) query.tags = { $in: args.filters.tags };
  if (args.filters?.minPrice || args.filters?.maxPrice) {
    query.price = {};
    if (args.filters.minPrice) query.price.$gte = args.filters.minPrice;
    if (args.filters.maxPrice) query.price.$lte = args.filters.maxPrice;
  }
  // Allow admin to see inactive products
  if (args.filters?.isActive !== undefined) {
    query.isActive = args.filters.isActive;
  }

  const [data, totalCount] = await Promise.all([
    Product.find(query)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  const result = buildPaginatedResult(data, totalCount, page, limit);
  await redis.setex(cacheKey, 300, JSON.stringify(result));
  return result;
};

export const getProductByIdService = async (id: string) => {
  const cacheKey = `product:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const product = await Product.findById(id).populate("category");
  if (!product) {
    throw new GraphQLError("Product not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  await redis.setex(cacheKey, 300, JSON.stringify(product));
  return product;
};

export const searchProductsService = async (args: {
  query: string;
  page?: number;
  limit?: number;
}) => {
  const { page, limit, skip } = getPaginationParams(args);

  const [data, totalCount] = await Promise.all([
    Product.find(
      { $text: { $search: args.query }, isActive: true },
      { score: { $meta: "textScore" } },
    )
      .populate("category")
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit),
    Product.countDocuments({ $text: { $search: args.query }, isActive: true }),
  ]);

  return buildPaginatedResult(data, totalCount, page, limit);
};

export const createProductService = async (input: any) => {
  createProductSchema.parse(input);

  // Verify category exists
  const category = await Category.findById(input.category);
  if (!category) {
    throw new GraphQLError("Category not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const product = await Product.create({ ...input, images: [] });
  await indexProduct(product._id.toString());
  await clearProductCache();
  return Product.findById(product._id).populate("category");
};

export const updateProductService = async (id: string, input: any) => {
  updateProductSchema.parse(input);

  if (input.category) {
    const category = await Category.findById(input.category);
    if (!category) {
      throw new GraphQLError("Category not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true },
  ).populate("category");

  await indexProduct(id);

  if (!product) {
    throw new GraphQLError("Product not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  await clearProductCache();
  await redis.del(`product:${id}`);
  return product;
};

export const deleteProductService = async (id: string) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new GraphQLError("Product not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  // Soft delete — never hard delete products
  // Orders reference products — hard delete breaks order history
  await Product.findByIdAndUpdate(id, { isActive: false });

  await removeProductFromIndex(id);

  await clearProductCache();
  await redis.del(`product:${id}`);
  return { message: "Product deactivated successfully" };
};

export const uploadProductImageService = async (
  productId: string,
  base64Image: string,
) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new GraphQLError("Product not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (product.images.length >= 5) {
    throw new GraphQLError("Maximum 5 images per product", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const imageUrl = await uploadImage(base64Image, "products");
  product.images.push(imageUrl);
  await product.save();

  await clearProductCache();
  await redis.del(`product:${productId}`);
  return Product.findById(productId).populate("category");
};
