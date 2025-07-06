import mongoose, { Schema } from 'mongoose';
import { IPost, IPostComment } from '@/types';

const postCommentSchema = new Schema<IPostComment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new Schema<IPost>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question is required']
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['lastword', 'question'],
    required: [true, 'Post type is required'],
    default: 'question'
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [postCommentSchema],
  shares: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
postSchema.index({ user: 1 });
postSchema.index({ question: 1 });
postSchema.index({ type: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ isActive: 1 });
postSchema.index({ 'likes': 1 });
postSchema.index({ views: -1 });

// Virtual for likes count
postSchema.virtual('likesCount').get(function() {
  return this.likes?.length || 0;
});

// Virtual for comments count
postSchema.virtual('commentsCount').get(function() {
  return this.comments?.length || 0;
});

// Virtual for shares count
postSchema.virtual('sharesCount').get(function() {
  return this.shares?.length || 0;
});

// Method to add like
postSchema.methods.addLike = function(userId: string) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }
  return this.save();
};

// Method to remove like
postSchema.methods.removeLike = function(userId: string) {
  this.likes = this.likes.filter((id: any) => id.toString() !== userId);
  return this.save();
};

// Method to add comment
postSchema.methods.addComment = function(userId: string, text: string) {
  this.comments.push({ user: userId, text });
  return this.save();
};

// Method to increment views
postSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

export const Post = mongoose.model<IPost>('Post', postSchema);