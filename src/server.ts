import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations
import { database } from '@/config/database';
import { firebaseService } from '@/config/firebase';
import { logger } from '@/utils/logger';

// Import middleware
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { generalLimiter } from '@/middleware/rateLimiter';

// Import services
import { socketService } from '@/services/socketService';

// Import routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/user';
import postRoutes from '@/routes/post';
import searchRoutes from '@/routes/search';
import notificationRoutes from '@/routes/notification';
import uploadRoutes from '@/routes/upload';
import adminRoutes from '@/routes/admin';
import categoryRoutes from '@/routes/category';
import questionRoutes from '@/routes/question';

class Server {
  private app: express.Application;
  private server: any;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(generalLimiter);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'GradBook API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/posts', postRoutes);
    this.app.use('/api/v1/search', searchRoutes);
    this.app.use('/api/v1/notifications', notificationRoutes);
    this.app.use('/api/v1/upload', uploadRoutes);
    this.app.use('/api/v1/admin', adminRoutes);
    this.app.use('/api/v1/categories', categoryRoutes);
    this.app.use('/api/v1/questions', questionRoutes);
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await database.connect();
      
      // Initialize Firebase
      firebaseService.initialize();
      
      // Create HTTP server
      this.server = createServer(this.app);
      
      // Initialize Socket.IO
      socketService.initialize(this.server);
      
      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 GradBook API server running on port ${this.port}`);
        logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🌐 Health check: http://localhost:${this.port}/health`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);
      
      if (this.server) {
        this.server.close(async () => {
          logger.info('🔌 HTTP server closed');
          
          try {
            await database.disconnect();
            logger.info('🗄️ Database disconnected');
            
            logger.info('✅ Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
          }
        });
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}

// Start the server
const server = new Server();
server.start().catch((error) => {
  logger.error('❌ Failed to start application:', error);
  process.exit(1);
});

export default server;