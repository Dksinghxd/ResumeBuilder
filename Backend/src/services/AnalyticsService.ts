import AnalyticsModel from '../models/Analytics.js';
import logger from '../utils/logger.js';

export class AnalyticsService {
  async trackEvent(
    userId: string,
    action: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const event = new AnalyticsModel({
        userId,
        action,
        metadata,
        ipAddress,
        userAgent,
      });

      await event.save();
      logger.debug('Event tracked', { userId, action });
    } catch (error) {
      logger.error('Event tracking failed', { userId, action });
    }
  }

  async getUserDashboardAnalytics(userId: string) {
    try {
      const analytics = await AnalyticsModel.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return analytics;
    } catch (error) {
      logger.error('Dashboard analytics fetch failed', { userId });
      throw error;
    }
  }

  async getSystemAnalytics(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await AnalyticsModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              action: '$action',
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': -1 } },
      ]);

      return analytics;
    } catch (error) {
      logger.error('System analytics fetch failed');
      throw error;
    }
  }

  async getResumeAnalytics(resumeId: string) {
    try {
      const analytics = await AnalyticsModel.aggregate([
        { $match: { resumeId: resumeId } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
      ]);

      return analytics;
    } catch (error) {
      logger.error('Resume analytics fetch failed', { resumeId });
      throw error;
    }
  }
}

export default new AnalyticsService();
