import { Request, Response } from 'express';
import { User } from '@/models/User';
import { Campus } from '@/models/Campus';
import { College } from '@/models/College';
import { Department } from '@/models/Department';
import { Post } from '@/models/Post';
import { ResponseHandler } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { personalizationService } from '@/services/personalizationService';

class SearchController {

  public searchUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      q,
      campus,
      college,
      department,
      graduationYear,
      role,
      page = 1,
      limit = 20,
      sort = 'recent',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Build search filter
    const filter: any = { isActive: true };

    // Text search
    if (q) {
      const searchRegex = new RegExp(q as string, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { surname: searchRegex },
        { username: searchRegex }
      ];
    }

    // Academic filters
    if (campus) filter.campus = campus;
    if (college) filter.college = college;
    if (department) filter.department = department;
    if (graduationYear) filter.graduationYear = parseInt(graduationYear as string);
    if (role) filter.role = role;

    // Build sort options
    let sortOptions: any = {};
    switch (sort) {
      case 'name':
        sortOptions = { firstName: order === 'desc' ? -1 : 1 };
        break;
      case 'likes':
        sortOptions = { numberOfLikes: order === 'desc' ? -1 : 1 };
        break;
      case 'views':
        sortOptions = { views: order === 'desc' ? -1 : 1 };
        break;
      case 'recent':
      default:
        sortOptions = { createdAt: order === 'desc' ? -1 : 1 };
        break;
    }

    // Execute search
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('campus college department', 'name')
        .select('firstName lastName surname username photo graduationYear numberOfLikes views campus college department role')
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);

    // Update search points for academic entities
    if (campus) {
      await Campus.findByIdAndUpdate(campus, { $inc: { searchPoints: 1 } });
    }
    if (college) {
      await College.findByIdAndUpdate(college, { $inc: { searchPoints: 1 } });
    }
    if (department) {
      await Department.findByIdAndUpdate(department, { $inc: { searchPoints: 1 } });
    }

    logger.info(`Search performed: query="${q}", filters=${JSON.stringify({ campus, college, department, graduationYear, role })}, results=${users.length}`);

    ResponseHandler.paginated(res, users, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Search results retrieved successfully');
  });

  public searchPosts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      q,
      type,
      campus,
      college,
      department,
      page = 1,
      limit = 20,
      sort = 'recent'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Build search filter
    const filter: any = { isActive: true };

    if (type) filter.type = type;

    // Build user filter for academic filtering
    const userFilter: any = { isActive: true };
    if (campus) userFilter.campus = campus;
    if (college) userFilter.college = college;
    if (department) userFilter.department = department;

    // Get users matching academic criteria
    let userIds: string[] = [];
    if (campus || college || department) {
      const users = await User.find(userFilter).select('_id');
      userIds = users.map(user => user._id.toString());
      filter.user = { $in: userIds };
    }

    // Text search in answers
    if (q) {
      filter.answer = new RegExp(q as string, 'i');
    }

    // Build sort options
    let sortOptions: any = {};
    switch (sort) {
      case 'likes':
        sortOptions = { likes: -1 };
        break;
      case 'views':
        sortOptions = { views: -1 };
        break;
      case 'comments':
        sortOptions = { comments: -1 };
        break;
      case 'recent':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Execute search
    const [posts, total] = await Promise.all([
      Post.find(filter)
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
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Post.countDocuments(filter)
    ]);

    ResponseHandler.paginated(res, posts, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Post search results retrieved successfully');
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

  public getSearchFilters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Get all campuses with their colleges and departments
    const campuses = await Campus.find({ isActive: true })
      .sort({ searchPoints: -1, name: 1 })
      .select('name campusId');

    const colleges = await College.find({ isActive: true })
      .populate('campus', 'name')
      .sort({ searchPoints: -1, name: 1 })
      .select('name collegeId campus');

    const departments = await Department.find({ isActive: true })
      .populate('college', 'name')
      .sort({ searchPoints: -1, name: 1 })
      .select('name departmentId college');

    // Get graduation years range
    const graduationYears = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, min: { $min: '$graduationYear' }, max: { $max: '$graduationYear' } } }
    ]);

    const yearRange = graduationYears[0] || { min: new Date().getFullYear() - 10, max: new Date().getFullYear() + 5 };

    const filters = {
      campuses,
      colleges,
      departments,
      graduationYears: {
        min: yearRange.min,
        max: yearRange.max
      },
      roles: ['graduate', 'guest'],
      sortOptions: [
        { value: 'recent', label: 'Most Recent' },
        { value: 'name', label: 'Name (A-Z)' },
        { value: 'likes', label: 'Most Liked' },
        { value: 'views', label: 'Most Viewed' }
      ]
    };

    ResponseHandler.success(res, filters, 'Search filters retrieved successfully');
  });

  public getPopularSearches = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { limit = 10 } = req.query;

    const [popularCampuses, popularColleges, popularDepartments] = await Promise.all([
      Campus.find({ isActive: true })
        .sort({ searchPoints: -1 })
        .limit(parseInt(limit as string))
        .select('name searchPoints'),
      College.find({ isActive: true })
        .populate('campus', 'name')
        .sort({ searchPoints: -1 })
        .limit(parseInt(limit as string))
        .select('name searchPoints campus'),
      Department.find({ isActive: true })
        .populate('college', 'name')
        .sort({ searchPoints: -1 })
        .limit(parseInt(limit as string))
        .select('name searchPoints college')
    ]);

    const popularSearches = {
      campuses: popularCampuses,
      colleges: popularColleges,
      departments: popularDepartments
    };

    ResponseHandler.success(res, popularSearches, 'Popular searches retrieved successfully');
  });

  public getQuickSearch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { q, limit = 5 } = req.query;

    if (!q || (q as string).length < 2) {
      return ResponseHandler.success(res, { users: [], posts: [] }, 'Quick search results');
    }

    const searchRegex = new RegExp(q as string, 'i');

    // Search users
    const users = await User.find({
      isActive: true,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { surname: searchRegex },
        { username: searchRegex }
      ]
    })
    .select('firstName lastName surname username photo')
    .limit(parseInt(limit as string));

    // Search posts
    const posts = await Post.find({
      isActive: true,
      answer: searchRegex
    })
    .populate('user', 'firstName lastName surname username photo')
    .populate('question', 'question')
    .select('answer user question')
    .limit(parseInt(limit as string));

    ResponseHandler.success(res, { users, posts }, 'Quick search results retrieved successfully');
  });

  public getRecentSearches = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    
    // This would typically be stored in a separate search history collection
    // For now, return empty array as placeholder
    const recentSearches: any[] = [];

    ResponseHandler.success(res, recentSearches, 'Recent searches retrieved successfully');
  });

  public saveSearch = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const { query, filters } = req.body;

    // This would typically save to a search history collection
    // For now, just log the search
    logger.info(`Search saved for user ${currentUserId}: query="${query}", filters=${JSON.stringify(filters)}`);

    ResponseHandler.success(res, null, 'Search saved successfully');
  });
}

export const searchController = new SearchController();