import api from './api';
import { ApiResponse } from '@/types/user';

export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  relatedTo: {
    model: string;
    id: string;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  pagination: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
}

/**
 * Get user notifications
 */
export const getUserNotifications = async (
  page = 1,
  limit = 10,
  isRead?: boolean,
): Promise<NotificationResponse> => {
  try {
    const params: Record<string, string | number | boolean> = { page, limit };
    if (isRead !== undefined) {
      params.isRead = isRead;
    }

    const response = await api.get<ApiResponse<Notification[]>>('/notifications', {
      params,
    });

    return {
      notifications: response.data.data,
      total: response.data.total || response.data.count || 0,
      pagination: response.data.pagination || {
        next: undefined,
        prev: undefined,
      },
    };
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  try {
    const response = await api.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await api.put('/notifications/read-all');
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id: string): Promise<void> => {
  try {
    await api.delete(`/notifications/${id}`);
  } catch (error) {
    console.error(`Failed to delete notification ${id}:`, error);
    throw error;
  }
};

/**
 * Delete all read notifications
 */
export const deleteAllReadNotifications = async (): Promise<void> => {
  try {
    await api.delete('/notifications/read');
  } catch (error) {
    console.error('Failed to delete read notifications:', error);
    throw error;
  }
};
