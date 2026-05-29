import { Router } from 'express';
import FeedbackController from '../controllers/FeedbackController.js';

const router = Router();

router.post('/', (req, res) => FeedbackController.createFeedback(req, res));

export default router;
