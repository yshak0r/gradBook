import { Router } from 'express';
import { postController } from '@/controllers/postController';
import { authenticate, optionalAuth, authorize } from '@/middleware/auth';
import { validate, validateParams, validateQuery, schemas } from '@/middleware/validation';
import { likeLimiter, commentLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Public routes (with optional auth for personalization)
router.get('/', optionalAuth, validateQuery(schemas.pagination), postController.getPosts);
router.get('/popular', validateQuery(schemas.pagination), postController.getPopularPosts);
router.get('/lastwords', optionalAuth, validateQuery(schemas.pagination), postController.getLastWords);
router.get('/user/:userId', validateParams(schemas.objectId), postController.getUserPosts);
router.get('/:id', optionalAuth, validateParams(schemas.objectId), postController.getPost);

// Protected routes
router.use(authenticate);

// Post creation (graduates only)
router.post('/', authorize('graduate'), validate(schemas.createPost), postController.createPost);

// Post interactions
router.post('/:id/like', likeLimiter, validateParams(schemas.objectId), postController.likePost);
router.post('/:id/save', validateParams(schemas.objectId), postController.savePost);
router.post('/:id/comment', commentLimiter, validateParams(schemas.objectId), validate(schemas.addComment), postController.commentOnPost);
router.post('/:id/share', validateParams(schemas.objectId), postController.sharePost);

// Post management
router.delete('/:id', validateParams(schemas.objectId), postController.deletePost);

// User's post collections
router.get('/me/saved', postController.getSavedPosts);
router.get('/me/liked', postController.getLikedPosts);

export default router;