import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  getMyOrdersService,
  getAllOrdersService,
  getOrderByIdService,
  createOrderService,
  verifyPaymentService,
  updateOrderStatusService,
  cancelOrderService,
} from "../../services/order.service";
import { Order } from "../../models/Order.model";
import { checkPermission, logAdminAction } from "../../services/admin.service";

const requireAuth = (context: Context) => {
  if (!context.user)
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
};

const requireAdmin = (context: Context) => {
  requireAuth(context);
  if (context.user!.role !== "admin")
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
};

const orderResolvers = {
  Query: {
    getMyOrders: (_: unknown, args: any, context: Context) => {
      requireAuth(context);
      return getMyOrdersService(context.user!._id.toString(), args);
    },
    getAllOrders: async (_: unknown, args: any, context: Context) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_orders");
      return getAllOrdersService(args);
    },
    getOrderById: (_: unknown, args: { id: string }, context: Context) => {
      requireAuth(context);
      return getOrderByIdService(
        args.id,
        context.user!._id.toString(),
        context.user!.role === "admin",
      );
    },
    getSalesAnalytics: async (_: unknown, __: unknown, context: Context) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "view_analytics");
      const result = await Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $count: {} },
            averageOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]);
      return (
        result[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 }
      );
    },
    getTopProducts: async (_: unknown, __: unknown, context: Context) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "view_analytics");
      return Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $project: {
            productId: "$_id",
            name: { $arrayElemAt: ["$productDetails.name", 0] },
            totalSold: 1,
            revenue: 1,
          },
        },
      ]);
    },
  },
  Mutation: {
    createOrder: (_: unknown, args: any, context: Context) => {
      requireAuth(context);
      return createOrderService(
        context.user!._id.toString(),
        context.user!.email,
        context.user!.name,
        args,
      );
    },
    verifyPayment: (_: unknown, args: any, context: Context) => {
      requireAuth(context);
      return verifyPaymentService(args);
    },
    updateOrderStatus: async (
      _: unknown,
      args: { id: string; deliveryStatus: string },
      context: Context,
    ) => {
      requireAdmin(context);
      await checkPermission(context.user!._id.toString(), "manage_orders");
      const order = await updateOrderStatusService(
        args.id,
        args.deliveryStatus,
        context.user!._id.toString(),
        context.req.ip,
      );
      await logAdminAction(
        context.user!._id.toString(),
        "UPDATE_STATUS",
        "Order",
        args.id,
        context.req.ip,
        { deliveryStatus: args.deliveryStatus },
      );
      return order;
    },
    cancelOrder: (
      _: unknown,
      args: { id: string; reason?: string },
      context: Context,
    ) => {
      requireAuth(context);
      return cancelOrderService(
        args.id,
        context.user!._id.toString(),
        args.reason,
      );
    },
  },
};

export default orderResolvers;
