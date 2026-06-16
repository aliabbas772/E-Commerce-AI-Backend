import { GraphQLError } from "graphql";
import { Notification, NotificationType } from "../models/Notification.model";
import { getPaginationParams } from "../utils/pagination.utils";

export const getMyNotificationsService = async (
  userId: string,
  args: { page?: number; limit?: number },
) => {
  const { skip, limit } = getPaginationParams(args);

  return Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const getUnreadCountService = async (userId: string) => {
  const count = await Notification.countDocuments({
    user: userId,
    isRead: false,
  });
  return { count };
};

export const markAsReadService = async (id: string, userId: string) => {
  const notification = await Notification.findById(id);
  if (!notification) {
    throw new GraphQLError("Notification not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  if (notification.user.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

export const markAllAsReadService = async (userId: string) => {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true },
  );
  return { message: "All notifications marked as read" };
};

export const deleteNotificationService = async (id: string, userId: string) => {
  const notification = await Notification.findById(id);
  if (!notification) {
    throw new GraphQLError("Notification not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  if (notification.user.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  await Notification.findByIdAndDelete(id);
  return { message: "Notification deleted" };
};

// Called internally from queue workers
export const createNotificationService = async (data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}) => {
  return Notification.create({
    user: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    metadata: data.metadata,
  });
};
