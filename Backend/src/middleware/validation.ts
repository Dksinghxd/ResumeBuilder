import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

export const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors: Record<string, string[]> = {};
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        if (!errors[key]) {
          errors[key] = [];
        }
        errors[key].push(detail.message);
      });

      sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.VALIDATION_FAILED,
        errors
      );
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQueryParams = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors: Record<string, string[]> = {};
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        if (!errors[key]) {
          errors[key] = [];
        }
        errors[key].push(detail.message);
      });

      sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.VALIDATION_FAILED,
        errors
      );
      return;
    }

    req.query = value as any;
    next();
  };
};
