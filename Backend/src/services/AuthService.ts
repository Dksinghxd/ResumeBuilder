import mongoose from 'mongoose';
import crypto from 'crypto';
import UserModel from '../models/User.js';
import { IUser } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import logger from '../utils/logger.js';

export class AuthService {
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<{
    user: Omit<IUser, 'password'>;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = new UserModel({
        ...userData,
        password: hashedPassword,
      });

      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
      });

      logger.info('User registered', { email: userData.email });

      return {
        user: user.toJSON() as unknown as Omit<IUser, 'password'>,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{
    user: Omit<IUser, 'password'>;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const user = await UserModel.findOne({ email }).select('+password');

      if (!user || !(await comparePassword(password, user.password))) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
      });

      logger.info('User logged in', { email });

      return {
        user: user.toJSON() as unknown as Omit<IUser, 'password'>,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login failed', { email });
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid user id in token', { userId });
      return null;
    }
    return UserModel.findById(userId);
  }

  async refreshSession(refreshToken: string): Promise<{
    user: Omit<IUser, 'password'>;
    accessToken: string;
    refreshToken: string;
  }> {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      throw new Error('Invalid refresh token');
    }

    const nextAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const nextRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return {
      user: user.toJSON() as unknown as Omit<IUser, 'password'>,
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    };
  }

  async requestPasswordReset(email: string): Promise<{ resetToken?: string }> {
    const user = await UserModel.findOne({ email }).select(
      '+passwordResetToken +passwordResetExpires'
    );

    if (!user) {
      return {};
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    logger.info('Password reset requested', { email });
    return process.env.NODE_ENV === 'production' ? {} : { resetToken: rawToken };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new Error('Password reset token is invalid or expired');
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  }

  async updateProfile(
    userId: string,
    updates: Partial<IUser>
  ): Promise<IUser | null> {
    try {
      return await UserModel.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      logger.error('Profile update failed', { userId });
      throw error;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await UserModel.findById(userId).select('+password');

      if (!user || !(await comparePassword(currentPassword, user.password))) {
        throw new Error('Invalid current password');
      }

      user.password = await hashPassword(newPassword);
      await user.save();

      logger.info('Password changed', { userId });
    } catch (error) {
      logger.error('Password change failed', { userId });
      throw error;
    }
  }
}

export default new AuthService();
