import { Response } from 'express';
import { ApiResponse } from '@/types';

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string = 'Internal Server Error',
    statusCode: number = 500,
    error?: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    },
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      pagination,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response, message: string = 'No content'): Response {
    const response: ApiResponse = {
      success: true,
      message,
    };
    return res.status(204).json(response);
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    error?: string
  ): Response {
    return this.error(res, message, 400, error);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized',
    error?: string
  ): Response {
    return this.error(res, message, 401, error);
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden',
    error?: string
  ): Response {
    return this.error(res, message, 403, error);
  }

  static notFound(
    res: Response,
    message: string = 'Not found',
    error?: string
  ): Response {
    return this.error(res, message, 404, error);
  }

  static conflict(
    res: Response,
    message: string = 'Conflict',
    error?: string
  ): Response {
    return this.error(res, message, 409, error);
  }

  static tooManyRequests(
    res: Response,
    message: string = 'Too many requests',
    error?: string
  ): Response {
    return this.error(res, message, 429, error);
  }

  static internalError(
    res: Response,
    message: string = 'Internal server error',
    error?: string
  ): Response {
    return this.error(res, message, 500, error);
  }
}