# 🎓 GradBook Backend API

A comprehensive social media platform designed specifically for university graduates and guests to connect, share memories, and maintain relationships post-graduation.

## 🌟 Features

### 👥 User Management
- **Dual Registration System**: Separate registration flows for graduates and guests
- **Role-Based Access Control**: Different permissions for graduates, guests, and admins
- **Profile Management**: Comprehensive profile system with privacy controls
- **Social Links Integration**: Support for multiple social media platforms

### 📱 Social Features
- **Profile Interactions**: Like, save, and comment on profiles
- **Post System**: Create, share, and interact with posts
- **Last Words**: Special graduation messages from graduates
- **Real-time Notifications**: Live updates for all interactions
- **User Tagging**: Predefined tags for user characteristics

### 🔍 Discovery & Search
- **Advanced Search**: Full-text search with multiple filters
- **Academic Filtering**: Filter by campus, college, and department
- **Personalized Feed**: AI-driven content personalization
- **Suggested Users**: Smart user recommendations

### 🏛️ Academic Structure
- **Hierarchical Organization**: Campus → College → Department structure
- **Category Pages**: Dedicated pages for each academic unit
- **Statistics**: Comprehensive analytics for each level

### 🔒 Privacy & Security
- **Granular Privacy Controls**: Control who can see profiles and contact info
- **Content Moderation**: Report system for inappropriate content
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Rate Limiting**: Protection against abuse

### 📊 Analytics & Insights
- **Real-time Counters**: Live view, like, and comment counts
- **User Analytics**: Detailed interaction statistics
- **Popular Content**: Trending posts and users
- **Admin Dashboard**: Comprehensive system analytics

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for live features
- **File Storage**: Firebase Storage
- **Authentication**: JWT tokens
- **Validation**: Joi schemas
- **Logging**: Winston logger
- **Testing**: Jest (configured)

## 📁 Project Structure

```
src/
├── config/          # Database and Firebase configuration
├── controllers/     # Request handlers
├── middleware/      # Authentication, validation, error handling
├── models/          # Mongoose schemas and models
├── routes/          # API route definitions
├── services/        # Business logic and external services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and helpers
└── server.ts        # Main application entry point

scripts/             # Database seeding and utilities
postman/            # API testing collections
docs/               # Additional documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Firebase project (for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gradbook-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file with:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/gradbook
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_STORAGE_BUCKET=your-storage-bucket
   
   # Server
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Seed the database with sample data
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/register     # User registration
POST /api/v1/auth/login        # User login
GET  /api/v1/auth/profile      # Get current user profile
PUT  /api/v1/auth/profile      # Update user profile
POST /api/v1/auth/refresh      # Refresh JWT token
```

### User Endpoints
```
GET  /api/v1/users/:id         # Get user profile
POST /api/v1/users/:id/like    # Like/unlike user profile
POST /api/v1/users/:id/save    # Save/unsave user profile
POST /api/v1/users/:id/comment # Comment on user profile
POST /api/v1/users/:id/tag     # Tag user with predefined tags
GET  /api/v1/users/me/liked    # Get liked profiles
GET  /api/v1/users/me/saved    # Get saved profiles
```

### Post Endpoints
```
GET  /api/v1/posts             # Get personalized feed
POST /api/v1/posts             # Create new post (graduates only)
GET  /api/v1/posts/:id         # Get specific post
POST /api/v1/posts/:id/like    # Like/unlike post
POST /api/v1/posts/:id/comment # Comment on post
POST /api/v1/posts/:id/share   # Share post
GET  /api/v1/posts/lastwords   # Get last words posts
```

### Search Endpoints
```
GET  /api/v1/search/users      # Search users with filters
GET  /api/v1/search/posts      # Search posts
GET  /api/v1/search/suggested  # Get suggested users
GET  /api/v1/search/filters    # Get available filters
```

### Category Endpoints
```
GET  /api/v1/categories/campuses           # Get all campuses
GET  /api/v1/categories/campuses/:id/colleges    # Get campus colleges
GET  /api/v1/categories/colleges/:id/departments # Get college departments
GET  /api/v1/categories/structure          # Get complete academic structure
```

## 🧪 Testing

### Using Postman
1. Import the collection from `postman/GradBook_API.postman_collection.json`
2. Set up environment variables for your local setup
3. Start with authentication endpoints to get JWT tokens

### Sample Credentials (after seeding)
```
Admin: admin@gradbook.com / password123
Graduate: john.smith0@university.edu / password123
Guest: guest0@example.com / password123
```

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run seed         # Seed database with sample data
npm run clean        # Clean build directory
```

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with TypeScript rules
- **Prettier**: Code formatting (configure as needed)
- **Path Aliases**: Use `@/` for src directory imports

### Database Models

#### User Model
- Complete profile information
- Privacy settings
- Social links
- Academic affiliations
- Interaction tracking

#### Post Model
- Question-based content
- Like/comment/share system
- View tracking
- Type classification (lastword/question)

#### Academic Models
- Campus → College → Department hierarchy
- Search point tracking
- User statistics

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-production-secret
FIREBASE_PROJECT_ID=production-project
# ... other production configs
```

### Docker Support (Optional)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with multiple transports
- **Error Tracking**: Comprehensive error handling and logging
- **Performance Monitoring**: Request timing and database query optimization
- **Health Checks**: `/health` endpoint for monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API collection in Postman

## 🔮 Roadmap

- [ ] Email notifications
- [ ] OAuth integration (Google, Facebook)
- [ ] Advanced analytics dashboard
- [ ] Mobile app API optimizations
- [ ] Caching layer (Redis)
- [ ] GraphQL API option
- [ ] Microservices architecture
- [ ] Advanced search with Elasticsearch

---

**Built with ❤️ for university communities**