// src/tests/setup.ts
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Import every model once — registers all schemas globally for all test files
import "../models/User.model";
import "../models/Product.model";
import "../models/Category.model";
import "../models/Order.model";
import "../models/Cart.model";
import "../models/Wishlist.model";
import "../models/Address.model";
import "../models/Payment.model";
import "../models/Review.model";
import "../models/Admin.model";
import "../models/Notification.model";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
