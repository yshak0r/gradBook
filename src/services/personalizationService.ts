import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { logger } from '@/utils/logger';
import { PersonalizationData, IUser, IPost } from '@/types';

class PersonalizationService {
  
  public async getPersonalizedFeed(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    posts: IPost[];
    total: number;
    algorithm: string;
  }> {
    try {
      const user = await User.findById(userId)
        .populate('campus college department likes likedPosts');
      
      if (!user) {
        throw new Error('User not found');
      }

      let posts: IPost[] = [];
      let algorithm = 'default';

      // For new users or guests, show department/college content
      if (user.likes.length === 0 && user.likedPosts.length === 0) {
        posts = await this.getNewUserFeed(user, page, limit);
        algorithm = 'new_user';
      } else {
        // For active users, use personalization
        posts = await this.getPersonalizedContent(user, page, limit);
        algorithm = 'personalized';
      }

      const total = await this.getTotalPersonalizedCount(user);

      logger.info(`Generated ${algorithm} feed for user ${userId}: ${posts.length} posts`);

      return { posts, total, algorithm };
    } catch (error) {
      logger.error('Error generating personalized feed:', error);
      throw error;
    }
  }

  private async getNewUserFeed(
    user: IUser,
    page: number,
    limit: number
  ): Promise<IPost[]> {
    // For new users, prioritize content from their academic circle
    const posts = await Post.find({
      isActive: true,
      user: { $ne: user._id }
    })
    .populate({
      path: 'user',
      match: {
        $or: [
          { department: user.department },
          { college: user.college },
          { campus: user.campus }
        ]
      },
      select: 'firstName lastName surname username photo department college campus'
    })
    .populate('question', 'question type category')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    return posts.filter(post => post.user); // Filter out posts where user didn't match
  }

  private async getPersonalizedContent(
    user: IUser,
    page: number,
    limit: number
  ): Promise<IPost[]> {
    // Get users that the current user has interacted with
    const interactedUserIds = [
      ...user.likes,
      ...user.likedPosts.map((post: any) => post.user)
    ];

    // Find similar users based on interactions
    const similarUsers = await User.find({
      _id: { $ne: user._id },
      $or: [
        { likes: { $in: user.likes } },
        { likedPosts: { $in: user.likedPosts } },
        { department: user.department },
        { college: user.college }
      ]
    }).select('_id likes likedPosts');

    // Get posts from similar users and their liked content
    const recommendedUserIds = similarUsers.map(u => u._id);
    const recommendedPostIds = similarUsers.flatMap(u => u.likedPosts);

    const posts = await Post.find({
      isActive: true,
      $or: [
        { user: { $in: recommendedUserIds } },
        { _id: { $in: recommendedPostIds } },
        { user: { $in: interactedUserIds } }
      ],
      user: { $ne: user._id },
      _id: { $nin: user.likedPosts }
    })
    .populate('user', 'firstName lastName surname username photo department college campus')
    .populate('question', 'question type category')
    .sort({ 
      createdAt: -1,
      likes: -1,
      views: -1
    })
    .skip((page - 1) * limit)
    .limit(limit);

    return posts;
  }

  public async getSuggestedUsers(
    userId: string,
    limit: number = 10
  ): Promise<IUser[]> {
    try {
      const user = await User.findById(userId)
        .populate('likes department college campus');
      
      if (!user) {
        throw new Error('User not found');
      }

      // Get users liked by people the current user likes (collaborative filtering)
      const likedUsers = await User.find({ _id: { $in: user.likes } })
        .select('likes')
        .limit(20);

      const secondDegreeLikes = likedUsers.flatMap(u => u.likes);
      
      // Get users from same academic background
      const academicSimilarUsers = await User.find({
        _id: { 
          $ne: userId,
          $nin: user.likes
        },
        $or: [
          { department: user.department },
          { college: user.college },
          { campus: user.campus }
        ],
        isActive: true,
        role: 'graduate'
      }).select('firstName lastName surname username photo graduationYear department college campus numberOfLikes');

      // Combine and score users
      const suggestedUsers = await User.find({
        _id: {
          $in: [...secondDegreeLikes, ...academicSimilarUsers.map(u => u._id)],
          $ne: userId,
          $nin: user.likes
        },
        isActive: true
      })
      .populate('department college campus', 'name')
      .select('firstName lastName surname username photo graduationYear numberOfLikes')
      .sort({ numberOfLikes: -1 })
      .limit(limit);

      logger.info(`Generated ${suggestedUsers.length} suggested users for ${userId}`);

      return suggestedUsers;
    } catch (error) {
      logger.error('Error getting suggested users:', error);
      throw error;
    }
  }

  public async updateUserInteraction(
    userId: string,
    interactionType: 'view' | 'like' | 'comment' | 'share',
    targetId: string,
    targetType: 'user' | 'post'
  ): Promise<void> {
    try {
      // Update interaction history for better personalization
      // This could be stored in a separate analytics collection
      logger.info(`User ${userId} ${interactionType}d ${targetType} ${targetId}`);
      
      // Update user's interaction patterns
      if (targetType === 'user' && interactionType === 'view') {
        await User.findByIdAndUpdate(targetId, { $inc: { views: 1 } });
      }
    } catch (error) {
      logger.error('Error updating user interaction:', error);
    }
  }

  private async getTotalPersonalizedCount(user: IUser): Promise<number> {
    // This is a simplified count - in production, you'd want to cache this
    return Post.countDocuments({
      isActive: true,
      user: { $ne: user._id }
    });
  }

  public async getPopularContent(
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit: number = 20
  ): Promise<IPost[]> {
    const timeMap = {
      day: 1,
      week: 7,
      month: 30
    };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeMap[timeframe]);

    const posts = await Post.find({
      isActive: true,
      createdAt: { $gte: startDate }
    })
    .populate('user', 'firstName lastName surname username photo')
    .populate('question', 'question type category')
    .sort({ 
      likes: -1,
      views: -1,
      comments: -1
    })
    .limit(limit);

    return posts;
  }
}

export const personalizationService = new PersonalizationService();