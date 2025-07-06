import { Request, Response } from 'express';
import { Post } from '@/models/Post';
import { Question } from '@/models/Question';
import { User } from '@/models/User';
import { ResponseHandler } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { ValidationError, NotFoundError, AuthorizationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { notificationService } from '@/services/notificationService';
import { personalizationService } from '@/services/personalizationService';

class PostController {

  public createPost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { questionId, answer, type = 'question' } = req.body;
    const currentUserId = req.userId!;

    // Verify question exists and is active
    const question = await Question.findOne({ _id: questionId, isActive: true });
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Check if user is a graduate (only graduates can post)
    const user = await User.findById(currentUserId);
    if (!user || user.role !== 'graduate') {
      throw new AuthorizationError('Only graduates can create posts');
    }

    // Create post
    const post = await Post.create({
      user: currentUserId,
      question: questionId,
      answer: answer.trim(),
      type
    });

    // Populate for response
    await post.populate([
      {
        path: 'user',
        select: 'firstName lastName surname username photo campus college department'
      },
      {
        path: 'question',
        select: 'question type category'
      }
    ]);

    logger.info(`Post created by user ${currentUserId}: ${post._id}`);

    ResponseHandler.created(res, post, 'Post created successfully');
  });

  public getPosts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId;
    const { page = 1, limit = 20, type, userId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Build filter
    const filter: any = { isActive: true };
    if (type) filter.type = type;
    if (userId) filter.user = userId;

    let posts;
    let total;

    if (currentUserId && !userId) {
      // Get personalized feed for authenticated users
      const personalizedResult = await personalizationService.getPersonalizedFeed(
        currentUserId,
        pageNum,
        limitNum
      );
      posts = personalizedResult.posts;
      total = personalizedResult.total;
    } else {
      // Get regular posts
      posts = await Post.find(filter)
        .populate([
          {
            path: 'user',
            select: 'firstName lastName surname username photo campus college department'
          },
          {
            path: 'question',
            select: 'question type category'
          }
        ])
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      total = await Post.countDocuments(filter);
    }

    // Add interaction flags for authenticated users
    if (currentUserId) {
      const user = await User.findById(currentUserId);
      posts = posts.map((post: any) => ({
        ...post.toJSON(),
        isLiked: post.likes.includes(currentUserId),
        isSaved: user?.savedPosts.includes(post._id) || false,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        sharesCount: post.shares.length
      }));
    }

    ResponseHandler.paginated(res, posts, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Posts retrieved successfully');
  });

  public getPost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId;

    const post = await Post.findOne({ _id: id, isActive: true })
      .populate([
        {
          path: 'user',
          select: 'firstName lastName surname username photo campus college department'
        },
        {
          path: 'question',
          select: 'question type category'
        },
        {
          path: 'comments.user',
          select: 'firstName lastName surname username photo'
        }
      ]);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Increment view count
    if (currentUserId && post.user._id.toString() !== currentUserId) {
      await post.incrementViews();
      
      // Update personalization
      await personalizationService.updateUserInteraction(
        currentUserId,
        'view',
        id,
        'post'
      );
    }

    // Add interaction flags for authenticated users
    let postResponse = post.toJSON();
    if (currentUserId) {
      const user = await User.findById(currentUserId);
      postResponse = {
        ...postResponse,
        isLiked: post.likes.includes(currentUserId),
        isSaved: user?.savedPosts.includes(post._id) || false,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        sharesCount: post.shares.length
      };
    }

    ResponseHandler.success(res, postResponse, 'Post retrieved successfully');
  });

  public likePost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId!;

    const post = await Post.findOne({ _id: id, isActive: true });
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.user.toString() === currentUserId) {
      throw new ValidationError('Cannot like your own post');
    }

    const isAlreadyLiked = post.likes.includes(currentUserId);

    if (isAlreadyLiked) {
      // Unlike
      await post.removeLike(currentUserId);
    } else {
      // Like
      await post.addLike(currentUserId);
      
      // Send notification to post owner
      await notificationService.notifyPostLike(
        post.user.toString(),
        currentUserId,
        id
      );

      // Update personalization
      await personalizationService.updateUserInteraction(
        currentUserId,
        'like',
        id,
        'post'
      );
    }

    ResponseHandler.success(res, {
      isLiked: !isAlreadyLiked,
      likesCount: post.likes.length
    }, isAlreadyLiked ? 'Post unliked' : 'Post liked');
  });

  public savePost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId!;

    const [post, user] = await Promise.all([
      Post.findOne({ _id: id, isActive: true }),
      User.findById(currentUserId)
    ]);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isAlreadySaved = user.savedPosts.includes(post._id);

    if (isAlreadySaved) {
      // Unsave
      user.savedPosts = user.savedPosts.filter(
        postId => postId.toString() !== id
      );
    } else {
      // Save
      user.savedPosts.push(post._id);
    }

    await user.save();

    ResponseHandler.success(res, {
      isSaved: !isAlreadySaved
    }, isAlreadySaved ? 'Post unsaved' : 'Post saved');
  });

  public commentOnPost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { text } = req.body;
    const currentUserId = req.userId!;

    const post = await Post.findOne({ _id: id, isActive: true });
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Add comment
    await post.addComment(currentUserId, text.trim());

    // Send notification to post owner (if not commenting on own post)
    if (post.user.toString() !== currentUserId) {
      await notificationService.notifyPostComment(
        post.user.toString(),
        currentUserId,
        id
      );
    }

    // Update personalization
    await personalizationService.updateUserInteraction(
      currentUserId,
      'comment',
      id,
      'post'
    );

    // Get the newly added comment with populated user
    const updatedPost = await Post.findById(id)
      .populate('comments.user', 'firstName lastName surname username photo');
    
    const newComment = updatedPost!.comments[updatedPost!.comments.length - 1];

    ResponseHandler.created(res, newComment, 'Comment added successfully');
  });

  public sharePost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId!;

    const post = await Post.findOne({ _id: id, isActive: true });
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.user.toString() === currentUserId) {
      throw new ValidationError('Cannot share your own post');
    }

    const isAlreadyShared = post.shares.includes(currentUserId);
    if (isAlreadyShared) {
      throw new ValidationError('Post already shared');
    }

    // Add to shares
    post.shares.push(currentUserId);
    await post.save();

    // Send notification to post owner
    await notificationService.notifyPostShare(
      post.user.toString(),
      currentUserId,
      id
    );

    // Update personalization
    await personalizationService.updateUserInteraction(
      currentUserId,
      'share',
      id,
      'post'
    );

    ResponseHandler.success(res, {
      sharesCount: post.shares.length
    }, 'Post shared successfully');
  });

  public deletePost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const currentUserId = req.userId!;

    const post = await Post.findOne({ _id: id, isActive: true });
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Check if user owns the post
    if (post.user.toString() !== currentUserId) {
      throw new AuthorizationError('You can only delete your own posts');
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    logger.info(`Post ${id} deleted by user ${currentUserId}`);

    ResponseHandler.success(res, null, 'Post deleted successfully');
  });

  public getUserPosts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Verify user exists
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundError('User not found');
    }

    const filter: any = { user: userId, isActive: true };
    if (type) filter.type = type;

    const posts = await Post.find(filter)
      .populate([
        {
          path: 'user',
          select: 'firstName lastName surname username photo'
        },
        {
          path: 'question',
          select: 'question type category'
        }
      ])
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Post.countDocuments(filter);

    ResponseHandler.paginated(res, posts, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'User posts retrieved successfully');
  });

  public getSavedPosts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const user = await User.findById(currentUserId)
      .populate({
        path: 'savedPosts',
        match: { isActive: true },
        populate: [
          {
            path: 'user',
            select: 'firstName lastName surname username photo'
          },
          {
            path: 'question',
            select: 'question type category'
          }
        ],
        options: {
          sort: { createdAt: -1 },
          skip: (pageNum - 1) * limitNum,
          limit: limitNum
        }
      });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const total = user.savedPosts.length;

    ResponseHandler.paginated(res, user.savedPosts, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Saved posts retrieved successfully');
  });

  public getLikedPosts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const user = await User.findById(currentUserId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const posts = await Post.find({
      _id: { $in: user.likedPosts },
      isActive: true
    })
    .populate([
      {
        path: 'user',
        select: 'firstName lastName surname username photo'
      },
      {
        path: 'question',
        select: 'question type category'
      }
    ])
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

    const total = user.likedPosts.length;

    ResponseHandler.paginated(res, posts, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Liked posts retrieved successfully');
  });

  public getPopularPosts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { timeframe = 'week', limit = 20 } = req.query;

    const posts = await personalizationService.getPopularContent(
      timeframe as 'day' | 'week' | 'month',
      parseInt(limit as string)
    );

    ResponseHandler.success(res, posts, 'Popular posts retrieved successfully');
  });

  public getLastWords = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Get last words (posts with type 'lastword')
    const posts = await Post.find({
      type: 'lastword',
      isActive: true
    })
    .populate([
      {
        path: 'user',
        select: 'firstName lastName surname username photo campus college department'
      },
      {
        path: 'question',
        select: 'question type category'
      }
    ])
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

    const total = await Post.countDocuments({ type: 'lastword', isActive: true });

    // Add interaction flags for authenticated users
    let postsWithFlags = posts;
    if (currentUserId) {
      const user = await User.findById(currentUserId);
      postsWithFlags = posts.map((post: any) => ({
        ...post.toJSON(),
        isLiked: post.likes.includes(currentUserId),
        isSaved: user?.savedPosts.includes(post._id) || false,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        sharesCount: post.shares.length
      }));
    }

    ResponseHandler.paginated(res, postsWithFlags, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Last words retrieved successfully');
  });
}

export const postController = new PostController();