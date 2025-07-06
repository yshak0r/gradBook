import { Router } from 'express';
import { searchController } from '@/controllers/searchController';
import { optionalAuth, authenticate } from '@/middleware/auth';
import { validateQuery, schemas } from '@/middleware/validation';
import { searchLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Public search routes
router.get('/users', optionalAuth, searchLimiter, validateQuery(schemas.search), searchController.searchUsers);
router.get('/posts', searchLimiter, searchController.searchPosts);
router.get('/quick', searchLimiter, searchController.getQuickSearch);
router.get('/filters', searchController.getSearchFilters);
router.get('/popular', searchController.getPopularSearches);

// Protected search routes
router.use(authenticate);
router.get('/suggested', searchController.getSuggestedUsers);
router.get('/recent', searchController.getRecentSearches);
router.post('/save', searchController.saveSearch);

export default router;