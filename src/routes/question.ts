import { Router } from 'express';
import { questionController } from '@/controllers/questionController';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateParams, schemas } from '@/middleware/validation';

const router = Router();

// Public routes
router.get('/', questionController.getQuestions);
router.get('/type/:type', questionController.getQuestionsByType);
router.get('/category/:category', questionController.getQuestionsByCategory);
router.get('/required', questionController.getRequiredQuestions);
router.get('/random', questionController.getRandomQuestions);
router.get('/categories', questionController.getQuestionCategories);
router.get('/:id', validateParams(schemas.objectId), questionController.getQuestion);

// Admin routes (would be moved to admin routes in production)
router.use(authenticate);
router.use(authorize('admin')); // This would need admin role implementation

router.post('/', questionController.createQuestion);
router.put('/:id', validateParams(schemas.objectId), questionController.updateQuestion);
router.delete('/:id', validateParams(schemas.objectId), questionController.deleteQuestion);

export default router;