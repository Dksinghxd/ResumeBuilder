import { Request, Response } from 'express';
import ResumeService from '../services/ResumeService.js';
import PDFService from '../services/PDFService.js';
import AnalyticsService from '../services/AnalyticsService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/index.js';
import { UserRequest } from '../config/types.js';

export class ResumeController {
  async createResume(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const resume = await ResumeService.createResume(req.user.userId, req.body);

      // Track event
      AnalyticsService.trackEvent(
        req.user.userId,
        'resume_created',
        { resumeId: resume._id.toString() },
        req.ip
      );

      sendSuccess(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.RESUME_CREATED, {
        resume,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async getResume(req: UserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const resume = await ResumeService.getResumeById(id, req.user?.userId);

      if (!resume) {
        sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
        return;
      }

      // Increment view count
      ResumeService.incrementViewCount(id);

      sendSuccess(res, HTTP_STATUS.OK, 'Resume retrieved', { resume });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async getUserResumes(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const { page, limit } = req.query;
      const result = await ResumeService.getUserResumes(
        req.user.userId,
        page as string,
        limit as string
      );

      sendSuccess(res, HTTP_STATUS.OK, 'Resumes retrieved', result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async updateResume(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      const resume = await ResumeService.updateResume(
        id,
        req.user.userId,
        req.body
      );

      // Track event
      AnalyticsService.trackEvent(
        req.user.userId,
        'resume_updated',
        { resumeId: id },
        req.ip
      );

      sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.RESUME_UPDATED, {
        resume,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async deleteResume(req: UserRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }

      const { id } = req.params;
      await ResumeService.deleteResume(id, req.user.userId);

      // Track event
      AnalyticsService.trackEvent(
        req.user.userId,
        'resume_deleted',
        { resumeId: id },
        req.ip
      );

      sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.RESUME_DELETED);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async scoreResume(req: UserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const resume = await ResumeService.getResumeById(id);

      if (!resume) {
        sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
        return;
      }

      const score = await ResumeService.scoreResume(id);

      sendSuccess(res, HTTP_STATUS.OK, 'Resume scored', { score });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async generatePDF(req: UserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const resume = await ResumeService.getResumeById(id, req.user?.userId);

      if (!resume) {
        sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
        return;
      }

      const pdfStream = await PDFService.generatePDFStream(resume);

      // Track event
      if (req.user) {
        AnalyticsService.trackEvent(
          req.user.userId,
          'pdf_generated',
          { resumeId: id },
          req.ip
        );
        ResumeService.incrementDownloadCount(id);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${resume.title}.pdf"`
      );

      pdfStream.pipe(res);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }
}

export default new ResumeController();
