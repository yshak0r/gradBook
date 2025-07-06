import mongoose, { Schema } from 'mongoose';
import { IDepartment } from '@/types';

const departmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  departmentId: {
    type: String,
    required: [true, 'Department ID is required'],
    unique: true,
    trim: true
  },
  college: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College is required']
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
departmentSchema.index({ name: 1 });
departmentSchema.index({ departmentId: 1 });
departmentSchema.index({ college: 1 });
departmentSchema.index({ searchPoints: -1 });
departmentSchema.index({ isActive: 1 });

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);