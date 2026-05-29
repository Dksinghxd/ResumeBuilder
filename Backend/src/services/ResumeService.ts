import ResumeModel from '../models/Resume.js';
import { IResume } from '../models/Resume.js';
import logger from '../utils/logger.js';
import { parsePagination, calculatePaginationMetadata } from '../utils/pagination.js';

export class ResumeService {
  async createResume(
    userId: string,
    resumeData: Partial<IResume>
  ): Promise<IResume> {
    try {
      const resume = new ResumeModel({
        ...resumeData,
        userId,
      });

      await resume.save();
      logger.info('Resume created', { userId, resumeId: resume._id });
      return resume;
    } catch (error) {
      logger.error('Resume creation failed', { userId });
      throw error;
    }
  }

  async getResumeById(resumeId: string, userId?: string): Promise<IResume | null> {
    try {
      const resume = await ResumeModel.findById(resumeId);

      if (resume && userId && resume.userId.toString() !== userId) {
        throw new Error('Unauthorized access');
      }

      return resume;
    } catch (error) {
      logger.error('Resume fetch failed', { resumeId });
      throw error;
    }
  }

  async getUserResumes(userId: string, page?: string, limit?: string) {
    try {
      const { skip, limit: pageLimit, page: pageNum } = parsePagination(
        page,
        limit
      );

      const resumes = await ResumeModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean();

      const total = await ResumeModel.countDocuments({ userId });
      const pagination = calculatePaginationMetadata(total, pageLimit, pageNum);

      return { data: resumes, pagination };
    } catch (error) {
      logger.error('Resumes fetch failed', { userId });
      throw error;
    }
  }

  async updateResume(
    resumeId: string,
    userId: string,
    updates: Partial<IResume>
  ): Promise<IResume | null> {
    try {
      const resume = await ResumeModel.findByIdAndUpdate(
        { _id: resumeId, userId },
        updates,
        { new: true, runValidators: true }
      );

      if (!resume) {
        throw new Error('Resume not found or unauthorized');
      }

      logger.info('Resume updated', { resumeId, userId });
      return resume;
    } catch (error) {
      logger.error('Resume update failed', { resumeId, userId });
      throw error;
    }
  }

  async deleteResume(resumeId: string, userId: string): Promise<void> {
    try {
      const result = await ResumeModel.deleteOne({ _id: resumeId, userId });

      if (result.deletedCount === 0) {
        throw new Error('Resume not found or unauthorized');
      }

      logger.info('Resume deleted', { resumeId, userId });
    } catch (error) {
      logger.error('Resume deletion failed', { resumeId, userId });
      throw error;
    }
  }

  async incrementViewCount(resumeId: string): Promise<void> {
    try {
      await ResumeModel.findByIdAndUpdate(
        resumeId,
        { $inc: { viewCount: 1 } }
      );
    } catch (error) {
      logger.error('View count increment failed', { resumeId });
    }
  }

  async incrementDownloadCount(resumeId: string): Promise<void> {
    try {
      await ResumeModel.findByIdAndUpdate(
        resumeId,
        { $inc: { downloadCount: 1 } }
      );
    } catch (error) {
      logger.error('Download count increment failed', { resumeId });
    }
  }

  async scoreResume(resumeId: string): Promise<number> {
    try {
      const resume = await ResumeModel.findById(resumeId);
      if (!resume) {
        throw new Error('Resume not found');
      }

      let score = 0;

      // Score calculation logic
      if (resume.personalInfo.summary) score += 10;
      if (resume.experience && resume.experience.length > 0) score += 25;
      if (resume.education && resume.education.length > 0) score += 20;
      if (resume.skills && resume.skills.length > 0) score += 20;
      if (resume.certifications && resume.certifications.length > 0) score += 10;
      if (resume.projects && resume.projects.length > 0) score += 10;
      if (resume.socialLinks && resume.socialLinks.length > 0) score += 5;

      resume.score = Math.min(score, 100);
      await resume.save();

      logger.info('Resume scored', { resumeId, score: resume.score });
      return resume.score;
    } catch (error) {
      logger.error('Resume scoring failed', { resumeId });
      throw error;
    }
  }
}

export default new ResumeService();
