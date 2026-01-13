import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../services/api';
import { useSelector } from 'react-redux';

/**
 * Hook to manage all notifications (not just chat)
 * Fetches notifications from API and listens for new notifications via socket
 */
export const useNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch all notifications from API (no type filter)
  const { data: notificationsData, error: notificationsError, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await notificationAPI.getNotifications({ page: 1, limit: 50 });
        // Axios response: res.data = ApiResponse object
        // ApiResponse structure: { statusCode, data: { notifications, pagination, unreadCount }, message, success }
        const responseData = res?.data;
        if (responseData?.data) {
          return responseData.data;
        }
        // Fallback: try direct access
        if (responseData?.notifications) {
          return responseData;
        }
        return { notifications: [], pagination: {}, unreadCount: 0 };
      } catch (error) {
        // Return empty structure on error
        return { notifications: [], pagination: {}, unreadCount: 0 };
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  // Fetch unread count from API (includes all notification types)
  const { data: unreadCountData } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      try {
        const res = await notificationAPI.getUnreadCount();
        // ApiResponse structure: { statusCode, data: { unreadCount }, message, success }
        return res.data?.data?.unreadCount || 0;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  // Update notifications from API data
  useEffect(() => {
    if (notificationsData) {
      const notificationsList = Array.isArray(notificationsData.notifications) 
        ? notificationsData.notifications 
        : [];
      const formattedNotifications = notificationsList.map(notif => ({
        id: notif._id,
        notificationId: notif._id,
        type: notif.type,
        title: notif.title || '',
        message: notif.message || '',
        data: notif.data || {},
        actionUrl: notif.actionUrl || null,
        priority: notif.priority || 'medium',
        createdAt: notif.createdAt,
        timestamp: new Date(notif.createdAt),
        isRead: notif.isRead || false,
      }));
      setNotifications(formattedNotifications);
    } else if (!notificationsLoading) {
      // If data is null/undefined and not loading, set empty array
      setNotifications([]);
    }
  }, [notificationsData, notificationsLoading]);

  // Update unread count from API
  useEffect(() => {
    if (unreadCountData !== undefined) {
      setUnreadCount(unreadCountData);
    }
  }, [unreadCountData]);

  // Listen for new notifications via socket
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNotificationNew = () => {
      // Refetch notifications when new notification is created
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notification-unread-count']);
    };

    socket.on('notification_new', handleNotificationNew);

    return () => {
      socket.off('notification_new', handleNotificationNew);
    };
  }, [socket, isConnected, user, queryClient]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
    } catch (error) {
      // Silently fail - notification might already be marked as read
    }

    // Invalidate queries to refresh
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['notification-unread-count']);
  }, [queryClient]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Remove a specific notification
  const removeNotification = useCallback(async (notificationId) => {
    // Delete notification from API
    try {
      await notificationAPI.deleteNotification(notificationId);
    } catch (error) {
      // Silently fail - notification might already be deleted
    }

    // Invalidate queries to refresh
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['notification-unread-count']);
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotifications,
    removeNotification,
  };
};
