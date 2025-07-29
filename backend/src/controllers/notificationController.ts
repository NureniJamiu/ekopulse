import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import User from '../models/User';
import NotificationService from '../services/NotificationService';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const {
      status,
      type,
      page = 1,
      limit = 20,
      recipientType = 'user'
    } = req.query;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Determine recipient ID based on user role and request
    let recipientId = user._id.toString();
    let actualRecipientType: 'user' | 'agency' = 'user';

    if (recipientType === 'agency' && user.agency) {
      recipientId = user.agency.toString();
      actualRecipientType = 'agency';
    }

    const notificationService = new NotificationService(req.io);

    const result = await notificationService.getNotifications(
      recipientId,
      actualRecipientType,
      {
        status: status as any,
        type: type as any,
        limit: parseInt(limit as string),
        skip: (parseInt(page as string) - 1) * parseInt(limit as string)
      }
    );

    res.status(200).json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          current: parseInt(page as string),
          pages: Math.ceil(result.total / parseInt(limit as string)),
          total: result.total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { id } = req.params;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const notificationService = new NotificationService(req.io);
    const success = await notificationService.markAsRead(id, user._id.toString());

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Notification not found or already read'
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { recipientType = 'user' } = req.body;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Determine recipient ID based on user role and request
    let recipientId = user._id.toString();
    let actualRecipientType: 'user' | 'agency' = 'user';

    if (recipientType === 'agency' && user.agency) {
      recipientId = user.agency.toString();
      actualRecipientType = 'agency';
    }

    const notificationService = new NotificationService(req.io);
    const count = await notificationService.markAllAsRead(recipientId, actualRecipientType);

    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { recipientType = 'user' } = req.query;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Determine recipient ID based on user role and request
    let recipientId = user._id.toString();
    let actualRecipientType: 'user' | 'agency' = 'user';

    if (recipientType === 'agency' && user.agency) {
      recipientId = user.agency.toString();
      actualRecipientType = 'agency';
    }

    const notificationService = new NotificationService(req.io);
    const count = await notificationService.getUnreadCount(recipientId, actualRecipientType);

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
