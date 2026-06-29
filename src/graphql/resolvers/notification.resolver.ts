import { GraphQLError } from "graphql";
import { Context } from "../../types/context.types";
import {
  getMyNotificationsService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
} from "../../services/notification.service";

const requireAuth = (context: Context) => {
  if (!context.user)
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
};

const notificationResolvers = {
  Query: {
    getMyNotifications: (
      _: unknown,
      args: { page?: number; limit?: number },
      context: Context,
    ) => {
      requireAuth(context);
      return getMyNotificationsService(context.user!._id.toString(), args);
    },
    getUnreadCount: (_: unknown, __: unknown, context: Context) => {
      requireAuth(context);
      return getUnreadCountService(context.user!._id.toString());
    },
  },
  Mutation: {
    markAsRead: (_: unknown, args: { id: string }, context: Context) => {
      requireAuth(context);
      return markAsReadService(args.id, context.user!._id.toString());
    },
    markAllAsRead: (_: unknown, __: unknown, context: Context) => {
      requireAuth(context);
      return markAllAsReadService(context.user!._id.toString());
    },
    deleteNotification: (
      _: unknown,
      args: { id: string },
      context: Context,
    ) => {
      requireAuth(context);
      return deleteNotificationService(args.id, context.user!._id.toString());
    },
  },
};

export default notificationResolvers;
