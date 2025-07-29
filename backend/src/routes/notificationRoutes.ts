import express, { Router } from 'express';
import clerkAuth from '../middleware/clerkAuth';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount
} from '../controllers/notificationController';

const router: Router = express.Router();

// All routes require authentication
router.use(clerkAuth);

// Notification operations
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markNotificationAsRead);
router.put('/mark-all-read', markAllNotificationsAsRead);

export default router;
