import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "order_placed"
  | "payment_success"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "review_posted"
  | "account_activity";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string; // where to navigate on click
  metadata?: Record<string, any>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "order_placed",
        "payment_success",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "review_posted",
        "account_activity",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    // Auto-delete notifications after 90 days
    // Why: notifications are temporary data, no need to keep forever
    expireAfterSeconds: 7776000,
  },
);

NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
