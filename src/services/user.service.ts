import { User } from "../models/User.model";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.utils";

export const getAllUsersService = async (args: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { page, limit, skip } = getPaginationParams(args);

  const query: any = {};
  if (args.search) {
    query.$or = [
      { name: { $regex: args.search, $options: "i" } },
      { email: { $regex: args.search, $options: "i" } },
    ];
  }

  const [data, totalCount] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return buildPaginatedResult(data, totalCount, page, limit);
};
