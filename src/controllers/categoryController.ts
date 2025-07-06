import { Request, Response } from 'express';
import { Campus } from '@/models/Campus';
import { College } from '@/models/College';
import { Department } from '@/models/Department';
import { User } from '@/models/User';
import { ResponseHandler } from '@/utils/response';
import { NotFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';

class CategoryController {

  public getAllCampuses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const campuses = await Campus.find({ isActive: true })
      .sort({ searchPoints: -1, name: 1 })
      .select('name campusId location description');

    ResponseHandler.success(res, campuses, 'Campuses retrieved successfully');
  });

  public getCampusColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { campusId } = req.params;

    const campus = await Campus.findById(campusId);
    if (!campus || !campus.isActive) {
      throw new NotFoundError('Campus not found');
    }

    const colleges = await College.find({ campus: campusId, isActive: true })
      .sort({ searchPoints: -1, name: 1 })
      .select('name collegeId description');

    ResponseHandler.success(res, {
      campus: {
        name: campus.name,
        campusId: campus.campusId
      },
      colleges
    }, 'Campus colleges retrieved successfully');
  });

  public getCollegeDepartments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { collegeId } = req.params;

    const college = await College.findById(collegeId).populate('campus', 'name');
    if (!college || !college.isActive) {
      throw new NotFoundError('College not found');
    }

    const departments = await Department.find({ college: collegeId, isActive: true })
      .sort({ searchPoints: -1, name: 1 })
      .select('name departmentId description');

    ResponseHandler.success(res, {
      college: {
        name: college.name,
        collegeId: college.collegeId,
        campus: college.campus
      },
      departments
    }, 'College departments retrieved successfully');
  });

  public getDepartmentUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { departmentId } = req.params;
    const { page = 1, limit = 20, graduationYear, sort = 'name' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const department = await Department.findById(departmentId)
      .populate('college', 'name')
      .populate('college.campus', 'name');
    
    if (!department || !department.isActive) {
      throw new NotFoundError('Department not found');
    }

    // Build filter
    const filter: any = { 
      department: departmentId, 
      isActive: true,
      role: 'graduate' // Only show graduates in department listings
    };
    
    if (graduationYear) {
      filter.graduationYear = parseInt(graduationYear as string);
    }

    // Build sort options
    let sortOptions: any = {};
    switch (sort) {
      case 'name':
        sortOptions = { firstName: 1, lastName: 1 };
        break;
      case 'year':
        sortOptions = { graduationYear: -1 };
        break;
      case 'likes':
        sortOptions = { numberOfLikes: -1 };
        break;
      case 'recent':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('campus college department', 'name')
        .select('firstName lastName surname username photo graduationYear numberOfLikes views')
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);

    // Update department search points
    await Department.findByIdAndUpdate(departmentId, { $inc: { searchPoints: 1 } });

    ResponseHandler.paginated(res, {
      department: {
        name: department.name,
        departmentId: department.departmentId,
        college: department.college
      },
      users
    }, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }, 'Department users retrieved successfully');
  });

  public getCampusStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { campusId } = req.params;

    const campus = await Campus.findById(campusId);
    if (!campus || !campus.isActive) {
      throw new NotFoundError('Campus not found');
    }

    const [totalUsers, totalGraduates, totalGuests, collegeCount] = await Promise.all([
      User.countDocuments({ campus: campusId, isActive: true }),
      User.countDocuments({ campus: campusId, isActive: true, role: 'graduate' }),
      User.countDocuments({ campus: campusId, isActive: true, role: 'guest' }),
      College.countDocuments({ campus: campusId, isActive: true })
    ]);

    // Get graduation year distribution
    const graduationYearStats = await User.aggregate([
      { $match: { campus: campus._id, isActive: true, role: 'graduate' } },
      { $group: { _id: '$graduationYear', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]);

    const stats = {
      campus: {
        name: campus.name,
        campusId: campus.campusId
      },
      totalUsers,
      totalGraduates,
      totalGuests,
      collegeCount,
      graduationYearStats
    };

    ResponseHandler.success(res, stats, 'Campus statistics retrieved successfully');
  });

  public getCollegeStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { collegeId } = req.params;

    const college = await College.findById(collegeId).populate('campus', 'name');
    if (!college || !college.isActive) {
      throw new NotFoundError('College not found');
    }

    const [totalUsers, totalGraduates, totalGuests, departmentCount] = await Promise.all([
      User.countDocuments({ college: collegeId, isActive: true }),
      User.countDocuments({ college: collegeId, isActive: true, role: 'graduate' }),
      User.countDocuments({ college: collegeId, isActive: true, role: 'guest' }),
      Department.countDocuments({ college: collegeId, isActive: true })
    ]);

    // Get top departments by user count
    const topDepartments = await User.aggregate([
      { $match: { college: college._id, isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
      { $unwind: '$department' },
      { $project: { name: '$department.name', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const stats = {
      college: {
        name: college.name,
        collegeId: college.collegeId,
        campus: college.campus
      },
      totalUsers,
      totalGraduates,
      totalGuests,
      departmentCount,
      topDepartments
    };

    ResponseHandler.success(res, stats, 'College statistics retrieved successfully');
  });

  public getAcademicStructure = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Get complete academic structure
    const campuses = await Campus.find({ isActive: true })
      .sort({ name: 1 })
      .select('name campusId');

    const structure = await Promise.all(
      campuses.map(async (campus) => {
        const colleges = await College.find({ campus: campus._id, isActive: true })
          .sort({ name: 1 })
          .select('name collegeId');

        const collegesWithDepartments = await Promise.all(
          colleges.map(async (college) => {
            const departments = await Department.find({ college: college._id, isActive: true })
              .sort({ name: 1 })
              .select('name departmentId');

            return {
              ...college.toJSON(),
              departments
            };
          })
        );

        return {
          ...campus.toJSON(),
          colleges: collegesWithDepartments
        };
      })
    );

    ResponseHandler.success(res, structure, 'Academic structure retrieved successfully');
  });
}

export const categoryController = new CategoryController();