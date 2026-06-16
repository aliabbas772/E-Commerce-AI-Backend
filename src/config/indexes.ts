import { User } from "../models/User.model";
import { Product } from "../models/Product.model";
import { Order } from "../models/Order.model";
import { Cart } from "../models/Cart.model";
import { Wishlist } from "../models/Wishlist.model";
import { Category } from "../models/Category.model";
import { Address } from "../models/Address.model";
import { Payment } from "../models/Payment.model";
import { Review } from "../models/Review.model";
import { Admin } from "../models/Admin.model";
import { logger } from "../utils/logger.utils";
import { Notification } from "../models/Notification.model";

export const createIndexes = async (): Promise<void> => {
  // User
  await User.collection.createIndex({ email: 1 }, { unique: true });
  await User.collection.createIndex({ phone: 1 }, { sparse: true });

  // Product
  await Product.collection.createIndex({ category: 1 });
  await Product.collection.createIndex({ price: 1 });
  await Product.collection.createIndex({ category: 1, price: 1 });
  await Product.collection.createIndex({ isActive: 1 });
  await Product.collection.createIndex({ averageRating: -1 });
  await Product.collection.createIndex({
    name: "text",
    description: "text",
    tags: "text",
  });

  // Order
  await Order.collection.createIndex({ user: 1 });
  await Order.collection.createIndex({ paymentStatus: 1 });
  await Order.collection.createIndex({ deliveryStatus: 1 });
  await Order.collection.createIndex({ createdAt: -1 });

  // Cart — one per user
  await Cart.collection.createIndex({ user: 1 }, { unique: true });

  // Wishlist — one per user
  await Wishlist.collection.createIndex({ user: 1 }, { unique: true });

  // Category
  await Category.collection.createIndex({ slug: 1 }, { unique: true });
  await Category.collection.createIndex({ isActive: 1 });
  await Category.collection.createIndex({ parentCategory: 1 });

  // Address
  await Address.collection.createIndex({ user: 1 });
  await Address.collection.createIndex({ user: 1, isDefault: 1 });

  // Payment
  await Payment.collection.createIndex({ gatewayOrderId: 1 }, { unique: true });
  await Payment.collection.createIndex({ order: 1 });
  await Payment.collection.createIndex({ user: 1 });
  await Payment.collection.createIndex({ status: 1 });

  // Review — one per user per product
  await Review.collection.createIndex(
    { product: 1, user: 1 },
    { unique: true },
  );
  await Review.collection.createIndex({ product: 1, rating: -1 });

  // Admin
  await Admin.collection.createIndex({ user: 1 }, { unique: true });

  // Notification
  await Notification.collection.createIndex({ user: 1, isRead: 1 });
  await Notification.collection.createIndex({ user: 1, createdAt: -1 });

  logger.info("✅ MongoDB indexes created");
};
