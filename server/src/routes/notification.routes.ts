import { Router } from 'express';
import {
  getAllNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  markAsRead,
} from '../controllers/notification.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Get all notifications for the current user
router.get('/', protect, getAllNotifications);

// Get single notification
router.get('/:id', protect, getNotification);

// Create notification (typically used by internal systems, not exposed)
router.post('/', protect, createNotification);

// Update notification
router.put('/:id', protect, updateNotification);

// Delete notification
router.delete('/:id', protect, deleteNotification);

// Mark notification as read
router.patch('/:id/read', protect, markAsRead);

export default router;
