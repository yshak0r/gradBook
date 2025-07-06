import { Request, Response } from 'express';
import { ResponseHandler } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { ValidationError, NotFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { notificationService } from '@/services/notificationService';

class NotificationController {

  public getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const unreadOnlyBool = unreadOnly === 'true';

    const result = await notificationService.getNotifications(
      currentUserId,
      pageNum,
      limitNum,
      unreadOnlyBool
    );

    ResponseHandler.paginated(res, result.notifications, {
      page: pageNum,
      limit: limitNum,
      total: result.total,
      pages: Math.ceil(result.total / limitNum)
    }, 'Notifications retrieved successfully');
  });

  public getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;

    const result = await notificationService.getNotifications(currentUserId, 1, 1, true);

    ResponseHandler.success(res, { 
      unreadCount: result.unreadCount 
    }, 'Unread count retrieved successfully');
  });

  public markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId!;

    await notificationService.markAsRead(id, currentUserId);

    ResponseHandler.success(res, null, 'Notification marked as read');
  });

  public markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;

    await notificationService.markAllAsRead(currentUserId);

    ResponseHandler.success(res, null, 'All notifications marked as read');
  });

  public deleteNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId!;

    await notificationService.deleteNotification(id, currentUserId);

    ResponseHandler.success(res, null, 'Notification deleted successfully');
  });

  public getNotificationSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;

    // This would typically be stored in user preferences
    // For now, return default settings
    const settings = {
      profileLikes: true,
      profileComments: true,
      postLikes: true,
      postComments: true,
      postShares: true,
      tags: true,
      emailNotifications: false,
      pushNotifications: true
    };

    ResponseHandler.success(res, settings, 'Notification settings retrieved successfully');
  });

  public updateNotificationSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const settings = req.body;

    // This would typically update user preferences in database
    logger.info(`Notification settings updated for user ${currentUserId}:`, settings);

    ResponseHandler.success(res, settings, 'Notification settings updated successfully');
  });
}

export const notificationController = new NotificationController();