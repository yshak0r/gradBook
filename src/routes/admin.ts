import { Router } from 'express';
import { adminController } from '@/controllers/adminController';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateParams, schemas } from '@/middleware/validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
// Note: You'll need to add admin role to your user schema and authorization
// For now, we'll assume all authenticated users can access admin routes
// router.use(authorize('admin'));

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/deactivate', validateParams(schemas.objectId), adminController.deactivateUser);
router.put('/users/:userId/activate', validateParams(schemas.objectId), adminController.activateUser);

// Report management
router.get('/reports', adminController.getReports);
router.put('/reports/:reportId/review', validateParams(schemas.objectId), adminController.reviewReport);

// Question management
router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.createQuestion);
router.put('/questions/:questionId', validateParams(schemas.objectId), adminController.updateQuestion);
router.delete('/questions/:questionId', validateParams(schemas.objectId), adminController.deleteQuestion);

// Tag management
router.get('/tags', adminController.getTags);
router.post('/tags', adminController.createTag);
router.put('/tags/:tagId', validateParams(schemas.objectId), adminController.updateTag);
router.delete('/tags/:tagId', validateParams(schemas.objectId), adminController.deleteTag);

// Academic structure management
router.post('/campuses', adminController.createCampus);
router.post('/colleges', adminController.createCollege);
router.post('/departments', adminController.createDepartment);

// Analytics
router.get('/analytics', adminController.getAnalytics);

export default router;