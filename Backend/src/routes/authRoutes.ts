import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../validators/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  validateRequest(registerSchema),
  (req, res) => AuthController.register(req, res)
);

router.post(
  '/login',
  authLimiter,
  validateRequest(loginSchema),
  (req, res) => AuthController.login(req, res)
);

router.post('/refresh', authLimiter, (req, res) =>
  AuthController.refresh(req, res)
);

router.post('/forgot-password', authLimiter, (req, res) =>
  AuthController.forgotPassword(req, res)
);

router.post('/reset-password', authLimiter, (req, res) =>
  AuthController.resetPassword(req, res)
);

// Protected routes
router.get('/verify', authenticate, (req, res) =>
  AuthController.verifyToken(req, res)
);

router.get('/profile', authenticate, (req, res) =>
  AuthController.getProfile(req, res)
);

router.put('/profile', authenticate, (req, res) =>
  AuthController.updateProfile(req, res)
);

router.post(
  '/change-password',
  authenticate,
  validateRequest(changePasswordSchema),
  (req, res) => AuthController.changePassword(req, res)
);

router.post('/logout', authenticate, (req, res) =>
  AuthController.logout(req, res)
);

export default router;
