import { Router } from 'express';
import { notificationController } from '@/controllers/notificationController';
import { authenticate } from '@/middleware/auth';
import { validateParams, validateQuery, schemas } from '@/middleware/validation';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', validateQuery(schemas.pagination), notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', validateParams(schemas.objectId), notificationController.markAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:id', validateParams(schemas.objectId), notificationController.deleteNotification);

// Notification settings
router.get('/settings', notificationController.getNotificationSettings);
router.put('/settings', notificationController.updateNotificationSettings);

export default router;