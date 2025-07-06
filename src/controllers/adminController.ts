import { Request, Response } from 'express';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { Report } from '@/models/Report';
import { Question } from '@/models/Question';
import { Tag } from '@/models/Tag';
import { Campus } from '@/models/Campus';
import { College } from '@/models/College';
import { Department } from '@/models/Department';
import { ResponseHandler } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { NotFoundError, AuthorizationError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';

class AdminController {

  // User Management
  public getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 20, role, status, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const filter: any = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { username: searchRegex },
        { email: searchRegex }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('campus college department', 'name')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);

    ResponseHandler.paginated(res, users, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Users retrieved successfully');
  });

  public deactivateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.isActive = false;
    await user.save();

    logger.info(`User ${userId} deactivated by admin ${req.userId}. Reason: ${reason}`);

    ResponseHandler.success(res, null, 'User deactivated successfully');
  });

  public activateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.isActive = true;
    await user.save();

    logger.info(`User ${userId} activated by admin ${req.userId}`);

    ResponseHandler.success(res, null, 'User activated successfully');
  });

  // Report Management
  public getReports = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 20, status, type } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'firstName lastName username')
        .populate('reported', 'firstName lastName username')
        .populate('reviewedBy', 'firstName lastName username')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Report.countDocuments(filter)
    ]);

    ResponseHandler.paginated(res, reports, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Reports retrieved successfully');
  });

  public reviewReport = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { reportId } = req.params;
    const { status, action } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    report.status = status;
    report.reviewedBy = req.userId!;
    report.reviewedAt = new Date();
    await report.save();

    // Take action if needed
    if (action === 'deactivate_user') {
      await User.findByIdAndUpdate(report.reported, { isActive: false });
    }

    logger.info(`Report ${reportId} reviewed by admin ${req.userId}. Status: ${status}, Action: ${action}`);

    ResponseHandler.success(res, report, 'Report reviewed successfully');
  });

  // Question Management
  public getQuestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, category, isActive } = req.query;

    const filter: any = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const questions = await Question.find(filter)
      .sort({ order: 1, createdAt: -1 });

    ResponseHandler.success(res, questions, 'Questions retrieved successfully');
  });

  public createQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { question, type, category, isRequired, options, order } = req.body;

    const newQuestion = await Question.create({
      question,
      type,
      category,
      isRequired,
      options,
      order
    });

    logger.info(`Question created by admin ${req.userId}: ${newQuestion._id}`);

    ResponseHandler.created(res, newQuestion, 'Question created successfully');
  });

  public updateQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { questionId } = req.params;
    const updates = req.body;

    const question = await Question.findByIdAndUpdate(
      questionId,
      updates,
      { new: true, runValidators: true }
    );

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    logger.info(`Question ${questionId} updated by admin ${req.userId}`);

    ResponseHandler.success(res, question, 'Question updated successfully');
  });

  public deleteQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { questionId } = req.params;

    const question = await Question.findByIdAndUpdate(
      questionId,
      { isActive: false },
      { new: true }
    );

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    logger.info(`Question ${questionId} deleted by admin ${req.userId}`);

    ResponseHandler.success(res, null, 'Question deleted successfully');
  });

  // Tag Management
  public getTags = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category, isActive } = req.query;

    const filter: any = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const tags = await Tag.find(filter)
      .sort({ usageCount: -1, name: 1 });

    ResponseHandler.success(res, tags, 'Tags retrieved successfully');
  });

  public createTag = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, description, category } = req.body;

    const existingTag = await Tag.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      throw new ValidationError('Tag already exists');
    }

    const tag = await Tag.create({
      name: name.toLowerCase(),
      description,
      category
    });

    logger.info(`Tag created by admin ${req.userId}: ${tag._id}`);

    ResponseHandler.created(res, tag, 'Tag created successfully');
  });

  public updateTag = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { tagId } = req.params;
    const updates = req.body;

    const tag = await Tag.findByIdAndUpdate(
      tagId,
      updates,
      { new: true, runValidators: true }
    );

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    logger.info(`Tag ${tagId} updated by admin ${req.userId}`);

    ResponseHandler.success(res, tag, 'Tag updated successfully');
  });

  public deleteTag = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { tagId } = req.params;

    const tag = await Tag.findByIdAndUpdate(
      tagId,
      { isActive: false },
      { new: true }
    );

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    logger.info(`Tag ${tagId} deleted by admin ${req.userId}`);

    ResponseHandler.success(res, null, 'Tag deleted successfully');
  });

  // Academic Structure Management
  public createCampus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, campusId, location, description } = req.body;

    const campus = await Campus.create({
      name,
      campusId,
      location,
      description
    });

    logger.info(`Campus created by admin ${req.userId}: ${campus._id}`);

    ResponseHandler.created(res, campus, 'Campus created successfully');
  });

  public createCollege = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, collegeId, campus, description } = req.body;

    const college = await College.create({
      name,
      collegeId,
      campus,
      description
    });

    logger.info(`College created by admin ${req.userId}: ${college._id}`);

    ResponseHandler.created(res, college, 'College created successfully');
  });

  public createDepartment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, departmentId, college, description } = req.body;

    const department = await Department.create({
      name,
      departmentId,
      college,
      description
    });

    logger.info(`Department created by admin ${req.userId}: ${department._id}`);

    ResponseHandler.created(res, department, 'Department created successfully');
  });

  // Analytics
  public getAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const [
      totalUsers,
      totalGraduates,
      totalGuests,
      totalPosts,
      totalReports,
      activeUsers,
      newUsersToday
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, role: 'graduate' }),
      User.countDocuments({ isActive: true, role: 'guest' }),
      Post.countDocuments({ isActive: true }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ 
        isActive: true, 
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }),
      User.countDocuments({ 
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get top campuses by user count
    const topCampuses = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$campus', userCount: { $sum: 1 } } },
      { $lookup: { from: 'campuses', localField: '_id', foreignField: '_id', as: 'campus' } },
      { $unwind: '$campus' },
      { $project: { name: '$campus.name', userCount: 1 } },
      { $sort: { userCount: -1 } },
      { $limit: 5 }
    ]);

    const analytics = {
      totalUsers,
      totalGraduates,
      totalGuests,
      totalPosts,
      totalReports,
      activeUsers,
      newUsersToday,
      topCampuses
    };

    ResponseHandler.success(res, analytics, 'Analytics retrieved successfully');
  });
}

export const adminController = new AdminController();