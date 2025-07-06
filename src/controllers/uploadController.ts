import { Request, Response } from 'express';
import { User } from '@/models/User';
import { ResponseHandler } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { NotFoundError, FileUploadError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { fileUploadService } from '@/services/fileUploadService';

class UploadController {

  public uploadProfilePhoto = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const file = req.file;

    if (!file) {
      throw new FileUploadError('No file provided');
    }

    // Upload to Firebase
    const uploadResult = await fileUploadService.uploadProfilePhoto(file, currentUserId);

    // Update user profile
    const user = await User.findByIdAndUpdate(
      currentUserId,
      { photo: uploadResult.url },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`Profile photo uploaded for user ${currentUserId}: ${uploadResult.url}`);

    ResponseHandler.success(res, {
      url: uploadResult.url,
      user: {
        photo: user.photo
      }
    }, 'Profile photo uploaded successfully');
  });

  public uploadCoverImage = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const file = req.file;

    if (!file) {
      throw new FileUploadError('No file provided');
    }

    // Upload to Firebase
    const uploadResult = await fileUploadService.uploadCoverImage(file, currentUserId);

    // Update user profile
    const user = await User.findByIdAndUpdate(
      currentUserId,
      { coverImage: uploadResult.url },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`Cover image uploaded for user ${currentUserId}: ${uploadResult.url}`);

    ResponseHandler.success(res, {
      url: uploadResult.url,
      user: {
        coverImage: user.coverImage
      }
    }, 'Cover image uploaded successfully');
  });

  public uploadPostImage = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.userId!;
    const file = req.file;

    if (!file) {
      throw new FileUploadError('No file provided');
    }

    // Upload to Firebase
    const uploadResult = await fileUploadService.uploadPostImage(file, currentUserId);

    logger.info(`Post image uploaded for user ${currentUserId}: ${uploadResult.url}`);

    ResponseHandler.success(res, {
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.size
    }, 'Post image uploaded successfully');
  });

  public deleteImage = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { filename } = req.params;
    const currentUserId = req.userId!;

    // Verify the file belongs to the user (basic security check)
    if (!filename.includes(currentUserId)) {
      throw new FileUploadError('Unauthorized to delete this file');
    }

    await fileUploadService.deleteImage(filename);

    logger.info(`Image deleted by user ${currentUserId}: ${filename}`);

    ResponseHandler.success(res, null, 'Image deleted successfully');
  });
}

export const uploadController = new UploadController();