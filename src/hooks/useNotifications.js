import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../services/api';
import { useSelector } from 'react-redux';
import { invalidateAllNotificationQueries } from '../utils/notificationQueries';
import { playNotificationSound } from '../utils/notificationSound';

/**
 * Optimized notifications hook.
 * Uses local state updates for real-time events, debounced refetch for consistency.
 */
export const useNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // De-dupes by notificationId so a notification that's delivered twice (rare,
  // e.g. socket reconnect replay) is handled once — while EVERY genuinely
  // distinct notification still increments the count and plays a sound.
  const lastNotifIdRef = useRef(null);
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await notificationAPI.getNotifications({ page: 1, limit: 50 });
        const responseData = res?.data;
        if (responseData?.data) return responseData.data;
        if (responseData?.notifications) return responseData;
        return { notifications: [], pagination: {}, unreadCount: 0 };
      } catch {
        return { notifications: [], pagination: {}, unreadCount: 0 };
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: 120000, // Poll every 2 min as consistency fallback
    refetchOnWindowFocus: false,
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      try {
        const res = await notificationAPI.getUnreadCount();
        return res.data?.data?.unreadCount || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: 120000,
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
      // Sync the authoritative server count into local state.
       
      setUnreadCount(unreadCountData);
    }
  }, [unreadCountData]);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNotificationNew = (payload) => {
      // Ignore an exact duplicate of the immediately-preceding event; otherwise
      // EVERY notification (any type) increments the count and plays the ding.
      const id = payload?.notificationId;
      if (id && id === lastNotifIdRef.current) {
        return;
      }
      lastNotifIdRef.current = id || null;

      setUnreadCount((prev) => prev + 1);
      invalidateAllNotificationQueries(queryClient);
      // Sound on every notification type (respects the user's on/off preference,
      // default ON). Browsers may block audio until the first user gesture; the
      // sound util resumes the AudioContext best-effort on play.
      playNotificationSound();
    };

    socket.on('notification_new', handleNotificationNew);

    return () => {
      socket.off('notification_new', handleNotificationNew);
    };
  }, [socket, isConnected, user, queryClient]);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    // Optimistic local update
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    // Persist (non-blocking)
    notificationAPI.markAsRead(notificationId).then(() => {
      invalidateAllNotificationQueries(queryClient);
    }).catch(() => {});
  }, [queryClient]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    // Optimistic local update
    setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    // Persist (non-blocking)
    notificationAPI.deleteNotification(notificationId).then(() => {
      invalidateAllNotificationQueries(queryClient);
    }).catch(() => {});
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotifications,
    removeNotification,
  };
};
