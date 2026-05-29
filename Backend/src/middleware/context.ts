import express, { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

interface ContextualRequest extends Request {
  id: string;
  startTime: number;
  userId?: string;
  userEmail?: string;
}

/**
 * Request context middleware
 * Adds a unique request ID and tracks request duration
 */
export const requestContext = (req: ContextualRequest, res: Response, next: NextFunction) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();

  // Extract user info if authenticated
  if ((req as any).user) {
    req.userId = (req as any).user.id;
    req.userEmail = (req as any).user.email;
  }

  // Intercept response to log it
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - req.startTime;
    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId,
      userEmail: req.userEmail,
      ip: req.ip,
    };

    // Log successful requests
    if (res.statusCode < 400) {
      logger.info(`API Request: ${req.method} ${req.path}`, logData);
    } else if (res.statusCode < 500) {
      logger.warn(`Client Error: ${req.method} ${req.path}`, logData);
    } else {
      logger.error(`Server Error: ${req.method} ${req.path}`, logData);
    }

    return originalSend.call(this, data);
  };

  next();
};
