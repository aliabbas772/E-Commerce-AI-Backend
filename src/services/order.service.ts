import { GraphQLError } from "graphql";
import { Order } from "../models/Order.model";
import { Product } from "../models/Product.model";
import { Payment } from "../models/Payment.model";
import { Address } from "../models/Address.model";
import { Cart } from "../models/Cart.model";
import { razorpay, verifyRazorpaySignature } from "../utils/razorpay.utils";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.utils";
import {
  publishOrderCreated,
  publishOrderShipped,
  publishPaymentVerified,
} from "../kafka/producers/order.producer";
import { notificationQueue, emailQueue } from "../queues/index";
import { logger } from "../utils/logger.utils";
import redis from "../config/redis";
import { withLock } from "../utils/redisLock.utils";
import { orderCreatedTotal, paymentVerifiedTotal } from "../config/metrics";

export const getMyOrdersService = async (
  userId: string,
  args: { page?: number; limit?: number },
) => {
  const { page, limit, skip } = getPaginationParams(args);

  const [data, totalCount] = await Promise.all([
    Order.find({ user: userId })
      .populate("items.product")
      .populate("address")
      .populate("payment")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: userId }),
  ]);

  return buildPaginatedResult(data, totalCount, page, limit);
};

export const getAllOrdersService = async (args: {
  page?: number;
  limit?: number;
}) => {
  const { page, limit, skip } = getPaginationParams(args);

  const [data, totalCount] = await Promise.all([
    Order.find()
      .populate("items.product")
      .populate("user")
      .populate("address")
      .populate("payment")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(),
  ]);

  return buildPaginatedResult(data, totalCount, page, limit);
};

export const getOrderByIdService = async (
  id: string,
  userId: string,
  isAdmin: boolean,
) => {
  const cacheKey = `order:${userId}:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached as string);

  const order = await Order.findById(id)
    .populate("items.product")
    .populate("user")
    .populate("address")
    .populate("payment");

  if (!order) {
    throw new GraphQLError("Order not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (!isAdmin && order.user._id.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  await redis.setex(cacheKey, 120, JSON.stringify(order));
  return order;
};

export const createOrderService = async (
  userId: string,
  userEmail: string,
  userName: string,
  args: {
    items: { productId: string; quantity: number; size: string }[];
    addressId: string;
    notes?: string;
  },
) => {
  return withLock(`order:user:${userId}`, async () => {
    const address = await Address.findById(args.addressId);
    if (!address) {
      throw new GraphQLError("Address not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (address.user.toString() !== userId) {
      throw new GraphQLError("Not authorized to use this address", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of args.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        throw new GraphQLError(`Product not found or unavailable`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      if (product.stock < item.quantity) {
        throw new GraphQLError(`Insufficient stock for ${product.name}`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (!product.sizes.includes(item.size)) {
        throw new GraphQLError(
          `Size ${item.size} not available for ${product.name}`,
          {
            extensions: { code: "BAD_USER_INPUT" },
          },
        );
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        size: item.size,
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      address: args.addressId,
      paymentStatus: "pending",
      deliveryStatus: "processing",
      notes: args.notes,
    });

    await Payment.create({
      order: order._id,
      user: userId,
      amount: totalAmount,
      currency: "INR",
      status: "initiated",
      gateway: "razorpay",
      gatewayOrderId: razorpayOrder.id,
    });

    orderCreatedTotal.inc();

    await Order.findByIdAndUpdate(order._id, { payment: order._id });

    await publishOrderCreated({
      orderId: order._id.toString(),
      userId,
      email: userEmail,
      name: userName,
      totalAmount,
    });

    await notificationQueue.add("order_placed", {
      userId,
      type: "order_placed",
      title: "Order Placed!",
      message: `Your order of ₹${totalAmount} has been placed successfully.`,
      link: `/orders/${order._id}`,
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount * 100,
      currency: "INR",
    };
  });
};

export const verifyPaymentService = async (args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const isValid = verifyRazorpaySignature(
    args.razorpayOrderId,
    args.razorpayPaymentId,
    args.razorpaySignature,
  );

  if (!isValid && process.env.NODE_ENV === "production") {
    await Payment.findOneAndUpdate(
      { gatewayOrderId: args.razorpayOrderId },
      { status: "failed", failureReason: "Signature mismatch" },
    );
    throw new GraphQLError("Invalid payment signature", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  paymentVerifiedTotal.inc({ status: "failed" });

  const payment = await Payment.findOneAndUpdate(
    { gatewayOrderId: args.razorpayOrderId },
    {
      status: "paid",
      gatewayPaymentId: args.razorpayPaymentId,
      gatewaySignature: args.razorpaySignature,
    },
    { new: true },
  );

  if (!payment) {
    throw new GraphQLError("Payment record not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const order = await Order.findOneAndUpdate(
    { _id: payment.order },
    { paymentStatus: "paid", payment: payment._id },
    { new: true },
  ).populate("user");

  if (!order) {
    throw new GraphQLError("Order not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  for (const item of order.items) {
    await withLock(`stock:product:${item.product}`, async () => {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        throw new GraphQLError("Insufficient stock");
      }
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    });
  }

  await Cart.findOneAndUpdate(
    { user: order.user },
    { items: [], totalAmount: 0 },
  );

  const user = order.user as any;

  await publishPaymentVerified({
    orderId: order._id.toString(),
    email: user.email,
    name: user.name,
    totalAmount: order.totalAmount,
  });

  await notificationQueue.add("payment_success", {
    userId: user._id.toString(),
    type: "payment_success",
    title: "Payment Successful!",
    message: `Payment of ₹${order.totalAmount} received. Your order is being processed.`,
    link: `/orders/${order._id}`,
  });

  paymentVerifiedTotal.inc({ status: "success" });

  return { message: "Payment verified successfully" };
};

export const updateOrderStatusService = async (
  id: string,
  deliveryStatus: string,
  adminUserId: string,
  ip?: string,
) => {
  const validStatuses = ["processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(deliveryStatus)) {
    throw new GraphQLError("Invalid delivery status", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { deliveryStatus },
    { new: true },
  )
    .populate("items.product")
    .populate("user")
    .populate("address")
    .populate("payment");

  if (!order) {
    throw new GraphQLError("Order not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const user = order.user as any;

  if (deliveryStatus === "shipped") {
    await publishOrderShipped({
      orderId: order._id.toString(),
      email: user.email,
      name: user.name,
    });

    await notificationQueue.add("order_shipped", {
      userId: user._id.toString(),
      type: "order_shipped",
      title: "Order Shipped!",
      message: "Your order is on the way. Expected delivery in 3-5 days.",
      link: `/orders/${order._id}`,
    });
  }

  if (deliveryStatus === "delivered") {
    await notificationQueue.add("order_delivered", {
      userId: user._id.toString(),
      type: "order_delivered",
      title: "Order Delivered!",
      message: "Your order has been delivered. Enjoy your purchase!",
      link: `/orders/${order._id}`,
    });
  }

  if (deliveryStatus === "cancelled") {
    await notificationQueue.add("order_cancelled", {
      userId: user._id.toString(),
      type: "order_cancelled",
      title: "Order Cancelled",
      message: `Your order #${order._id} has been cancelled.`,
      link: `/orders/${order._id}`,
    });
  }

  await redis.del(`order:${user._id}:${id}`);

  return order;
};

export const cancelOrderService = async (
  id: string,
  userId: string,
  reason?: string,
) => {
  const order = await Order.findById(id).populate("user");
  if (!order) {
    throw new GraphQLError("Order not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  if (order.user._id.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  if (!["processing"].includes(order.deliveryStatus)) {
    throw new GraphQLError(
      "Order cannot be cancelled after it has been shipped",
      { extensions: { code: "BAD_USER_INPUT" } },
    );
  }

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  await Order.findByIdAndUpdate(id, {
    deliveryStatus: "cancelled",
    paymentStatus:
      order.paymentStatus === "paid" ? "refunded" : order.paymentStatus,
  });

  return { message: "Order cancelled successfully" };
};
