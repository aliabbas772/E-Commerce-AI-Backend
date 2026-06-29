import { Category } from "../../models/Category.model";
import { Product } from "../../models/Product.model";
import {
  addToCart,
} from "../../services/cart.service";
import mongoose from "mongoose";

describe("Cart Service", () => {
  let productId: string;

  beforeEach(async () => {
    const category = await Category.create({ name: "Test Category" });
    const product = await Product.create({
      name: "Test Shirt",
      description: "A test product for cart testing",
      price: 500,
      category: category._id,
      sizes: ["M", "L"],
      stock: 10,
    });
    productId = product._id.toString();
  });

  test("adds item to cart with correct price snapshot", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const cart = await addToCart(userId, productId, 2, "M");

    expect(cart!.items).toHaveLength(1);
    expect(cart!.items[0].quantity).toBe(2);
    expect(cart!.totalAmount).toBe(1000);
  });

  test("throws error when stock is insufficient", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    await expect(addToCart(userId, productId, 100, "M")).rejects.toThrow(
      "Insufficient stock",
    );
  });

  test("throws error for invalid size", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    await expect(
      addToCart(userId, productId, 1, "XXXL"),
    ).rejects.toThrow("Invalid size");
  });

  test("combines quantity when adding same product+size twice", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    await addToCart(userId, productId, 2, "M");
    const cart = await addToCart(userId, productId, 3, "M");

    expect(cart!.items).toHaveLength(1);
    expect(cart!.items[0].quantity).toBe(5);
  });
});
