import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Audit logging middleware
 * Tracks sensitive operations (create, update, delete) for compliance and debugging
 */
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const sensitiveOperations = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (sensitiveOperations.includes(req.method)) {
    const auditData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: sanitizeBody(req.body), // Remove sensitive fields
    };

    logger.info(`AUDIT: ${req.method} ${req.path}`, auditData);
  }

  next();
};

/**
 * Sanitize request body to remove sensitive information from logs
 */
function sanitizeBody(body: any): any {
  if (!body) return null;

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];
  const sanitized = JSON.parse(JSON.stringify(body));

  const redact = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key in obj) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        redact(obj[key]);
      }
    }
  };

  redact(sanitized);
  return sanitized;
}
