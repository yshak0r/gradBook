import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ResponseHandler } from '@/utils/response';

const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      error: 'Rate limit exceeded'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      ResponseHandler.tooManyRequests(res, message);
    }
  });
};

// Different rate limits for different endpoints
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

export const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests, please try again later'
);

export const uploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads
  'Too many file uploads, please try again later'
);

export const searchLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  30, // 30 searches
  'Too many search requests, please try again later'
);

export const commentLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  10, // 10 comments
  'Too many comments, please try again later'
);

export const likeLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  50, // 50 likes
  'Too many like actions, please try again later'
);