import { Request, Response } from 'express';
import { validateRequest } from '../middleware/validation.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import AuthService from '../services/AuthService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/index.js';
import { UserRequest } from '../config/types.js';
import AnalyticsService from '../services/AnalyticsService.js';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.register(req.body);

      sendSuccess(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.USER_CREATED, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      // Track login event
      AnalyticsService.trackEvent(
        result.user._id!.toString(),
        'login',
        { email },
        req.ip
      );

      sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESS, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.UNAUTHORIZED, message);
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        sendError(res, HTTP_STATUS.BAD_REQUEST, 'Refresh token is required');
        return;
      }

      const result = await AuthService.refreshSession(refreshToken);
      sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.TOKEN_REFRESHED, result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INVALID_TOKEN;
      sendError(res, HTTP_STATUS.UNAUTHORIZED, message);
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email is required');
        return;
      }

      const result = await AuthService.requestPasswordReset(email);
      sendSuccess(res, HTTP_STATUS.OK, 'Password reset instructions sent', result);
    } catch (error) {
      sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        sendError(res, HTTP_STATUS.BAD_REQUEST, 'Token and new password are required');
        return;
      }

      await AuthService.resetPassword(token, newPassword);
      sendSuccess(res, HTTP_STATUS.OK, 'Password reset successful');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async logout(req: UserRequest, res: Response): Promise<void> {
    try {
      if (req.user) {
        AnalyticsService.trackEvent(
          req.user.userId,
          'logout',
          {},
          req.ip
        );
      }

      sendSuccess(res, HTTP_STATUS.OK, 'Logout successful');
    } catch (error) {
      sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
    }
  }

  async verifyToken(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);

      sendSuccess(res, HTTP_STATUS.OK, 'Token verified', { user });
    } catch (error) {
      sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
    }
  }

  async getProfile(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);

      if (!user) {
        sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
        return;
      }

      sendSuccess(res, HTTP_STATUS.OK, 'Profile retrieved', { user });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
    }
  }

  async updateProfile(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const user = await AuthService.updateProfile(req.user.userId, req.body);

      sendSuccess(res, HTTP_STATUS.OK, 'Profile updated', { user });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async changePassword(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      sendSuccess(res, HTTP_STATUS.OK, 'Password changed successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }
}

export default new AuthController();
