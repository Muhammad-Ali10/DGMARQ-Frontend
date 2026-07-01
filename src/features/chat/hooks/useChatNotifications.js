import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@hooks/useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '@services/api';
import { useSelector } from 'react-redux';

/**
 * Optimized chat notifications hook.
 * Uses local state updates instead of query invalidation for real-time events.
 */
export const useChatNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const debounceRef = useRef(null);

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['chat-notifications'],
    queryFn: async () => {
      try {
        const res = await notificationAPI.getNotifications({ page: 1, limit: 20, type: 'chat' });
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
    refetchInterval: 120000, // Poll every 2 min as fallback (was 60s)
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
      const chatNotifications = notificationsList.map(notif => {
        const data = notif.data || {};
        return {
          id: notif._id,
          notificationId: notif._id,
          conversationId: data.conversationId || '',
          senderId: data.senderId || '',
          senderName: data.senderName || notif.title?.replace('New message from ', '') || 'Unknown',
          senderAvatar: data.senderAvatar || null,
          messageText: notif.message || '',
          sentAt: notif.createdAt,
          timestamp: new Date(notif.createdAt),
          isRead: notif.isRead || false,
        };
      });
      setNotifications(chatNotifications);
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

    const handleMessageReceived = (data) => {
      const { message } = data;
      if (!message || !message.senderId) return;
      const senderId = message.senderId._id || message.senderId;
      // Skip own messages
      if (senderId.toString() === user._id?.toString()) return;

      // Note: the unread-count increment lives solely in the `notification_new`
      // (chat) handler below — the canonical persistent notification — to avoid
      // double-counting the same inbound chat message.

      // Debounced notification refetch — batch multiple rapid messages into one refetch
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['chat-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
        debounceRef.current = null;
      }, 3000);
    };

    const handleNotificationNew = (payload) => {
      // Only handle chat-type notifications here
      if (payload?.type === 'chat') {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('notification_new', handleNotificationNew);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('notification_new', handleNotificationNew);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [socket, isConnected, user, queryClient]);

  const markNotificationAsRead = useCallback(async (conversationId) => {
    const conversationNotifications = notifications.filter(
      n => n.conversationId === conversationId.toString() && !n.isRead
    );
    // Mark locally first (optimistic)
    if (conversationNotifications.length > 0) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.conversationId === conversationId.toString() ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - conversationNotifications.length));
    }
    // Then persist to server (non-blocking)
    for (const notif of conversationNotifications) {
      if (notif.notificationId) {
        notificationAPI.markAsRead(notif.notificationId).catch(() => {});
      }
    }
  }, [notifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    // Remove locally first
    setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    // Then persist
    notificationAPI.deleteNotification(notificationId).catch(() => {});
  }, []);

  return {
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotifications,
    removeNotification,
  };
};
