import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User';
import { AuthenticatedRequest } from '@/types';
import { AuthenticationError, AuthorizationError } from '@/utils/errors';
import { ResponseHandler } from '@/utils/response';
import { logger } from '@/utils/logger';

interface JwtPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token is required');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    const user = await User.findById(decoded.id)
      .populate('campus college department')
      .select('-password');
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Update last active
    user.updateLastActive();

    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return ResponseHandler.unauthorized(res, 'Invalid token');
    }
    
    if (error instanceof AuthenticationError) {
      return ResponseHandler.unauthorized(res, error.message);
    }
    
    return ResponseHandler.internalError(res, 'Authentication failed');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      
      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message);
      }
      
      return ResponseHandler.unauthorized(res, 'Authorization failed');
    }
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    const user = await User.findById(decoded.id)
      .populate('campus college department')
      .select('-password');
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id.toString();
      user.updateLastActive();
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

export const requireProfileCompletion = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.role === 'graduate' && !req.user.profileCompleted) {
      return ResponseHandler.forbidden(res, 'Profile completion required');
    }

    next();
  } catch (error) {
    logger.error('Profile completion check error:', error);
    return ResponseHandler.forbidden(res, 'Profile completion required');
  }
};