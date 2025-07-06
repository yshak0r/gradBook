import { Router } from 'express';
import { uploadController } from '@/controllers/uploadController';
import { authenticate } from '@/middleware/auth';
import { fileUploadService } from '@/services/fileUploadService';
import { uploadLimiter } from '@/middleware/rateLimiter';

const router = Router();

// All upload routes require authentication
router.use(authenticate);
router.use(uploadLimiter);

router.post('/profile-photo', fileUploadService.upload.single('photo'), uploadController.uploadProfilePhoto);
router.post('/cover-image', fileUploadService.upload.single('cover'), uploadController.uploadCoverImage);
router.post('/post-image', fileUploadService.upload.single('image'), uploadController.uploadPostImage);
router.delete('/image/:filename', uploadController.deleteImage);

export default router;