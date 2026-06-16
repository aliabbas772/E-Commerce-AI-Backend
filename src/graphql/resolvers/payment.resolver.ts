import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  getMyPaymentsService,
  getPaymentByOrderIdService,
  getAllPaymentsService,
  initiateRefundService,
} from "../../services/payment.service";
import { checkPermission, logAdminAction } from "../../services/admin.service";

const requireAuth = (context: Context) => {
  if (!context.user)
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
};

const paymentResolvers = {
  Query: {
    getMyPayments: (_: unknown, __: unknown, context: Context) => {
      requireAuth(context);
      return getMyPaymentsService(context.user!._id.toString());
    },
    getPaymentByOrderId: (
      _: unknown,
      args: { orderId: string },
      context: Context,
    ) => {
      requireAuth(context);
      return getPaymentByOrderIdService(
        args.orderId,
        context.user!._id.toString(),
      );
    },
    getAllPayments: async (
      _: unknown,
      args: { page?: number; limit?: number },
      context: Context,
    ) => {
      requireAuth(context);
      await checkPermission(context.user!._id.toString(), "view_analytics");
      return getAllPaymentsService(args);
    },
  },
  Mutation: {
    initiateRefund: async (
      _: unknown,
      args: { paymentId: string; amount: number; reason: string },
      context: Context,
    ) => {
      requireAuth(context);
      await checkPermission(context.user!._id.toString(), "issue_refunds");
      const payment = await initiateRefundService(
        args.paymentId,
        args.amount,
        args.reason,
        context.user!._id.toString(),
      );
      await logAdminAction(
        context.user!._id.toString(),
        "REFUND",
        "Payment",
        args.paymentId,
        context.req.ip,
        { amount: args.amount, reason: args.reason },
      );
      return payment;
    },
  },
};

export default paymentResolvers;
