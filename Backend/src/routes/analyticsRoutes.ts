import { Router } from 'express';
import AnalyticsController from '../controllers/AnalyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard analytics
router.get('/dashboard', (req, res) =>
  AnalyticsController.getDashboardAnalytics(req, res)
);

// Get resume analytics
router.get('/resumes/:resumeId', (req, res) =>
  AnalyticsController.getResumeAnalytics(req, res)
);

// Track event
router.post('/track', (req, res) => AnalyticsController.trackEvent(req, res));

export default router;
