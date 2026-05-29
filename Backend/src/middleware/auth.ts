import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import { JwtPayload, UserRequest } from '../config/types.js';

export const authenticate = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = decoded as JwtPayload;
    next();
  } catch (error) {
    sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: UserRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
      return;
    }
    next();
  };
};
