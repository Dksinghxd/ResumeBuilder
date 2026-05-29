export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (
  page?: string | number,
  limit?: string | number,
  maxLimit: number = 100
): PaginationOptions => {
  let pageNum = 1;
  let limitNum = 20;

  if (page) {
    pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  }

  if (limit) {
    limitNum = Math.min(
      maxLimit,
      Math.max(1, parseInt(String(limit), 10) || 20)
    );
  }

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
};

export const calculatePaginationMetadata = (
  total: number,
  limit: number,
  page: number
) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
