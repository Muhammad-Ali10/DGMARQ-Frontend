import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../services/api';
import { useSelector } from 'react-redux';

/**
 * Fetches notifications and listens for new ones via socket.
 */
export const useNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notificationsData, error: notificationsError, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await notificationAPI.getNotifications({ page: 1, limit: 50 });
        const responseData = res?.data;
        if (responseData?.data) {
          return responseData.data;
        }
        if (responseData?.notifications) {
          return responseData;
        }
        return { notifications: [], pagination: {}, unreadCount: 0 };
      } catch (error) {
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

  const { data: unreadCountData } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      try {
        const res = await notificationAPI.getUnreadCount();
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
      setNotifications([]);
    }
  }, [notificationsData, notificationsLoading]);

  useEffect(() => {
    if (unreadCountData !== undefined) {
      setUnreadCount(unreadCountData);
    }
  }, [unreadCountData]);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNotificationNew = () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notification-unread-count']);
    };

    socket.on('notification_new', handleNotificationNew);

    return () => {
      socket.off('notification_new', handleNotificationNew);
    };
  }, [socket, isConnected, user, queryClient]);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
    } catch (error) {
    }
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['notification-unread-count']);
  }, [queryClient]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
    } catch (error) {
    }
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
