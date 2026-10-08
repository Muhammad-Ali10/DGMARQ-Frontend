import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useSocket } from '@hooks/useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '@services/api';
import { useSelector } from 'react-redux';
import { invalidateAllNotificationQueries } from '../utils/notificationQueries';
import { playNotificationSound } from '../utils/notificationSound';

const LIST_KEY = ['notifications'];
const COUNT_KEY = ['notification-unread-count'];

const formatNotification = (notif) => ({
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
});

export const useNotifications = ({ listEnabled = true } = {}) => {
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const lastNotifIdRef = useRef(null);

  const { data: notificationsData } = useQuery({
    queryKey: LIST_KEY,
    queryFn: async () => {
      try {
        const res = await notificationAPI.getNotifications({ page: 1, limit: 20 });
        const responseData = res?.data;
        if (responseData?.data) return responseData.data;
        if (responseData?.notifications) return responseData;
        return { notifications: [], pagination: {} };
      } catch {
        return { notifications: [], pagination: {} };
      }
    },
    enabled: !!user && listEnabled,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: COUNT_KEY,
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

  const notifications = useMemo(
    () => (Array.isArray(notificationsData?.notifications) ? notificationsData.notifications.map(formatNotification) : []),
    [notificationsData]
  );

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNotificationNew = (payload) => {
      const id = payload?.notificationId;
      if (id && id === lastNotifIdRef.current) {
        return;
      }
      lastNotifIdRef.current = id || null;

      invalidateAllNotificationQueries(queryClient);
      playNotificationSound();
    };

    socket.on('notification_new', handleNotificationNew);

    return () => {
      socket.off('notification_new', handleNotificationNew);
    };
  }, [socket, isConnected, user, queryClient]);

  const patchList = useCallback((fn) => {
    queryClient.setQueryData(LIST_KEY, (old) =>
      old && Array.isArray(old.notifications) ? { ...old, notifications: fn(old.notifications) } : old
    );
  }, [queryClient]);

  const decrementUnread = useCallback(() => {
    queryClient.setQueryData(COUNT_KEY, (count) => Math.max(0, (Number(count) || 0) - 1));
  }, [queryClient]);

  const resync = useCallback(() => invalidateAllNotificationQueries(queryClient), [queryClient]);

  const markNotificationAsRead = useCallback((notification) => {
    if (!notification?.notificationId || notification.isRead) return;
    const id = notification.notificationId;
    patchList((list) => list.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    decrementUnread();
    notificationAPI.markAsRead(id).then(resync, resync);
  }, [patchList, decrementUnread, resync]);

  const removeNotification = useCallback((notification) => {
    if (!notification?.notificationId) return;
    const id = notification.notificationId;
    patchList((list) => list.filter((n) => n._id !== id));
    if (!notification.isRead) decrementUnread();
    notificationAPI.deleteNotification(id).then(resync, resync);
  }, [patchList, decrementUnread, resync]);

  return {
    notifications,
    unreadCount,
    markNotificationAsRead,
    removeNotification,
  };
};
