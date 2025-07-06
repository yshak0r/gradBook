import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { ResponseHandler } from '@/utils/response';
import { logger } from '@/utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle known operational errors
  if (error instanceof AppError) {
    ResponseHandler.error(res, error.message, error.statusCode);
    return;
  }

  // Handle MongoDB validation errors
  if (error.name === 'ValidationError') {
    const message = Object.values((error as any).errors)
      .map((err: any) => err.message)
      .join(', ');
    ResponseHandler.badRequest(res, 'Validation failed', message);
    return;
  }

  // Handle MongoDB duplicate key errors
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue)[0];
    const message = `${field} already exists`;
    ResponseHandler.conflict(res, message);
    return;
  }

  // Handle MongoDB cast errors
  if (error.name === 'CastError') {
    ResponseHandler.badRequest(res, 'Invalid ID format');
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    ResponseHandler.unauthorized(res, 'Invalid token');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    ResponseHandler.unauthorized(res, 'Token expired');
    return;
  }

  // Handle multer errors
  if (error.name === 'MulterError') {
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      ResponseHandler.badRequest(res, 'File too large');
      return;
    }
    ResponseHandler.badRequest(res, 'File upload error');
    return;
  }

  // Default to 500 server error
  ResponseHandler.internalError(res, 'Something went wrong');
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  ResponseHandler.notFound(res, `Route ${req.originalUrl} not found`);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};