import { GraphQLError } from "graphql";
import redis from "../config/redis";
import { Category } from "../models/Category.model";
import { Product } from "../models/Product.model";

const CACHE_KEY = "categories:all";
const CACHE_TTL = 3600;

const clearCategoryCache = async () => {
  await redis.del(CACHE_KEY);
};

export const getCategories = async () => {
  const cached = await redis.get(CACHE_KEY);
  // console.log(JSON.parse(cached!))
  if (cached) return JSON.parse(cached as string);

  const categories = await Category.find({ isActive: true })
    .populate("parentCategory")
    .sort({ name: 1 });

  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(categories));
  // console.log(JSON.stringify(categories));
  return categories;
};

export const getCategoryById = async (categoryId: string) => {
  if (!categoryId) {
    throw new GraphQLError("Category ID is required", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const category =
    await Category.findById(categoryId).populate("parentCategory");

  if (!category) {
    throw new GraphQLError("Category not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  return category;
};

export const getCategoryBySlug = async (slug: string) => {
  // const cached = await redis.get(CACHE_KEY);
  // if (cached) return JSON.stringify(cached);

  const category = await Category.findOne({ slug }).populate("parentCategory");

  if (!category) {
    throw new GraphQLError("Category not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  //
  // await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(category));
  return category;
};

export const createCategory = async (input: {
  name: string;
  description?: string;
  image?: string;
  parentCategory: string;
}) => {
  const existing = await Category.findOne({ name: input.name });
  if (existing) {
    throw new GraphQLError("Category with this name already exists", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const category = await Category.create(input);
  await clearCategoryCache();

  return category;
};

export const updateCategory = async (
  id: string,
  input: Partial<{
    name: string;
    description?: string;
    image?: string;
    parentCategory: string;
    isActive: boolean;
  }>,
) => {
  const category = await Category.findByIdAndUpdate(
    id,
    input,
    { new: true, runValidators: true },
  ).populate("parentCategory");
  console.log(category);

  if (!category) {
    throw new GraphQLError("Category not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  await clearCategoryCache();
  return category;
};

export const deleteCategory = async (id: string) => {
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new GraphQLError(
      `Cannot delete — ${productCount} products use this category. Deactivate it instead.`,
      { extensions: { code: "BAD_USER_INPUT" } },
    );
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category)
    throw new GraphQLError("Category not found", {
      extensions: { code: "NOT_FOUND" },
    });

  clearCategoryCache();
  return { message: "category deleted successfully" };
};
