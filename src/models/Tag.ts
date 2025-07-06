import mongoose, { Schema } from 'mongoose';
import { ITag } from '@/types';

const tagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    trim: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Tag category is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
tagSchema.index({ name: 1 });
tagSchema.index({ category: 1 });
tagSchema.index({ isActive: 1 });
tagSchema.index({ usageCount: -1 });

export const Tag = mongoose.model<ITag>('Tag', tagSchema);