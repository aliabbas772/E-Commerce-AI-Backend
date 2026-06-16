import mongoose, { Document, Schema } from "mongoose";

interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  size: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  deliveryStatus: "processing" | "shipped" | "delivered" | "cancelled";
  address: mongoose.Types.ObjectId; // ← now a reference
  payment?: mongoose.Types.ObjectId; // ← now a reference
  couponCode?: string;
  discount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        size: { type: String, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    deliveryStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    couponCode: { type: String },
    discount: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true },
);

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
