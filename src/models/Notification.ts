import mongoose, { Schema } from 'mongoose';
import { INotification } from '@/types';

const notificationSchema = new Schema<INotification>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'share', 'tag', 'follow', 'post_like', 'post_comment'],
    required: [true, 'Notification type is required']
  },
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'From user is required']
  },
  targetId: {
    type: Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);