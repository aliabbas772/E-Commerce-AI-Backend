import mongoose, { Document, Schema } from "mongoose";

export type AdminPermission =
  | "manage_products"
  | "manage_orders"
  | "manage_users"
  | "manage_categories"
  | "manage_reviews"
  | "issue_refunds"
  | "view_analytics"
  | "manage_admins";

export interface IAuditLog {
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, any>;
  ip?: string;
  timestamp: Date;
}

export interface IAdmin extends Document {
  user: mongoose.Types.ObjectId;
  permissions: AdminPermission[];
  isActive: boolean;
  auditLogs: IAuditLog[];
  lastLoginAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      enum: [
        "manage_products",
        "manage_orders",
        "manage_users",
        "manage_categories",
        "manage_reviews",
        "issue_refunds",
        "view_analytics",
        "manage_admins",
      ],
      default: ["manage_products", "manage_orders", "view_analytics"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    auditLogs: [
      {
        action: { type: String, required: true },
        entity: { type: String, required: true },
        entityId: { type: String, required: true },
        changes: { type: Schema.Types.Mixed },
        ip: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    lastLoginAt: { type: Date },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
