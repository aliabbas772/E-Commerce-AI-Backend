import { GraphQLError } from "graphql";
import { Cart } from "../models/Cart.model";
import { Product } from "../models/Product.model";

export const getCart = async (userId: string) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  return cart;
};

export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number,
  size: string,
) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new GraphQLError("Product not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (product.stock < quantity) {
    throw new GraphQLError("Insufficient stock", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (!product.sizes.includes(size)) {
    throw new GraphQLError("Invalid size for this product", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId && item.size === size,
  );

  // console.log(quantity);

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > 10) {
      throw new GraphQLError("Maximum 10 items per product allowed");
    }
    existingItem.quantity = newQty;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      size,
      price: product.price,
    });
  }

  await cart.save();
  return Cart.findById(cart._id).populate("items.product");
};

export const updateCart = async (
  userId: string,
  productId: string,
  quantity: number,
  size: string,
) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new GraphQLError("Cart not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const item = cart.items.find(
    (item) => item.product.toString() === productId && item.size === size,
  );

  if (!item) {
    throw new GraphQLError("Item not found in cart", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (quantity === 0) {
    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === productId && item.size === size),
    ) as any;
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  return Cart.findById(cart._id).populate("items.product");
};

export const removeFromCart = async (
  userId: string,
  productId: string,
  size: string,
) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new GraphQLError("Cart not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  cart.items = cart.items.filter(
    (item) => !(item.product.toString() === productId && item.size === size),
  ) as any;

  await cart.save();
  return Cart.findById(cart._id).populate("items.product");
};

export const clearCart = async (userId: string) => {
  await Cart.findOneAndUpdate({ user: userId }, { items: [], totalAmount: 0 });
  
  return { message: "Cart cleared" };
};
