import { Router } from 'express';
import { getOrCreateUser, updateUserRole, getCurrentUser, agencyLogin } from '../controllers/authController';
import clerkAuth from '../middleware/clerkAuth';

const router: Router = Router();

// Public routes (no authentication required)
// POST /api/auth/agency/login - Agency login
router.post('/agency/login', agencyLogin);

// All other auth routes require authentication
router.use(clerkAuth);

// GET /api/auth/user - Get current user
router.get('/user', getCurrentUser);

// POST /api/auth/user - Create or get user
router.post('/user', getOrCreateUser);

// PUT /api/auth/user/role - Update user role
router.put('/user/role', updateUserRole);

export default router;
