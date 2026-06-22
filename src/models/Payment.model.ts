import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status:
    | "initiated"
    | "pending"
    | "paid"
    | "failed"
    | "refunded"
    | "partially_refunded";
  gateway: "razorpay" | "google_pay" | "upi";
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  method?: string; 
  bank?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: [
        "initiated",
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      default: "initiated",
    },
    gateway: {
      type: String,
      enum: ["razorpay", "google_pay", "upi"],
      default: "razorpay",
    },
    gatewayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    gatewayPaymentId: { type: String },
    gatewaySignature: { type: String },
    refundId: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundedAt: { type: Date },
    method: { type: String },
    bank: { type: String },
    failureReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
