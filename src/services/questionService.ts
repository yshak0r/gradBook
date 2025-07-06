import { Question } from '@/models/Question';
import { logger } from '@/utils/logger';
import { IQuestion } from '@/types';

class QuestionService {
  
  public async getQuestionsByType(type: 'lastword' | 'profile' | 'post'): Promise<IQuestion[]> {
    try {
      const questions = await Question.find({ 
        type, 
        isActive: true 
      }).sort({ order: 1, createdAt: 1 });

      return questions;
    } catch (error) {
      logger.error('Error fetching questions by type:', error);
      throw error;
    }
  }

  public async getRequiredQuestions(): Promise<IQuestion[]> {
    try {
      const questions = await Question.find({ 
        isRequired: true, 
        isActive: true 
      }).sort({ order: 1 });

      return questions;
    } catch (error) {
      logger.error('Error fetching required questions:', error);
      throw error;
    }
  }

  public async getQuestionsByCategory(category: string): Promise<IQuestion[]> {
    try {
      const questions = await Question.find({ 
        category, 
        isActive: true 
      }).sort({ order: 1, createdAt: 1 });

      return questions;
    } catch (error) {
      logger.error('Error fetching questions by category:', error);
      throw error;
    }
  }

  public async getRandomQuestions(type: string, limit: number = 5): Promise<IQuestion[]> {
    try {
      const questions = await Question.aggregate([
        { $match: { type, isActive: true } },
        { $sample: { size: limit } }
      ]);

      return questions;
    } catch (error) {
      logger.error('Error fetching random questions:', error);
      throw error;
    }
  }

  public async createQuestion(questionData: {
    question: string;
    type: 'lastword' | 'profile' | 'post';
    category: string;
    isRequired?: boolean;
    options?: string[];
    order?: number;
  }): Promise<IQuestion> {
    try {
      const question = await Question.create(questionData);
      
      logger.info(`Question created: ${question._id}`);
      
      return question;
    } catch (error) {
      logger.error('Error creating question:', error);
      throw error;
    }
  }

  public async updateQuestion(
    questionId: string, 
    updates: Partial<IQuestion>
  ): Promise<IQuestion | null> {
    try {
      const question = await Question.findByIdAndUpdate(
        questionId,
        updates,
        { new: true, runValidators: true }
      );

      if (question) {
        logger.info(`Question updated: ${questionId}`);
      }

      return question;
    } catch (error) {
      logger.error('Error updating question:', error);
      throw error;
    }
  }

  public async deleteQuestion(questionId: string): Promise<boolean> {
    try {
      const result = await Question.findByIdAndUpdate(
        questionId,
        { isActive: false },
        { new: true }
      );

      if (result) {
        logger.info(`Question deleted: ${questionId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting question:', error);
      throw error;
    }
  }

  public async getQuestionCategories(): Promise<string[]> {
    try {
      const categories = await Question.distinct('category', { isActive: true });
      return categories;
    } catch (error) {
      logger.error('Error fetching question categories:', error);
      throw error;
    }
  }
}

export const questionService = new QuestionService();