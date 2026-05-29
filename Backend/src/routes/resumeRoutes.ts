import { Router } from 'express';
import ResumeController from '../controllers/ResumeController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import {
  createResumeSchema,
  updateResumeSchema,
} from '../validators/resume.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create resume
router.post(
  '/',
  validateRequest(createResumeSchema),
  (req, res) => ResumeController.createResume(req, res)
);

// Get all resumes for user
router.get('/', apiLimiter, (req, res) =>
  ResumeController.getUserResumes(req, res)
);

// Get specific resume
router.get('/:id', (req, res) => ResumeController.getResume(req, res));

// Update resume
router.put(
  '/:id',
  validateRequest(updateResumeSchema),
  (req, res) => ResumeController.updateResume(req, res)
);

// Delete resume
router.delete('/:id', (req, res) => ResumeController.deleteResume(req, res));

// Score resume
router.post('/:id/score', (req, res) => ResumeController.scoreResume(req, res));

// Generate PDF
router.post('/:id/pdf', (req, res) =>
  ResumeController.generatePDF(req, res)
);

export default router;
