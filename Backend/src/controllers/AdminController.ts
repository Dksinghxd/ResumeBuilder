import { Request, Response } from 'express';
import UserModel from '../models/User.js';
import AnalyticsService from '../services/AnalyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import { UserRequest } from '../config/types.js';

export class AdminController {
  async getAllUsers(req: UserRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const skip = (pageNum - 1) * limitNum;

      const users = await UserModel.find()
        .skip(skip)
        .limit(limitNum)
        .select('-password');

      const total = await UserModel.countDocuments();

      sendSuccess(res, HTTP_STATUS.OK, 'Users retrieved', {
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async getSystemAnalytics(req: UserRequest, res: Response): Promise<void> {
    try {
      const { days = '30' } = req.query;
      const daysNum = parseInt(days as string) || 30;

      const analytics = await AnalyticsService.getSystemAnalytics(daysNum);

      sendSuccess(res, HTTP_STATUS.OK, 'System analytics retrieved', {
        analytics,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async updateUser(req: UserRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role, status } = req.body;

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { role, status },
        { new: true }
      ).select('-password');

      if (!user) {
        sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
        return;
      }

      sendSuccess(res, HTTP_STATUS.OK, 'User updated', { user });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async deleteUser(req: UserRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await UserModel.findByIdAndDelete(userId);

      if (!user) {
        sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
        return;
      }

      sendSuccess(res, HTTP_STATUS.OK, 'User deleted');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }
}

export default new AdminController();
