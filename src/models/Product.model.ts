import mongoose, { Document, Schema } from "mongoose";

// 1. Define the subdocument interface for better type safety
interface ISizeVariant {
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: mongoose.Types.ObjectId;
  sizes: ISizeVariant[]; // 2. Updated from string[] to the correct object array type
  sku?: string;
  tags?: string[];
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
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
      type: [
        {
          size: {
            type: String,
            required: true,
            enum: ["XS", "S", "M", "L", "XL", "XXL"],
            // Removed default: [] from here
          },
          stock: { type: Number, required: true, min: 0, default: 0 },
        },
      ],
      required: true,
      validate: [(arr: any[]) => arr.length > 0, "At least one size required"],
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
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
