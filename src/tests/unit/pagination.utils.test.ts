import {
  getPaginationParams,
  buildPaginatedResult,
} from "../../utils/pagination.utils";

describe("Pagination Utils", () => {
  test("defaults to page 1, limit 20", () => {
    const result = getPaginationParams({});
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  test("caps limit at 50 even if higher requested", () => {
    const result = getPaginationParams({ limit: 500 });
    expect(result.limit).toBe(50);
  });

  test("calculates skip correctly for page 3", () => {
    const result = getPaginationParams({ page: 3, limit: 10 });
    expect(result.skip).toBe(20);
  });

  test("buildPaginatedResult calculates hasNextPage correctly", () => {
    const result = buildPaginatedResult([], 45, 2, 20);
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPrevPage).toBe(true);
  });

  test("buildPaginatedResult on last page has no next page", () => {
    const result = buildPaginatedResult([], 45, 3, 20);
    expect(result.hasNextPage).toBe(false);
  });
});
