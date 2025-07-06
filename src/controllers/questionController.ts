import { Request, Response } from 'express';
import { Question } from '@/models/Question';
import { ResponseHandler } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';

class QuestionController {

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

  public getQuestionsByType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type } = req.params;

    if (!['lastword', 'profile', 'post'].includes(type)) {
      throw new ValidationError('Invalid question type');
    }

    const questions = await Question.find({ 
      type, 
      isActive: true 
    }).sort({ order: 1, createdAt: 1 });

    ResponseHandler.success(res, questions, `${type} questions retrieved successfully`);
  });

  public getQuestionsByCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category } = req.params;

    const questions = await Question.find({ 
      category, 
      isActive: true 
    }).sort({ order: 1, createdAt: 1 });

    ResponseHandler.success(res, questions, `Questions for category ${category} retrieved successfully`);
  });

  public getRequiredQuestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const questions = await Question.find({ 
      isRequired: true, 
      isActive: true 
    }).sort({ order: 1 });

    ResponseHandler.success(res, questions, 'Required questions retrieved successfully');
  });

  public getRandomQuestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, limit = 5 } = req.query;

    if (!type) {
      throw new ValidationError('Question type is required');
    }

    const questions = await Question.aggregate([
      { $match: { type, isActive: true } },
      { $sample: { size: parseInt(limit as string) } }
    ]);

    ResponseHandler.success(res, questions, 'Random questions retrieved successfully');
  });

  public getQuestionCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const categories = await Question.distinct('category', { isActive: true });

    ResponseHandler.success(res, categories, 'Question categories retrieved successfully');
  });

  public getQuestion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const question = await Question.findOne({ _id: id, isActive: true });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    ResponseHandler.success(res, question, 'Question retrieved successfully');
  });

  // Admin only endpoints (would be moved to admin controller in production)
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

    logger.info(`Question created: ${newQuestion._id}`);

    ResponseHandler.created(res, newQuestion, 'Question created successfully');
  });

  public updateQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body;

    const question = await Question.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    logger.info(`Question updated: ${id}`);

    ResponseHandler.success(res, question, 'Question updated successfully');
  });

  public deleteQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const question = await Question.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    logger.info(`Question deleted: ${id}`);

    ResponseHandler.success(res, null, 'Question deleted successfully');
  });
}

export const questionController = new QuestionController();