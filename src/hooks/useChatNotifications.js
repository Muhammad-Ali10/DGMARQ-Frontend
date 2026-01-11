import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '../services/api';
import { useSelector } from 'react-redux';

/**
 * Hook to manage real-time chat notifications
 * Listens for new messages and maintains unread notifications
 */
export const useChatNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count
  const { data: initialUnreadCount, error: unreadCountError } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: () => chatAPI.getUnreadCount().then(res => res.data.data?.totalUnread || 0),
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    refetchInterval: 60000, // Refetch every 60 seconds as fallback (reduced from 30)
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Initialize unread count
  useEffect(() => {
    if (initialUnreadCount !== undefined) {
      setUnreadCount(initialUnreadCount);
    }
  }, [initialUnreadCount]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleMessageReceived = (data) => {
      const { conversationId, message } = data;
      
      if (!message || !message.senderId) return;

      // Extract sender info
      const senderId = message.senderId._id || message.senderId;
      const senderName = message.senderId.name || message.senderId.username || 'Unknown';
      const senderAvatar = message.senderId.profileImage || null;
      const messageText = message.messageText || message.message || '';
      const messageId = message._id;
      const sentAt = message.sentAt || message.createdAt || new Date();

      // Don't show notification if message is from current user
      if (senderId.toString() === user._id?.toString()) {
        return;
      }

      // Create notification object
      const notification = {
        id: messageId,
        conversationId: conversationId.toString(),
        senderId: senderId.toString(),
        senderName,
        senderAvatar,
        messageText: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
        sentAt,
        timestamp: new Date(sentAt),
      };

      // Add to notifications list (most recent first)
      setNotifications((prev) => {
        // Remove any existing notification for this conversation (to avoid duplicates)
        const filtered = prev.filter(n => n.conversationId !== notification.conversationId);
        return [notification, ...filtered].slice(0, 10); // Keep only last 10
      });

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Invalidate conversations query to refresh unread counts
      queryClient.invalidateQueries(['seller-conversations']);
      queryClient.invalidateQueries(['user-conversations']);
      queryClient.invalidateQueries(['chat-unread-count']);
    };

    socket.on('message_received', handleMessageReceived);

    return () => {
      socket.off('message_received', handleMessageReceived);
    };
  }, [socket, isConnected, user, queryClient]);

  // Mark notification as read (when user opens chat)
  const markNotificationAsRead = useCallback((conversationId) => {
    setNotifications((prev) => 
      prev.filter(n => n.conversationId !== conversationId.toString())
    );
    
    // Recalculate unread count
    queryClient.invalidateQueries(['chat-unread-count']);
    queryClient.invalidateQueries(['seller-conversations']);
    queryClient.invalidateQueries(['user-conversations']);
  }, [queryClient]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Remove a specific notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => {
      const filtered = prev.filter(n => n.id !== notificationId);
      // Recalculate unread count
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      return filtered;
    });
  }, [unreadCount]);

  return {
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotifications,
    removeNotification,
  };
};

