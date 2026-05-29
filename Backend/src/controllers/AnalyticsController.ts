import { Request, Response } from 'express';
import AnalyticsService from '../services/AnalyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import { UserRequest } from '../config/types.js';

export class AnalyticsController {
  async getDashboardAnalytics(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const analytics = await AnalyticsService.getUserDashboardAnalytics(
        req.user.userId
      );

      sendSuccess(res, HTTP_STATUS.OK, 'Dashboard analytics retrieved', {
        analytics,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async getResumeAnalytics(req: UserRequest, res: Response): Promise<void> {
    try {
      const { resumeId } = req.params;
      const analytics = await AnalyticsService.getResumeAnalytics(resumeId);

      sendSuccess(res, HTTP_STATUS.OK, 'Resume analytics retrieved', {
        analytics,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async trackEvent(req: Request, res: Response): Promise<void> {
    try {
      const { userId, action, metadata } = req.body;

      AnalyticsService.trackEvent(userId, action, metadata, req.ip);

      sendSuccess(res, HTTP_STATUS.OK, 'Event tracked');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }
}

export default new AnalyticsController();
