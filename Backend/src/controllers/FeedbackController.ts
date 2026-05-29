import { Request, Response } from 'express';
import FeedbackModel from '../models/Feedback.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import logger from '../utils/logger.js';

class FeedbackController {
  async createFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, type = 'suggestion', message } = req.body;

      if (!name || !email || !message) {
        sendError(res, HTTP_STATUS.BAD_REQUEST, 'Name, email, and message are required');
        return;
      }

      const feedback = await FeedbackModel.create({
        name,
        email,
        type,
        message,
      });

      logger.info('Feedback submitted', { feedbackId: feedback._id, type });
      sendSuccess(res, HTTP_STATUS.CREATED, 'Feedback submitted', { feedback });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }
}

export default new FeedbackController();
