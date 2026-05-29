import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Enhanced input validation utilities
 * Provides validation rules for common input types
 */

export interface ValidationRule {
  field: string;
  type: 'string' | 'email' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean | Promise<boolean>;
}

export class ValidationError extends Error {
  constructor(public errors: { field: string; message: string }[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

/**
 * Validate input against a set of rules
 */
export const validateInput = async (
  data: any,
  rules: ValidationRule[]
): Promise<{ field: string; message: string }[]> => {
  const errors: { field: string; message: string }[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: rule.field, message: `${rule.field} is required` });
      continue;
    }

    if (value === undefined || value === null) continue;

    // Check type
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({ field: rule.field, message: `${rule.field} must be a string` });
          break;
        }
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.minLength} characters` });
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({ field: rule.field, message: `${rule.field} must be at most ${rule.maxLength} characters` });
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({ field: rule.field, message: `${rule.field} has invalid format` });
        }
        break;

      case 'email':
        if (typeof value !== 'string') {
          errors.push({ field: rule.field, message: `${rule.field} must be a string` });
          break;
        }
        // RFC 5322 simplified
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push({ field: rule.field, message: `${rule.field} must be a valid email` });
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({ field: rule.field, message: `${rule.field} must be a number` });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({ field: rule.field, message: `${rule.field} must be a boolean` });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({ field: rule.field, message: `${rule.field} must be an array` });
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push({ field: rule.field, message: `${rule.field} must be an object` });
        }
        break;
    }

    // Custom validator
    if (rule.customValidator) {
      try {
        const isValid = await rule.customValidator(value);
        if (!isValid) {
          errors.push({ field: rule.field, message: `${rule.field} validation failed` });
        }
      } catch (err) {
        logger.error(`Custom validator error for ${rule.field}`, err);
        errors.push({ field: rule.field, message: `${rule.field} validation error` });
      }
    }
  }

  return errors;
};

/**
 * Middleware factory for request body validation
 */
export const validateBody = (rules: ValidationRule[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = await validateInput(req.body, rules);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }
      return next();
    } catch (err) {
      logger.error('Validation middleware error', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};

/**
 * Middleware factory for query parameter validation
 */
export const validateQuery = (rules: ValidationRule[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = await validateInput(req.query, rules);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors,
        });
      }
      return next();
    } catch (err) {
      logger.error('Query validation middleware error', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};

/**
 * Sanitization: Remove dangerous characters from strings
 */
export const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/["']/g, '') // Remove quotes
    .replace(/[\\]/g, '') // Remove backslashes
    .trim();
};

/**
 * Sanitization: Ensure a string is safe for SQL (basic)
 */
export const sanitizeSQL = (str: string): string => {
  return str
    .replace(/['";\\]/g, '\\$&') // Escape special characters
    .trim();
};
