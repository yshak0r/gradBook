import { Router } from 'express';
import { userController } from '@/controllers/userController';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { validate, validateParams, schemas } from '@/middleware/validation';
import { likeLimiter, commentLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Public routes (with optional auth)
router.get('/:id', optionalAuth, validateParams(schemas.objectId), userController.getProfile);
router.get('/:id/comments', validateParams(schemas.objectId), userController.getProfileComments);

// Protected routes
router.use(authenticate);

// Profile interactions
router.post('/:id/like', likeLimiter, validateParams(schemas.objectId), userController.likeProfile);
router.post('/:id/save', validateParams(schemas.objectId), userController.saveProfile);
router.post('/:id/comment', commentLimiter, validateParams(schemas.objectId), validate(schemas.addComment), userController.commentOnProfile);
router.post('/:id/tag', validateParams(schemas.objectId), validate(schemas.tagUser), userController.tagUser);
router.post('/:id/report', validateParams(schemas.objectId), validate(schemas.createReport), userController.reportUser);

// User's own data
router.get('/me/liked', userController.getLikedProfiles);
router.get('/me/saved', userController.getSavedProfiles);
router.get('/me/suggested', userController.getSuggestedUsers);

// Settings
router.put('/me/privacy', validate(schemas.privacySettings), userController.updatePrivacySettings);

export default router;