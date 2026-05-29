import { Response } from 'express';
import { ApiResponse } from '../config/types.js';

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): void => {
  const response: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: Record<string, string | string[]>
): void => {
  const response: ApiResponse<null> = {
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};
