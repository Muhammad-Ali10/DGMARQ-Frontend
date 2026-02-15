import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatAPI, notificationAPI } from '../services/api';
import { useSelector } from 'react-redux';

/**
 * Fetches chat notifications and listens for new messages via socket.
 */
export const useChatNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notificationsData, error: notificationsError, isLoading: notificationsLoading } = useQuery({
    queryKey: ['chat-notifications'],
    queryFn: async () => {
      try {
        const res = await notificationAPI.getNotifications({ page: 1, limit: 20, type: 'chat' });
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
      const { conversationId, message } = data;
      if (!message || !message.senderId) return;
      const senderId = message.senderId._id || message.senderId;
      if (senderId.toString() === user._id?.toString()) {
        return;
      }
      queryClient.invalidateQueries(['chat-notifications']);
      queryClient.invalidateQueries(['notification-unread-count']);
      queryClient.invalidateQueries(['seller-conversations']);
      queryClient.invalidateQueries(['user-conversations']);
    };

    const handleNotificationNew = () => {
      queryClient.invalidateQueries(['chat-notifications']);
      queryClient.invalidateQueries(['notification-unread-count']);
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('notification_new', handleNotificationNew);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('notification_new', handleNotificationNew);
    };
  }, [socket, isConnected, user, queryClient]);

  const markNotificationAsRead = useCallback(async (conversationId) => {
    const conversationNotifications = notifications.filter(
      n => n.conversationId === conversationId.toString() && !n.isRead
    );
    for (const notif of conversationNotifications) {
      if (notif.notificationId) {
        try {
          await notificationAPI.markAsRead(notif.notificationId);
        } catch (error) {
        }
      }
    }
    queryClient.invalidateQueries(['chat-notifications']);
    queryClient.invalidateQueries(['notification-unread-count']);
    queryClient.invalidateQueries(['seller-conversations']);
    queryClient.invalidateQueries(['user-conversations']);
  }, [notifications, queryClient]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
    } catch (error) {
    }
    queryClient.invalidateQueries(['chat-notifications']);
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

