import ShareLinkModel from '../models/ShareLink.js';
import { generateShareToken } from '../utils/generators.js';
import logger from '../utils/logger.js';

export class ShareLinkService {
  async createShareLink(
    resumeId: string,
    userId: string,
    options: {
      expiresIn?: string;
      allowDownload?: boolean;
      allowComments?: boolean;
    }
  ) {
    try {
      const token = generateShareToken();
      let expiresAt: Date | undefined;

      if (options.expiresIn && options.expiresIn !== 'never') {
        const days = parseInt(options.expiresIn);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      const shareLink = new ShareLinkModel({
        resumeId,
        userId,
        token,
        expiresAt,
        allowDownload: options.allowDownload ?? true,
        allowComments: options.allowComments ?? false,
      });

      await shareLink.save();
      logger.info('Share link created', { resumeId, userId, token });
      return shareLink;
    } catch (error) {
      logger.error('Share link creation failed', { resumeId, userId });
      throw error;
    }
  }

  async getShareLink(token: string) {
    try {
      const shareLink = await ShareLinkModel.findOne({ token, isActive: true });

      if (!shareLink) {
        throw new Error('Share link not found or expired');
      }

      if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
        shareLink.isActive = false;
        await shareLink.save();
        throw new Error('Share link has expired');
      }

      return shareLink;
    } catch (error) {
      logger.error('Share link retrieval failed', { token });
      throw error;
    }
  }

  async incrementViewCount(token: string) {
    try {
      await ShareLinkModel.findOneAndUpdate(
        { token },
        { $inc: { viewCount: 1 } }
      );
    } catch (error) {
      logger.error('View count increment failed', { token });
    }
  }

  async disableShareLink(token: string, userId: string) {
    try {
      const shareLink = await ShareLinkModel.findOneAndUpdate(
        { token, userId },
        { isActive: false },
        { new: true }
      );

      if (!shareLink) {
        throw new Error('Share link not found');
      }

      logger.info('Share link disabled', { token, userId });
      return shareLink;
    } catch (error) {
      logger.error('Share link disable failed', { token, userId });
      throw error;
    }
  }
}

export default new ShareLinkService();
