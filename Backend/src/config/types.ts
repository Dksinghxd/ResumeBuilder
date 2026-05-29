import type { Request } from 'express';

interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: Record<string, string | string[]>;
  timestamp: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

interface UserRequest extends Request {
  user?: JwtPayload;
}

export {
  PaginationQuery,
  PaginationResult,
  ApiResponse,
  JwtPayload,
  UserRequest,
};
