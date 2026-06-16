import { GraphQLError } from "graphql";
import { Wishlist } from "../models/Wishlist.model";
import { Product } from "../models/Product.model";

export const getMyWishlistService = async (userId: string) => {
  return Wishlist.findOne({ user: userId }).populate("products");
};

export const addToWishlistService = async (
  userId: string,
  productId: string,
) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new GraphQLError("Product not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, products: [] });
  }

  const alreadyAdded = wishlist.products
    .map((p) => p.toString())
    .includes(productId);

  if (alreadyAdded) {
    throw new GraphQLError("Product already in wishlist", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  wishlist.products.push(product._id);
  await wishlist.save();
  return Wishlist.findById(wishlist._id).populate("products");
};

export const removeFromWishlistService = async (
  userId: string,
  productId: string,
) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    throw new GraphQLError("Wishlist not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  wishlist.products = wishlist.products.filter(
    (p) => p.toString() !== productId,
  ) as any;

  await wishlist.save();
  return Wishlist.findById(wishlist._id).populate("products");
};

export const clearWishlistService = async (userId: string) => {
  await Wishlist.findOneAndUpdate({ user: userId }, { products: [] });
  return { message: "Wishlist cleared" };
};
