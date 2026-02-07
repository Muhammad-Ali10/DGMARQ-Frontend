import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Bell, Check, Trash2, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';

const SellerNotifications = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['seller-notifications', page],
    queryFn: () => notificationAPI.getNotifications({ page, limit: 10 }).then(res => res.data.data),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['seller-unread-count'],
    queryFn: () => notificationAPI.getUnreadCount().then(res => res.data.data),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => notificationAPI.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-notifications']);
      queryClient.invalidateQueries(['seller-unread-count']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-notifications']);
      queryClient.invalidateQueries(['seller-unread-count']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId) => notificationAPI.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-notifications']);
      queryClient.invalidateQueries(['seller-unread-count']);
    },
  });

  if (isLoading) return <Loading message="Loading notifications..." />;

  const notifications = notificationsData?.notifications || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 mt-1">
            {unreadCount?.unreadCount > 0
              ? `${unreadCount.unreadCount} unread notification${unreadCount.unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount?.unreadCount > 0 && (
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="bg-accent hover:bg-blue-700"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 rounded-lg border ${
                    notification.isRead
                      ? 'bg-secondary border-gray-700'
                      : 'bg-accent/10 border-accent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-5 h-5 text-accent" />
                        {!notification.isRead && (
                          <Badge variant="default" className="bg-accent">
                            New
                          </Badge>
                        )}
                        <span className="text-gray-400 text-sm">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold mb-1">{notification.title || 'Notification'}</h3>
                      <p className="text-gray-300">{notification.message || notification.body}</p>
                      {notification.type && (
                        <Badge variant="outline" className="mt-2">
                          {notification.type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate(notification._id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                            deleteMutation.mutate(notification._id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No notifications yet</p>
              </div>
            )}
          </div>
          {notificationsData?.pagination && (notificationsData.pagination.total ?? 0) > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Page {page} of {notificationsData.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-gray-700 text-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(notificationsData.pagination.totalPages, p + 1))}
                  disabled={page >= notificationsData.pagination.totalPages}
                  className="border-gray-700 text-gray-300"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerNotifications;

