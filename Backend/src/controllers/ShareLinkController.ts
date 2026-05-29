import { Request, Response } from 'express';
import ShareLinkService from '../services/ShareLinkService.js';
import ResumeService from '../services/ResumeService.js';
import AnalyticsService from '../services/AnalyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import { UserRequest } from '../config/types.js';

export class ShareLinkController {
  async createShareLink(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const { resumeId } = req.params;
      const resume = await ResumeService.getResumeById(
        resumeId,
        req.user.userId
      );

      if (!resume) {
        sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
        return;
      }

      const shareLink = await ShareLinkService.createShareLink(
        resumeId,
        req.user.userId,
        req.body
      );

      // Track event
      AnalyticsService.trackEvent(
        req.user.userId,
        'share_link_created',
        { resumeId },
        req.ip
      );

      sendSuccess(res, HTTP_STATUS.CREATED, 'Share link created', {
        shareLink,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async getSharedResume(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const shareLink = await ShareLinkService.getShareLink(token);

      if (!shareLink) {
        sendError(res, HTTP_STATUS.NOT_FOUND, 'Share link not found');
        return;
      }

      const resume = await ResumeService.getResumeById(
        shareLink.resumeId.toString()
      );

      if (!resume) {
        sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
        return;
      }

      // Increment view count
      ShareLinkService.incrementViewCount(token);
      ResumeService.incrementViewCount(shareLink.resumeId.toString());

      // Track event
      AnalyticsService.trackEvent(
        shareLink.userId.toString(),
        'share_link_accessed',
        { token, resumeId: shareLink.resumeId.toString() },
        req.ip
      );

      sendSuccess(res, HTTP_STATUS.OK, 'Resume retrieved', {
        resume,
        shareLink,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async disableShareLink(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const { token } = req.params;
      const shareLink = await ShareLinkService.disableShareLink(
        token,
        req.user.userId
      );

      sendSuccess(res, HTTP_STATUS.OK, 'Share link disabled', { shareLink });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }
}

export default new ShareLinkController();
