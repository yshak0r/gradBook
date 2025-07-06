import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { socketService } from './socketService';
import { logger } from '@/utils/logger';
import { NotificationPayload, IUser, INotification } from '@/types';

class NotificationService {
  
  public async createNotification(data: {
    userId: string;
    type: string;
    fromUserId: string;
    targetId?: string;
    message: string;
  }): Promise<INotification> {
    try {
      const notification = await Notification.create(data);
      
      // Populate the notification
      await notification.populate('fromUser', 'firstName lastName surname username photo');
      
      // Send real-time notification
      const payload: NotificationPayload = {
        type: data.type,
        message: data.message,
        data: notification,
        userId: data.userId,
        fromUserId: data.fromUserId
      };
      
      socketService.sendNotification(payload);
      
      logger.info(`Notification created for user ${data.userId}: ${data.message}`);
      
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  public async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const filter: any = { user: userId };
      if (unreadOnly) {
        filter.isRead = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .populate('fromUser', 'firstName lastName surname username photo')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Notification.countDocuments(filter),
        Notification.countDocuments({ user: userId, isRead: false })
      ]);

      return { notifications, total, unreadCount };
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw error;
    }
  }

  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true }
      );
      
      logger.info(`Notification ${notificationId} marked as read`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  public async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true }
      );
      
      logger.info(`All notifications marked as read for user ${userId}`);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  public async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId
      });
      
      logger.info(`Notification ${notificationId} deleted`);
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Specific notification creators
  public async notifyProfileLike(likedUserId: string, likerUserId: string): Promise<void> {
    const liker = await User.findById(likerUserId).select('firstName lastName surname');
    if (!liker) return;

    await this.createNotification({
      userId: likedUserId,
      type: 'like',
      fromUserId: likerUserId,
      message: `${liker.firstName} ${liker.lastName} liked your profile`
    });
  }

  public async notifyProfileComment(profileUserId: string, commenterUserId: string): Promise<void> {
    const commenter = await User.findById(commenterUserId).select('firstName lastName surname');
    if (!commenter) return;

    await this.createNotification({
      userId: profileUserId,
      type: 'comment',
      fromUserId: commenterUserId,
      message: `${commenter.firstName} ${commenter.lastName} commented on your profile`
    });
  }

  public async notifyPostLike(postOwnerId: string, likerUserId: string, postId: string): Promise<void> {
    const liker = await User.findById(likerUserId).select('firstName lastName surname');
    if (!liker) return;

    await this.createNotification({
      userId: postOwnerId,
      type: 'post_like',
      fromUserId: likerUserId,
      targetId: postId,
      message: `${liker.firstName} ${liker.lastName} liked your post`
    });
  }

  public async notifyPostComment(postOwnerId: string, commenterUserId: string, postId: string): Promise<void> {
    const commenter = await User.findById(commenterUserId).select('firstName lastName surname');
    if (!commenter) return;

    await this.createNotification({
      userId: postOwnerId,
      type: 'post_comment',
      fromUserId: commenterUserId,
      targetId: postId,
      message: `${commenter.firstName} ${commenter.lastName} commented on your post`
    });
  }

  public async notifyUserTag(taggedUserId: string, taggerUserId: string): Promise<void> {
    const tagger = await User.findById(taggerUserId).select('firstName lastName surname');
    if (!tagger) return;

    await this.createNotification({
      userId: taggedUserId,
      type: 'tag',
      fromUserId: taggerUserId,
      message: `${tagger.firstName} ${tagger.lastName} tagged you`
    });
  }

  public async notifyPostShare(postOwnerId: string, sharerUserId: string, postId: string): Promise<void> {
    const sharer = await User.findById(sharerUserId).select('firstName lastName surname');
    if (!sharer) return;

    await this.createNotification({
      userId: postOwnerId,
      type: 'share',
      fromUserId: sharerUserId,
      targetId: postId,
      message: `${sharer.firstName} ${sharer.lastName} shared your post`
    });
  }
}

export const notificationService = new NotificationService();