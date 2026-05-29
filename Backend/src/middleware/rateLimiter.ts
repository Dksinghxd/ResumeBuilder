import rateLimit from 'express-rate-limit';
import config from '../config/environment.js';

// Helper to identify if request is from localhost or loopback
const isLocalOrDevelopment = (req: any): boolean => {
  const ip = req.ip || req.connection?.remoteAddress || '';
  const isLocal = 
    ip === '127.0.0.1' || 
    ip === '::1' || 
    ip === '::ffff:127.0.0.1' || 
    ip.startsWith('127.');
  
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'development' ||
    isLocal
  );
};

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs * 60 * 1000,
  max: config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalOrDevelopment,
});

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalOrDevelopment,
});

// Limiter for PDF generation (more expensive operation)
export const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many PDF generation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalOrDevelopment,
});

// Limiter for AI suggestions
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many AI requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalOrDevelopment,
});
