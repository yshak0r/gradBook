import mongoose, { Schema } from 'mongoose';
import { ICollege } from '@/types';

const collegeSchema = new Schema<ICollege>({
  name: {
    type: String,
    required: [true, 'College name is required'],
    trim: true
  },
  collegeId: {
    type: String,
    required: [true, 'College ID is required'],
    unique: true,
    trim: true
  },
  campus: {
    type: Schema.Types.ObjectId,
    ref: 'Campus',
    required: [true, 'Campus is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  searchPoints: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
collegeSchema.index({ name: 1 });
collegeSchema.index({ collegeId: 1 });
collegeSchema.index({ campus: 1 });
collegeSchema.index({ searchPoints: -1 });
collegeSchema.index({ isActive: 1 });

export const College = mongoose.model<ICollege>('College', collegeSchema);