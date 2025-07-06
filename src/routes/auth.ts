import { Router } from 'express';
import { authController } from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { validate, schemas } from '@/middleware/validation';
import { authLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, validate(schemas.register), authController.register);
router.post('/login', authLimiter, validate(schemas.login), authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.use(authenticate);
router.get('/profile', authController.getProfile);
router.put('/profile', validate(schemas.updateProfile), authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.post('/refresh-token', authController.refreshToken);
router.delete('/account', authController.deleteAccount);

export default router;