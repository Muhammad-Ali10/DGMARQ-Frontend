import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../hooks/useSocket';
import { invalidateAllNotificationQueries } from '../../utils/notificationQueries';
import NotificationsPage from '../../components/notifications/NotificationsPage';

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  // Admin-only: refresh the list in real time when a new notification arrives.
  // Kept in the wrapper (not the shared page) so the user/seller pages keep
  // their existing socket behavior (no extra useSocket consumer).
  useEffect(() => {
    if (!socket || !isConnected) return;
    const onNewNotification = () => {
      invalidateAllNotificationQueries(queryClient);
    };
    socket.on('notification_new', onNewNotification);
    return () => socket.off('notification_new', onNewNotification);
  }, [socket, isConnected, queryClient]);

  return <NotificationsPage queryKeyBase="admin-notifications" />;
};

export default AdminNotifications;
