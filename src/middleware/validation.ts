import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '@/utils/errors';
import { ResponseHandler } from '@/utils/response';
import { logger } from '@/utils/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      logger.warn('Validation error:', errorMessage);
      return ResponseHandler.badRequest(res, 'Validation failed', errorMessage);
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      logger.warn('Query validation error:', errorMessage);
      return ResponseHandler.badRequest(res, 'Query validation failed', errorMessage);
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      logger.warn('Params validation error:', errorMessage);
      return ResponseHandler.badRequest(res, 'Parameters validation failed', errorMessage);
    }

    req.params = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    surname: Joi.string().min(2).max(50).required(),
    username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    graduationYear: Joi.number().min(1950).max(new Date().getFullYear() + 10).required(),
    campus: Joi.string().hex().length(24).required(),
    college: Joi.string().hex().length(24).required(),
    department: Joi.string().hex().length(24).required(),
    role: Joi.string().valid('graduate', 'guest').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Profile schemas
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    surname: Joi.string().min(2).max(50).optional(),
    quote: Joi.string().max(500).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    socialLinks: Joi.object({
      telegram: Joi.string().optional(),
      instagram: Joi.string().optional(),
      tiktok: Joi.string().optional(),
      youtube: Joi.string().optional(),
      snapchat: Joi.string().optional(),
      linkedin: Joi.string().optional()
    }).optional(),
    privacySettings: Joi.object({
      profileVisibility: Joi.string().valid('public', 'department', 'college', 'campus', 'private').optional(),
      contactVisibility: Joi.string().valid('public', 'department', 'college', 'campus', 'private').optional(),
      commentPermission: Joi.string().valid('public', 'department', 'college', 'campus', 'private').optional()
    }).optional()
  }),

  // Post schemas
  createPost: Joi.object({
    questionId: Joi.string().hex().length(24).required(),
    answer: Joi.string().min(1).max(2000).required(),
    type: Joi.string().valid('lastword', 'question').optional()
  }),

  addComment: Joi.object({
    text: Joi.string().min(1).max(500).required()
  }),

  // Search schemas
  search: Joi.object({
    q: Joi.string().min(1).max(100).optional(),
    campus: Joi.string().hex().length(24).optional(),
    college: Joi.string().hex().length(24).optional(),
    department: Joi.string().hex().length(24).optional(),
    graduationYear: Joi.number().min(1950).max(new Date().getFullYear() + 10).optional(),
    role: Joi.string().valid('graduate', 'guest').optional(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    sort: Joi.string().valid('name', 'likes', 'views', 'recent').default('recent'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Report schemas
  createReport: Joi.object({
    type: Joi.string().valid('inappropriate_content', 'harassment', 'spam', 'fake_profile', 'other').required(),
    reason: Joi.string().min(10).max(500).required(),
    description: Joi.string().max(1000).optional()
  }),

  // Tag schemas
  tagUser: Joi.object({
    tagIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required()
  }),

  // Common schemas
  objectId: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),

  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20)
  }),

  // Privacy settings
  privacySettings: Joi.object({
    privacySettings: Joi.object({
      profileVisibility: Joi.string().valid('public', 'department', 'college', 'campus', 'private').required(),
      contactVisibility: Joi.string().valid('public', 'department', 'college', 'campus', 'private').required(),
      commentPermission: Joi.string().valid('public', 'department', 'college', 'campus', 'private').required(),
      excludedUsers: Joi.array().items(Joi.string().hex().length(24)).optional()
    }).required()
  })
};