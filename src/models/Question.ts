import mongoose, { Schema } from 'mongoose';
import { IQuestion } from '@/types';

const questionSchema = new Schema<IQuestion>({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['lastword', 'profile', 'post'],
    required: [true, 'Question type is required']
  },
  category: {
    type: String,
    required: [true, 'Question category is required'],
    trim: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  options: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ type: 1 });
questionSchema.index({ category: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ order: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);