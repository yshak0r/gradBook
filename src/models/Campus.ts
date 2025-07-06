import mongoose, { Schema } from 'mongoose';
import { ICampus } from '@/types';

const campusSchema = new Schema<ICampus>({
  name: {
    type: String,
    required: [true, 'Campus name is required'],
    trim: true,
    unique: true
  },
  campusId: {
    type: String,
    required: [true, 'Campus ID is required'],
    unique: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
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
campusSchema.index({ name: 1 });
campusSchema.index({ campusId: 1 });
campusSchema.index({ searchPoints: -1 });
campusSchema.index({ isActive: 1 });

export const Campus = mongoose.model<ICampus>('Campus', campusSchema);