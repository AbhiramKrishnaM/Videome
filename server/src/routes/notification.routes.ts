import { Router } from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from '../controllers/notification.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Get all notifications for the current user
router.get('/', protect, getUserNotifications);

// Mark notification as read
router.patch('/:id/read', protect, markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', protect, markAllNotificationsAsRead);

// Delete notification
router.delete('/:id', protect, deleteNotification);

// Delete all read notifications
router.delete('/read', protect, deleteAllReadNotifications);

export default router;
