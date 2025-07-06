import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User';
import { Campus } from '@/models/Campus';
import { College } from '@/models/College';
import { Department } from '@/models/Department';
import { ResponseHandler } from '@/utils/response';
import { AuthenticationError, ValidationError, ConflictError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest, RegisterValidation, LoginValidation } from '@/types';

class AuthController {
  
  public register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      firstName,
      lastName,
      surname,
      username,
      email,
      password,
      phoneNumber,
      graduationYear,
      campus,
      college,
      department,
      role
    }: RegisterValidation = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictError('Username already taken');
      }
    }

    // Validate academic structure
    const [campusDoc, collegeDoc, departmentDoc] = await Promise.all([
      Campus.findById(campus),
      College.findById(college),
      Department.findById(department)
    ]);

    if (!campusDoc) {
      throw new ValidationError('Invalid campus selected');
    }
    if (!collegeDoc) {
      throw new ValidationError('Invalid college selected');
    }
    if (!departmentDoc) {
      throw new ValidationError('Invalid department selected');
    }

    // Verify academic structure relationships
    if (collegeDoc.campus.toString() !== campus) {
      throw new ValidationError('College does not belong to selected campus');
    }
    if (departmentDoc.college.toString() !== college) {
      throw new ValidationError('Department does not belong to selected college');
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      surname,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      phoneNumber,
      graduationYear,
      campus,
      college,
      department,
      role,
      isVerified: role === 'guest', // Guests are auto-verified
      profileCompleted: role === 'guest' // Guests don't need profile completion
    });

    // Generate token
    const token = user.generateAuthToken();

    // Remove password from response
    const userResponse = user.toJSON();

    logger.info(`New user registered: ${email} (${role})`);

    ResponseHandler.created(res, {
      user: userResponse,
      token,
      requiresProfileCompletion: role === 'graduate' && !user.profileCompleted
    }, 'Registration successful');
  });

  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password }: LoginValidation = req.body;

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('campus college department', 'name');

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Generate token
    const token = user.generateAuthToken();

    // Update last active
    user.updateLastActive();

    // Remove password from response
    const userResponse = user.toJSON();

    logger.info(`User logged in: ${email}`);

    ResponseHandler.success(res, {
      user: userResponse,
      token,
      requiresProfileCompletion: user.role === 'graduate' && !user.profileCompleted
    }, 'Login successful');
  });

  public getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.userId)
      .populate('campus college department', 'name')
      .populate('likes', 'firstName lastName surname username photo')
      .populate('savedProfiles', 'firstName lastName surname username photo');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    ResponseHandler.success(res, user, 'Profile retrieved successfully');
  });

  public updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const allowedUpdates = [
      'firstName', 'lastName', 'surname', 'quote', 'phoneNumber',
      'socialLinks', 'privacySettings'
    ];

    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      throw new ValidationError('Invalid updates');
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { ...req.body, profileCompleted: true },
      { new: true, runValidators: true }
    ).populate('campus college department', 'name');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    logger.info(`Profile updated for user: ${user.email}`);

    ResponseHandler.success(res, user, 'Profile updated successfully');
  });

  public changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    ResponseHandler.success(res, null, 'Password changed successfully');
  });

  public deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { password } = req.body;

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Password is incorrect');
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    logger.info(`Account deactivated for user: ${user.email}`);

    ResponseHandler.success(res, null, 'Account deleted successfully');
  });

  public refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const token = user.generateAuthToken();

    ResponseHandler.success(res, { token }, 'Token refreshed successfully');
  });

  public verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new AuthenticationError('Invalid verification token');
      }

      if (user.isVerified) {
        return ResponseHandler.success(res, null, 'Email already verified');
      }

      user.isVerified = true;
      await user.save();

      logger.info(`Email verified for user: ${user.email}`);

      ResponseHandler.success(res, null, 'Email verified successfully');
    } catch (error) {
      throw new AuthenticationError('Invalid or expired verification token');
    }
  });

  public forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return ResponseHandler.success(res, null, 'If email exists, reset instructions have been sent');
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // In production, send email with reset link
    // For now, just log it
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    ResponseHandler.success(res, null, 'If email exists, reset instructions have been sent');
  });

  public resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new AuthenticationError('Invalid reset token');
      }

      user.password = newPassword;
      await user.save();

      logger.info(`Password reset for user: ${user.email}`);

      ResponseHandler.success(res, null, 'Password reset successfully');
    } catch (error) {
      throw new AuthenticationError('Invalid or expired reset token');
    }
  });
}

export const authController = new AuthController();