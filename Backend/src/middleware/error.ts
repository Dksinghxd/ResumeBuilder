import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import logger from '../utils/logger.js';

interface ErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  errors?: Record<string, unknown>;
  timestamp: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: string = ERROR_MESSAGES.INTERNAL_ERROR
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode =
    error instanceof AppError
      ? error.statusCode
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message =
    error instanceof AppError ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;

  logger.error('Error occurred', {
    statusCode,
    message,
    stack: error.stack,
  });

  const response: ErrorResponse = {
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  _req: Request,
  res: Response
): void => {
  const response: ErrorResponse = {
    success: false,
    statusCode: HTTP_STATUS.NOT_FOUND,
    message: ERROR_MESSAGES.NOT_FOUND,
    timestamp: new Date().toISOString(),
  };

  res.status(HTTP_STATUS.NOT_FOUND).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
