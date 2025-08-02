import express, { Router } from 'express';
import clerkAuth from '../middleware/clerkAuth';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadCount,
    triggerOverdueNotifications,
    triggerUnassignedNotifications,
    triggerWeeklySummary,
} from "../controllers/notificationController";

const router: Router = express.Router();

// All routes require authentication
router.use(clerkAuth);

// Notification operations
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/:id/read", markNotificationAsRead);
router.put("/mark-all-read", markAllNotificationsAsRead);

// Administrative endpoints
router.post("/admin/trigger-overdue", triggerOverdueNotifications);
router.post("/admin/trigger-unassigned", triggerUnassignedNotifications);
router.post("/admin/trigger-summary/:agencyId", triggerWeeklySummary);

export default router;
