import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateId = (): string => {
  return uuidv4();
};

export const generateShareToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateRefreshTokenString = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
};
