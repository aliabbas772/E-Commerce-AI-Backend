import { Category } from "../../models/Category.model";
import { User } from "../../models/User.model";
import { Product } from "../../models/Product.model";
import { createReviewService } from "../../services/review.service";
import mongoose from "mongoose";

describe("Review Service", () => {
  let productId: string;

  beforeEach(async () => {
    const category = await Category.create({ name: "Test Category" });
    const product = await Product.create({
      name: "Test Product",
      description: "Product for review testing",
      price: 500,
      category: category._id,
      sizes: ["M"],
      stock: 10,
    });
    productId = product._id.toString();
  });

  test("creates review and updates product average rating", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    await createReviewService(userId, {
      productId,
      rating: 5,
      title: "Great product",
      body: "Really happy with the quality and fit of this item.",
    });

    const updated = await Product.findById(productId);
    expect(updated!.averageRating).toBe(5);
    expect(updated!.totalReviews).toBe(1);
  });

  test("prevents duplicate review from same user", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    await createReviewService(userId, {
      productId,
      rating: 4,
      title: "First review",
      body: "This is my first review of this product, pretty good.",
    });

    await expect(
      createReviewService(userId, {
        productId,
        rating: 2,
        title: "Second attempt",
        body: "Trying to review again which should not be allowed.",
      }),
    ).rejects.toThrow("already reviewed");
  });
});
