import { GraphQLError } from "graphql";
import { Payment } from "../models/Payment.model";
import { Order } from "../models/Order.model";
import { razorpay } from "../utils/razorpay.utils";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.utils";
import { logger } from "../utils/logger.utils";

export const getMyPaymentsService = async (userId: string) => {
  return Payment.find({ user: userId })
    .populate("order")
    .sort({ createdAt: -1 });
};

export const getPaymentByOrderIdService = async (
  orderId: string,
  userId: string,
) => {
  const payment = await Payment.findOne({ order: orderId }).populate("order");
  if (!payment) return null;
  
  if (payment.user.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  return payment;
};

export const getAllPaymentsService = async (args: {
  page?: number;
  limit?: number;
}) => {
  const { page, limit, skip } = getPaginationParams(args);
  const payments = await Payment.find()
    .populate("order")
    .populate("user")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return payments;
};

export const initiateRefundService = async (
  paymentId: string,
  amount: number,
  reason: string,
  requesterId: string,
) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new GraphQLError("Payment not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (payment.status !== "paid") {
    throw new GraphQLError("Only paid payments can be refunded", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (amount > payment.amount) {
    throw new GraphQLError("Refund amount cannot exceed payment amount", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (!payment.gatewayPaymentId) {
    throw new GraphQLError("Gateway payment ID missing", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const refund = await razorpay.payments.refund(payment.gatewayPaymentId, {
    amount: amount * 100,
    notes: { reason },
  });

  payment.status =
    amount === payment.amount ? "refunded" : "partially_refunded";
  payment.refundId = refund.id;
  payment.refundAmount = amount;
  payment.refundReason = reason;
  payment.refundedAt = new Date();
  await payment.save();

  await Order.findByIdAndUpdate(payment.order, {
    paymentStatus: "refunded",
  });

  logger.info(`Refund initiated: ${refund.id} for payment ${paymentId}`);
  return payment;
};
