import { Document, Types } from 'mongoose';
import { Request } from 'express';

// Base interfaces
export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  graduationYear: number;
  photo?: string;
  quote?: string;
  coverImage?: string;
  campus: Types.ObjectId | ICampus;
  college: Types.ObjectId | ICollege;
  department: Types.ObjectId | IDepartment;
  role: 'graduate' | 'guest' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  profileCompleted: boolean;
  
  // Social links
  socialLinks: {
    telegram?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    snapchat?: string;
    linkedin?: string;
  };
  
  // Privacy settings
  privacySettings: {
    profileVisibility: 'public' | 'department' | 'college' | 'campus' | 'private';
    contactVisibility: 'public' | 'department' | 'college' | 'campus' | 'private';
    commentPermission: 'public' | 'department' | 'college' | 'campus' | 'private';
    excludedUsers: Types.ObjectId[];
  };
  
  // Interactions
  likes: Types.ObjectId[];
  savedProfiles: Types.ObjectId[];
  likedPosts: Types.ObjectId[];
  savedPosts: Types.ObjectId[];
  comments: Types.ObjectId[];
  tags: Types.ObjectId[];
  
  // Statistics
  views: number;
  numberOfLikes: number;
  numberOfComments: number;
  
  // Timestamps
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
  updateLastActive(): Promise<void>;
  toJSON(): any;
}

export interface IPost extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  question: Types.ObjectId | IQuestion;
  answer: string;
  type: 'lastword' | 'question';
  likes: Types.ObjectId[];
  comments: IPostComment[];
  shares: Types.ObjectId[];
  views: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addLike(userId: string): Promise<IPost>;
  removeLike(userId: string): Promise<IPost>;
  addComment(userId: string, text: string): Promise<IPost>;
  incrementViews(): Promise<IPost>;
}

export interface IPostComment {
  user: Types.ObjectId | IUser;
  text: string;
  createdAt: Date;
  _id: Types.ObjectId;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  question: string;
  type: 'lastword' | 'profile' | 'post';
  category: string;
  isRequired: boolean;
  isActive: boolean;
  order: number;
  options?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICampus extends Document {
  _id: Types.ObjectId;
  name: string;
  campusId: string;
  location?: string;
  description?: string;
  searchPoints: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICollege extends Document {
  _id: Types.ObjectId;
  name: string;
  collegeId: string;
  campus: Types.ObjectId | ICampus;
  description?: string;
  searchPoints: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  name: string;
  departmentId: string;
  college: Types.ObjectId | ICollege;
  description?: string;
  searchPoints: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  type: 'like' | 'comment' | 'share' | 'tag' | 'follow' | 'post_like' | 'post_comment';
  fromUser: Types.ObjectId | IUser;
  targetId?: Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITag extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  profile: Types.ObjectId | IUser;
  text: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  reporter: Types.ObjectId | IUser;
  reported: Types.ObjectId | IUser;
  type: 'inappropriate_content' | 'harassment' | 'spam' | 'fake_profile' | 'other';
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: Types.ObjectId | IUser;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request interfaces
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  q?: string;
  campus?: string;
  college?: string;
  department?: string;
  graduationYear?: string;
  role?: 'graduate' | 'guest';
}

export interface PersonalizationData {
  userId: string;
  viewHistory: Types.ObjectId[];
  likeHistory: Types.ObjectId[];
  commentHistory: Types.ObjectId[];
  searchHistory: string[];
  filterHistory: {
    campus?: string;
    college?: string;
    department?: string;
    graduationYear?: number;
  }[];
}

// Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  user: Partial<IUser>;
  token: string;
  refreshToken?: string;
  requiresProfileCompletion?: boolean;
}

export interface ProfileResponse extends Partial<IUser> {
  isLiked: boolean;
  isSaved: boolean;
  canComment: boolean;
  canViewContact: boolean;
  mutualConnections: number;
}

export interface PostResponse extends Partial<IPost> {
  user: Partial<IUser>;
  question: Partial<IQuestion>;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

// Socket interfaces
export interface SocketUser {
  userId: string;
  socketId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface NotificationPayload {
  type: string;
  message: string;
  data?: any;
  userId: string;
  fromUserId?: string;
}

// File upload interfaces
export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// Validation interfaces
export interface RegisterValidation {
  firstName: string;
  lastName: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  graduationYear: number;
  campus: string;
  college: string;
  department: string;
  role: 'graduate' | 'guest';
}

export interface LoginValidation {
  email: string;
  password: string;
}

export interface ProfileUpdateValidation {
  firstName?: string;
  lastName?: string;
  surname?: string;
  quote?: string;
  socialLinks?: {
    telegram?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    snapchat?: string;
    linkedin?: string;
  };
  privacySettings?: {
    profileVisibility?: 'public' | 'department' | 'college' | 'campus' | 'private';
    contactVisibility?: 'public' | 'department' | 'college' | 'campus' | 'private';
    commentPermission?: 'public' | 'department' | 'college' | 'campus' | 'private';
  };
}

// Error interfaces
export interface CustomError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Analytics interfaces
export interface UserAnalytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  profileViews: number;
  postViews: number;
  engagementRate: number;
  topInteractions: {
    type: string;
    count: number;
  }[];
}

export interface SystemAnalytics {
  totalUsers: number;
  totalGraduates: number;
  totalGuests: number;
  totalPosts: number;
  totalInteractions: number;
  activeUsers: number;
  newUsersToday: number;
  topCampuses: {
    name: string;
    userCount: number;
  }[];
  topColleges: {
    name: string;
    userCount: number;
  }[];
  topDepartments: {
    name: string;
    userCount: number;
  }[];
}