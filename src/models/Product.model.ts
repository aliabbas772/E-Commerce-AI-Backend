import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  comparePrice?: number; // original price for showing discount
  images: string[];
  category: mongoose.Types.ObjectId; // ← now reference
  sizes: string[];
  stock: number;
  sku?: string; // stock keeping unit — unique product code
  tags?: string[]; // for search
  isActive: boolean;
  averageRating: number; // denormalized for performance
  totalReviews: number; // denormalized for performance
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    comparePrice: {
      type: Number,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    sizes: {
      type: [String],
      enum: ["XS", "S", "M", "L", "XL", "XXL"],
      default: [],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sku: {
      // Why SKU: unique identifier per product variant
      // Used in warehouse, inventory systems
      type: String,
      unique: true,
      sparse: true,
    },
    tags: {
      type: [String],
      default: [],
      // Why tags: "cotton", "summer", "casual" — improves search
    },
    isActive: {
      type: Boolean,
      default: true,
      // Why: soft delete — deactivate instead of delete
      // Deleting breaks order history that references this product
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      // Why denormalized: calculating average on every product list
      // query across thousands of reviews = slow. Store it here, update on review
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

ProductSchema.index({ name: "text", description: "text", tags: "text" });

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
