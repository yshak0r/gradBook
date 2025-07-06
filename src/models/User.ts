import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUser } from '@/types';

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  surname: {
    type: String,
    required: [true, 'Surname is required'],
    trim: true,
    minlength: [2, 'Surname must be at least 2 characters'],
    maxlength: [50, 'Surname cannot exceed 50 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  graduationYear: {
    type: Number,
    required: [true, 'Graduation year is required'],
    min: [1950, 'Graduation year must be after 1950'],
    max: [new Date().getFullYear() + 10, 'Graduation year cannot be more than 10 years in the future']
  },
  photo: {
    type: String,
    default: null
  },
  quote: {
    type: String,
    maxlength: [500, 'Quote cannot exceed 500 characters'],
    trim: true
  },
  coverImage: {
    type: String,
    default: null
  },
  campus: {
    type: Schema.Types.ObjectId,
    ref: 'Campus',
    required: [true, 'Campus is required']
  },
  college: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College is required']
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  role: {
    type: String,
    enum: ['graduate', 'guest'],
    required: [true, 'Role is required'],
    default: 'guest'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  socialLinks: {
    telegram: { type: String, trim: true },
    instagram: { type: String, trim: true },
    tiktok: { type: String, trim: true },
    youtube: { type: String, trim: true },
    snapchat: { type: String, trim: true },
    linkedin: { type: String, trim: true }
  },
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'department', 'college', 'campus', 'private'],
      default: 'public'
    },
    contactVisibility: {
      type: String,
      enum: ['public', 'department', 'college', 'campus', 'private'],
      default: 'department'
    },
    commentPermission: {
      type: String,
      enum: ['public', 'department', 'college', 'campus', 'private'],
      default: 'public'
    },
    excludedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedProfiles: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  likedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  savedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  tags: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  views: {
    type: Number,
    default: 0
  },
  numberOfLikes: {
    type: Number,
    default: 0
  },
  numberOfComments: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ campus: 1, college: 1, department: 1 });
userSchema.index({ graduationYear: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ numberOfLikes: -1 });
userSchema.index({ views: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName} ${this.surname}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate auth token
userSchema.methods.generateAuthToken = function(): string {
  const payload = {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

// Transform output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);