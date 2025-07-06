import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { NotificationPayload, SocketUser } from '@/types';

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();

  public initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('✅ Socket.IO initialized successfully');
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
          return next(new Error('Authentication error: Invalid user'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      
      // Add user to connected users
      this.connectedUsers.set(user._id.toString(), {
        userId: user._id.toString(),
        socketId: socket.id,
        isOnline: true,
        lastSeen: new Date()
      });

      // Join user to their personal room
      socket.join(`user:${user._id}`);
      
      // Join user to their department, college, and campus rooms
      if (user.department) socket.join(`department:${user.department}`);
      if (user.college) socket.join(`college:${user.college}`);
      if (user.campus) socket.join(`campus:${user.campus}`);

      logger.info(`User ${user.username} connected with socket ${socket.id}`);

      // Emit online status to friends
      this.broadcastUserStatus(user._id.toString(), true);

      // Handle real-time events
      this.handleRealtimeEvents(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(user._id.toString());
        this.broadcastUserStatus(user._id.toString(), false);
        logger.info(`User ${user.username} disconnected`);
      });
    });
  }

  private handleRealtimeEvents(socket: any): void {
    const user = socket.data.user;

    // Handle typing events
    socket.on('typing:start', (data: { targetUserId: string }) => {
      socket.to(`user:${data.targetUserId}`).emit('typing:start', {
        userId: user._id,
        username: user.username
      });
    });

    socket.on('typing:stop', (data: { targetUserId: string }) => {
      socket.to(`user:${data.targetUserId}`).emit('typing:stop', {
        userId: user._id,
        username: user.username
      });
    });

    // Handle view events
    socket.on('profile:view', (data: { profileId: string }) => {
      socket.to(`user:${data.profileId}`).emit('profile:viewed', {
        viewerId: user._id,
        viewerName: user.fullName,
        timestamp: new Date()
      });
    });

    // Handle real-time counters
    socket.on('counter:request', (data: { type: string, targetId: string }) => {
      this.emitCounterUpdate(data.type, data.targetId);
    });
  }

  public sendNotification(notification: NotificationPayload): void {
    if (!this.io) return;

    this.io.to(`user:${notification.userId}`).emit('notification', notification);
    
    logger.info(`Notification sent to user ${notification.userId}: ${notification.message}`);
  }

  public sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, data);
  }

  public sendToDepartment(departmentId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`department:${departmentId}`).emit(event, data);
  }

  public sendToCollege(collegeId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`college:${collegeId}`).emit(event, data);
  }

  public sendToCampus(campusId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`campus:${campusId}`).emit(event, data);
  }

  public broadcastUserStatus(userId: string, isOnline: boolean): void {
    if (!this.io) return;

    // Broadcast to user's connections (friends, etc.)
    this.io.emit('user:status', {
      userId,
      isOnline,
      lastSeen: new Date()
    });
  }

  public emitCounterUpdate(type: string, targetId: string): void {
    if (!this.io) return;

    // Emit real-time counter updates
    this.io.emit('counter:update', {
      type,
      targetId,
      timestamp: new Date()
    });
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getSocketIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();