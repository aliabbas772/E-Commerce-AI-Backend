import { PaginationArgs } from "../types/pagination.types";

export const getPaginationParams = (args: PaginationArgs) => {
  const page = Math.max(1, args.page || 1);
  const limit = Math.min(50, Math.max(1, args.limit || 20)); 
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginatedResult = <T>(
  data: T[],
  totalCount: number,
  page: number,
  limit: number,
) => ({
  data,
  totalCount,
  totalPages: Math.ceil(totalCount / limit),
  currentPage: page,
  hasNextPage: page < Math.ceil(totalCount / limit),
  hasPrevPage: page > 1,
});
