import { Router } from 'express';
import ShareLinkController from '../controllers/ShareLinkController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { shareResumeSchema } from '../validators/resume.js';

const router = Router();

// Create share link (requires authentication)
router.post(
  '/resumes/:resumeId/share',
  authenticate,
  validateRequest(shareResumeSchema),
  (req, res) => ShareLinkController.createShareLink(req, res)
);

// Get shared resume (public route)
router.get('/share/:token', (req, res) =>
  ShareLinkController.getSharedResume(req, res)
);

// Disable share link (requires authentication)
router.delete(
  '/share/:token',
  authenticate,
  (req, res) => ShareLinkController.disableShareLink(req, res)
);

export default router;
