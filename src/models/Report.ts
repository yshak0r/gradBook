import mongoose, { Schema } from 'mongoose';
import { IReport } from '@/types';

const reportSchema = new Schema<IReport>({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  reported: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reported user is required']
  },
  type: {
    type: String,
    enum: ['inappropriate_content', 'harassment', 'spam', 'fake_profile', 'other'],
    required: [true, 'Report type is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ reported: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);