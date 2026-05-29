import { Router } from 'express';
import AdminController from '../controllers/AdminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use((req, res, next) => {
  authorize('admin')(req as any, res, next);
});

// Get all users
router.get('/users', (req, res) => AdminController.getAllUsers(req, res));

// Get system analytics
router.get('/analytics', (req, res) =>
  AdminController.getSystemAnalytics(req, res)
);

// Update user
router.put('/users/:userId', (req, res) =>
  AdminController.updateUser(req, res)
);

// Delete user
router.delete('/users/:userId', (req, res) =>
  AdminController.deleteUser(req, res)
);

export default router;
