import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { firebaseService } from '@/config/firebase';
import { FileUploadError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { FileUploadResult, ImageProcessingOptions } from '@/types';

class FileUploadService {
  private storage = multer.memoryStorage();
  
  private fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new FileUploadError('Only image files are allowed'));
    }
  };

  public upload = multer({
    storage: this.storage,
    fileFilter: this.fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1
    }
  });

  public async uploadImage(
    file: Express.Multer.File,
    folder: string = 'uploads',
    options: ImageProcessingOptions = {}
  ): Promise<FileUploadResult> {
    try {
      if (!file) {
        throw new FileUploadError('No file provided');
      }

      // Process image with Sharp
      const processedImage = await this.processImage(file.buffer, options);
      
      // Generate unique filename
      const filename = `${folder}/${uuidv4()}.${options.format || 'jpeg'}`;
      
      // Upload to Firebase Storage
      const bucket = firebaseService.getStorage().bucket();
      const fileRef = bucket.file(filename);
      
      await fileRef.save(processedImage, {
        metadata: {
          contentType: `image/${options.format || 'jpeg'}`,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Make file publicly accessible
      await fileRef.makePublic();
      
      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      
      logger.info(`File uploaded successfully: ${filename}`);
      
      return {
        url: publicUrl,
        filename,
        size: processedImage.length,
        mimetype: `image/${options.format || 'jpeg'}`
      };
    } catch (error) {
      logger.error('File upload error:', error);
      throw new FileUploadError('Failed to upload file');
    }
  }

  public async deleteImage(filename: string): Promise<void> {
    try {
      const bucket = firebaseService.getStorage().bucket();
      const fileRef = bucket.file(filename);
      
      await fileRef.delete();
      
      logger.info(`File deleted successfully: ${filename}`);
    } catch (error) {
      logger.error('File deletion error:', error);
      throw new FileUploadError('Failed to delete file');
    }
  }

  private async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<Buffer> {
    const {
      width = 800,
      height,
      quality = 80,
      format = 'jpeg'
    } = options;

    let sharpInstance = sharp(buffer);

    // Resize if dimensions provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert format and set quality
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
      default:
        sharpInstance = sharpInstance.jpeg({ quality });
    }

    return sharpInstance.toBuffer();
  }

  public async uploadProfilePhoto(file: Express.Multer.File, userId: string): Promise<FileUploadResult> {
    return this.uploadImage(file, `profiles/${userId}`, {
      width: 400,
      height: 400,
      quality: 85,
      format: 'jpeg'
    });
  }

  public async uploadCoverImage(file: Express.Multer.File, userId: string): Promise<FileUploadResult> {
    return this.uploadImage(file, `covers/${userId}`, {
      width: 1200,
      height: 400,
      quality: 85,
      format: 'jpeg'
    });
  }

  public async uploadPostImage(file: Express.Multer.File, userId: string): Promise<FileUploadResult> {
    return this.uploadImage(file, `posts/${userId}`, {
      width: 800,
      quality: 80,
      format: 'jpeg'
    });
  }
}

export const fileUploadService = new FileUploadService();