import { create } from 'zustand';
import {
  Notification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from '@/services/notification.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  removeAllRead: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (page = 1, limit = 10) => {
    try {
      set({ isLoading: true, error: null });
      const result = await getUserNotifications(page, limit);
      set({
        notifications: result.notifications,
        isLoading: false,
      });

      // Also update unread count
      const unreadCount = result.notifications.filter((n) => !n.isRead).length;
      set({ unreadCount });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      set({ isLoading: true, error: null });
      const result = await getUserNotifications(1, 100, false);
      set({
        unreadCount: result.total,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch unread count';
      set({ error: errorMessage, isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await markNotificationAsRead(id);

      // Update the notification in state
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification._id === id ? { ...notification, isRead: true } : notification,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to mark notification ${id} as read`;
      set({ error: errorMessage, isLoading: false });
    }
  },

  markAllAsRead: async () => {
    try {
      set({ isLoading: true, error: null });
      await markAllNotificationsAsRead();

      // Update all notifications in state
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to mark all notifications as read';
      set({ error: errorMessage, isLoading: false });
    }
  },

  removeNotification: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await deleteNotification(id);

      // Remove the notification from state
      set((state) => {
        const notification = state.notifications.find((n) => n._id === id);
        const isUnread = notification && !notification.isRead;

        return {
          notifications: state.notifications.filter((n) => n._id !== id),
          unreadCount: isUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          isLoading: false,
        };
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to delete notification ${id}`;
      set({ error: errorMessage, isLoading: false });
    }
  },

  removeAllRead: async () => {
    try {
      set({ isLoading: true, error: null });
      await deleteAllReadNotifications();

      // Remove read notifications from state
      set((state) => ({
        notifications: state.notifications.filter((n) => !n.isRead),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete read notifications';
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
