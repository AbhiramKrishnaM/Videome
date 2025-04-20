import { Request, Response } from 'express';
import Notification, { INotification } from '@/models/Notification';
import { NotificationType } from '@/models/Notification';
import Meeting from '@/models/Meeting';
import User, { IUser } from '@/models/User';
import logger from '@/utils/logger';

// Extended request interface
interface AuthRequest extends Request {
  user?: IUser & { _id: any };
}

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const isRead = req.query.isRead ? req.query.isRead === 'true' : undefined;

    // Build query
    const query: any = { user: req.user?._id };
    if (isRead !== undefined) {
      query.isRead = isRead;
    }

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Fetch notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination: any = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: notifications.length,
      pagination,
      total,
      data: notifications,
    });
  } catch (error) {
    logger.error(`Error in getUserNotifications: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    // Check if notification belongs to the user
    if (notification.user.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: 'Not authorized to modify this notification' });
      return;
    }

    // Update only if not already read
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error(`Error in markNotificationAsRead: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await Notification.updateMany(
      { user: req.user?._id, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error(`Error in markAllNotificationsAsRead: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    // Check if notification belongs to the user
    if (notification.user.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: 'Not authorized to delete this notification' });
      return;
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error(`Error in deleteNotification: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/v1/notifications/read
 * @access  Private
 */
export const deleteAllReadNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await Notification.deleteMany({ user: req.user?._id, isRead: true });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} read notifications deleted`,
    });
  } catch (error) {
    logger.error(`Error in deleteAllReadNotifications: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create notification (helper function, not exposed as an API endpoint)
 * @access  Private
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedModel: string,
  relatedId: string,
): Promise<INotification | null> => {
  try {
    return await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedTo: {
        model: relatedModel,
        id: relatedId,
      },
    });
  } catch (error) {
    logger.error(`Error in createNotification: ${error}`);
    return null;
  }
};
