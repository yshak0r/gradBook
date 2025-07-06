import mongoose, { Schema } from 'mongoose';
import { IComment } from '@/types';

const commentSchema = new Schema<IComment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Profile is required']
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ profile: 1 });
commentSchema.index({ user: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ isActive: 1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);