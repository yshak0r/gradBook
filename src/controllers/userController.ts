import { Request, Response } from 'express';
import { User } from '@/models/User';
import { Comment } from '@/models/Comment';
import { Tag } from '@/models/Tag';
import { Report } from '@/models/Report';
import { ResponseHandler } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { ValidationError, NotFoundError, AuthorizationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { notificationService } from '@/services/notificationService';
import { personalizationService } from '@/services/personalizationService';

class UserController {
  
  public getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId;

    const user = await User.findById(id)
      .populate('campus college department', 'name')
      .populate('likes', 'firstName lastName surname username photo')
      .populate('savedProfiles', 'firstName lastName surname username photo')
      .populate('tags', 'name category');

    if (!user || !user.isActive) {
      throw new NotFoundError('User not found');
    }

    // Check privacy settings
    const canView = await this.checkProfileVisibility(user, currentUserId);
    if (!canView) {
      throw new AuthorizationError('Profile is private');
    }

    // Increment view count if not own profile
    if (currentUserId && currentUserId !== id) {
      user.views += 1;
      await user.save({ validateBeforeSave: false });
      
      // Update personalization
      await personalizationService.updateUserInteraction(
        currentUserId,
        'view',
        id,
        'user'
      );
    }

    // Check if current user has liked/saved this profile
    const currentUser = currentUserId ? await User.findById(currentUserId) : null;
    const isLiked = currentUser ? currentUser.likes.includes(user._id) : false;
    const isSaved = currentUser ? currentUser.savedProfiles.includes(user._id) : false;

    // Get mutual connections count
    const mutualConnections = currentUser ? 
      await this.getMutualConnectionsCount(currentUser, user) : 0;

    // Check permissions
    const canComment = await this.checkCommentPermission(user, currentUserId);
    const canViewContact = await this.checkContactVisibility(user, currentUserId);

    const profileResponse = {
      ...user.toJSON(),
      isLiked,
      isSaved,
      canComment,
      canViewContact,
      mutualConnections,
      // Hide sensitive info based on permissions
      phoneNumber: canViewContact ? user.phoneNumber : undefined,
      socialLinks: canViewContact ? user.socialLinks : undefined
    };

    ResponseHandler.success(res, profileResponse, 'Profile retrieved successfully');
  });

  public likeProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId!;

    if (id === currentUserId) {
      throw new ValidationError('Cannot like your own profile');
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(id)
    ]);

    if (!targetUser || !targetUser.isActive) {
      throw new NotFoundError('User not found');
    }

    const isAlreadyLiked = currentUser!.likes.includes(targetUser._id);

    if (isAlreadyLiked) {
      // Unlike
      currentUser!.likes = currentUser!.likes.filter(
        likeId => likeId.toString() !== id
      );
      targetUser.numberOfLikes = Math.max(0, targetUser.numberOfLikes - 1);
    } else {
      // Like
      currentUser!.likes.push(targetUser._id);
      targetUser.numberOfLikes += 1;

      // Send notification
      await notificationService.notifyProfileLike(id, currentUserId);
    }

    await Promise.all([
      currentUser!.save(),
      targetUser.save()
    ]);

    ResponseHandler.success(res, {
      isLiked: !isAlreadyLiked,
      likesCount: targetUser.numberOfLikes
    }, isAlreadyLiked ? 'Profile unliked' : 'Profile liked');
  });

  public saveProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId!;

    if (id === currentUserId) {
      throw new ValidationError('Cannot save your own profile');
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(id)
    ]);

    if (!targetUser || !targetUser.isActive) {
      throw new NotFoundError('User not found');
    }

    const isAlreadySaved = currentUser!.savedProfiles.includes(targetUser._id);

    if (isAlreadySaved) {
      // Unsave
      currentUser!.savedProfiles = currentUser!.savedProfiles.filter(
        saveId => saveId.toString() !== id
      );
    } else {
      // Save
      currentUser!.savedProfiles.push(targetUser._id);
    }

    await currentUser!.save();

    ResponseHandler.success(res, {
      isSaved: !isAlreadySaved
    }, isAlreadySaved ? 'Profile unsaved' : 'Profile saved');
  });

  public commentOnProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { text } = req.body;
    const currentUserId = req.userId!;

    if (id === currentUserId) {
      throw new ValidationError('Cannot comment on your own profile');
    }

    const targetUser = await User.findById(id);
    if (!targetUser || !targetUser.isActive) {
      throw new NotFoundError('User not found');
    }

    // Check comment permission
    const canComment = await this.checkCommentPermission(targetUser, currentUserId);
    if (!canComment) {
      throw new AuthorizationError('You cannot comment on this profile');
    }

    // Create comment
    const comment = await Comment.create({
      user: currentUserId,
      profile: id,
      text
    });

    // Add to user's comments
    targetUser.comments.push(comment._id);
    targetUser.numberOfComments += 1;
    await targetUser.save();

    // Send notification
    await notificationService.notifyProfileComment(id, currentUserId);

    // Populate comment for response
    await comment.populate('user', 'firstName lastName surname username photo');

    ResponseHandler.created(res, comment, 'Comment added successfully');
  });

  public getProfileComments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const comments = await Comment.find({ profile: id, isActive: true })
      .populate('user', 'firstName lastName surname username photo')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Comment.countDocuments({ profile: id, isActive: true });

    ResponseHandler.paginated(res, comments, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Comments retrieved successfully');
  });

  public tagUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { tagIds } = req.body;
    const currentUserId = req.userId!;

    if (id === currentUserId) {
      throw new ValidationError('Cannot tag yourself');
    }

    const [targetUser, tags] = await Promise.all([
      User.findById(id),
      Tag.find({ _id: { $in: tagIds }, isActive: true })
    ]);

    if (!targetUser || !targetUser.isActive) {
      throw new NotFoundError('User not found');
    }

    if (tags.length !== tagIds.length) {
      throw new ValidationError('Some tags are invalid');
    }

    // Add tags to user (avoid duplicates)
    const newTags = tagIds.filter((tagId: string) => 
      !targetUser.tags.includes(tagId)
    );

    targetUser.tags.push(...newTags);
    await targetUser.save();

    // Update tag usage count
    await Tag.updateMany(
      { _id: { $in: newTags } },
      { $inc: { usageCount: 1 } }
    );

    // Send notification
    if (newTags.length > 0) {
      await notificationService.notifyUserTag(id, currentUserId);
    }

    ResponseHandler.success(res, { tagsAdded: newTags.length }, 'User tagged successfully');
  });

  public reportUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { type, reason, description } = req.body;
    const currentUserId = req.userId!;

    if (id === currentUserId) {
      throw new ValidationError('Cannot report yourself');
    }

    const targetUser = await User.findById(id);
    if (!targetUser || !targetUser.isActive) {
      throw new NotFoundError('User not found');
    }

    // Check if already reported by this user
    const existingReport = await Report.findOne({
      reporter: currentUserId,
      reported: id,
      status: { $in: ['pending', 'reviewed'] }
    });

    if (existingReport) {
      throw new ValidationError('You have already reported this user');
    }

    const report = await Report.create({
      reporter: currentUserId,
      reported: id,
      type,
      reason,
      description
    });

    logger.info(`User ${currentUserId} reported user ${id} for ${type}`);

    ResponseHandler.created(res, { reportId: report._id }, 'Report submitted successfully');
  });

  public getLikedProfiles = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const user = await User.findById(currentUserId)
      .populate({
        path: 'likes',
        select: 'firstName lastName surname username photo graduationYear campus college department',
        populate: {
          path: 'campus college department',
          select: 'name'
        },
        options: {
          skip: (pageNum - 1) * limitNum,
          limit: limitNum
        }
      });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const total = user.likes.length;

    ResponseHandler.paginated(res, user.likes, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Liked profiles retrieved successfully');
  });

  public getSavedProfiles = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const user = await User.findById(currentUserId)
      .populate({
        path: 'savedProfiles',
        select: 'firstName lastName surname username photo graduationYear campus college department',
        populate: {
          path: 'campus college department',
          select: 'name'
        },
        options: {
          skip: (pageNum - 1) * limitNum,
          limit: limitNum
        }
      });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const total = user.savedProfiles.length;

    ResponseHandler.paginated(res, user.savedProfiles, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Saved profiles retrieved successfully');
  });

  public updatePrivacySettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const { privacySettings } = req.body;

    const user = await User.findByIdAndUpdate(
      currentUserId,
      { privacySettings },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    ResponseHandler.success(res, user.privacySettings, 'Privacy settings updated successfully');
  });

  public getSuggestedUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const { limit = 10 } = req.query;

    const suggestedUsers = await personalizationService.getSuggestedUsers(
      currentUserId,
      parseInt(limit as string)
    );

    ResponseHandler.success(res, suggestedUsers, 'Suggested users retrieved successfully');
  });

  // Helper methods
  private async checkProfileVisibility(user: any, currentUserId?: string): Promise<boolean> {
    if (!currentUserId) {
      return user.privacySettings.profileVisibility === 'public';
    }

    if (user._id.toString() === currentUserId) {
      return true; // Own profile
    }

    const { profileVisibility, excludedUsers } = user.privacySettings;

    // Check if user is excluded
    if (excludedUsers.includes(currentUserId)) {
      return false;
    }

    switch (profileVisibility) {
      case 'public':
        return true;
      case 'private':
        return false;
      case 'department':
      case 'college':
      case 'campus':
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) return false;
        
        if (profileVisibility === 'campus') {
          return user.campus.toString() === currentUser.campus.toString();
        }
        if (profileVisibility === 'college') {
          return user.college.toString() === currentUser.college.toString();
        }
        if (profileVisibility === 'department') {
          return user.department.toString() === currentUser.department.toString();
        }
        return false;
      default:
        return false;
    }
  }

  private async checkCommentPermission(user: any, currentUserId?: string): Promise<boolean> {
    if (!currentUserId) return false;

    if (user._id.toString() === currentUserId) {
      return false; // Cannot comment on own profile
    }

    const { commentPermission, excludedUsers } = user.privacySettings;

    // Check if user is excluded
    if (excludedUsers.includes(currentUserId)) {
      return false;
    }

    switch (commentPermission) {
      case 'public':
        return true;
      case 'private':
        return false;
      case 'department':
      case 'college':
      case 'campus':
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) return false;
        
        if (commentPermission === 'campus') {
          return user.campus.toString() === currentUser.campus.toString();
        }
        if (commentPermission === 'college') {
          return user.college.toString() === currentUser.college.toString();
        }
        if (commentPermission === 'department') {
          return user.department.toString() === currentUser.department.toString();
        }
        return false;
      default:
        return false;
    }
  }

  private async checkContactVisibility(user: any, currentUserId?: string): Promise<boolean> {
    if (!currentUserId) return false;

    if (user._id.toString() === currentUserId) {
      return true; // Own profile
    }

    const { contactVisibility, excludedUsers } = user.privacySettings;

    // Check if user is excluded
    if (excludedUsers.includes(currentUserId)) {
      return false;
    }

    switch (contactVisibility) {
      case 'public':
        return true;
      case 'private':
        return false;
      case 'department':
      case 'college':
      case 'campus':
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) return false;
        
        if (contactVisibility === 'campus') {
          return user.campus.toString() === currentUser.campus.toString();
        }
        if (contactVisibility === 'college') {
          return user.college.toString() === currentUser.college.toString();
        }
        if (contactVisibility === 'department') {
          return user.department.toString() === currentUser.department.toString();
        }
        return false;
      default:
        return false;
    }
  }

  private async getMutualConnectionsCount(user1: any, user2: any): Promise<number> {
    const mutualLikes = user1.likes.filter((like: any) => 
      user2.likes.includes(like)
    );
    return mutualLikes.length;
  }
}

export const userController = new UserController();