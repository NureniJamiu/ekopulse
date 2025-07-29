import { Router, Request, Response, NextFunction } from 'express';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  getUserIssues,
  uploadMiddleware
} from '../controllers/issueController';
import clerkAuth from '../middleware/clerkAuth';

const router: Router = Router();

// Multer error handler
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    console.error('[Multer Error]:', err.message);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.'
      });
    }

    if (err.message === 'Only image files are allowed') {
      return res.status(400).json({
        success: false,
        error: 'Only image files (JPEG, PNG) are allowed.'
      });
    }

    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`
    });
  }
  next();
};

// Public routes
router.get('/', getIssues);

// Protected routes - apply auth middleware
router.post('/', clerkAuth, uploadMiddleware, handleMulterError, createIssue);
router.put('/:id/status', clerkAuth, updateIssueStatus);
router.get('/user/my-reports', clerkAuth, getUserIssues);

// ID-based routes (must come after specific paths)
router.get('/:id', getIssueById);

export default router;
