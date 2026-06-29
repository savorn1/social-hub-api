import { PaginatedResult } from '../interfaces/paginated-result.interface';

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function getPaginationParams(
  page = 1,
  limit = 20,
): { skip: number; take: number } {
  const take = Math.min(limit, 100);
  const skip = (page - 1) * take;
  return { skip, take };
}
