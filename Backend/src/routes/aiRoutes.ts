import { Router } from 'express';
import AIController from '../controllers/AIController.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(aiLimiter);

// Get suggestions for resume
router.post('/suggestions/resume', (req, res) =>
  AIController.getResumesSuggestions(req, res)
);

// Score resume using AI
router.post('/score', (req, res) => AIController.scoreResume(req, res));

// Generate content
router.post('/generate', (req, res) =>
  AIController.generateContent(req, res)
);

export default router;
