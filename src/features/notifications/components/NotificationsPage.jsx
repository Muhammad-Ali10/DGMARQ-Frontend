import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Loading } from '@components/ui/loading';
import { Bell, Check, Trash2, CheckCheck, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { showSuccess, showApiError } from '@utils/toast';
import { getNotificationPagination, resolveNotificationActionUrl, enterBuyerViewForUrl } from '../utils/notificationActionUrl';
import { invalidateAllNotificationQueries } from '../utils/notificationQueries';
import NotificationFilterTabs from './NotificationFilterTabs';

const NotificationsPage = ({ queryKeyBase, showRefundBadge = false, showActionHint = false }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { roles } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');

  const { data: notificationsData, isLoading, isFetching } = useQuery({
    queryKey: [queryKeyBase, page, filter],
    queryFn: () => notificationAPI
      .getNotifications({
        page,
        limit: 10,
        ...(filter === 'unread' ? { unreadOnly: true } : {}),
        ...(filter === 'read' ? { readOnly: true } : {}),
      })
      .then(res => res.data.data),
    placeholderData: keepPreviousData,
  });

  const onFilterChange = (next) => { setFilter(next); setPage(1); };

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: () => notificationAPI.getUnreadCount().then((res) => res.data?.data?.unreadCount ?? 0),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => notificationAPI.markAsRead(notificationId),
    onSuccess: () => {
      invalidateAllNotificationQueries(queryClient);
    },
    onError: (error) => {
      showApiError(error, 'Failed to mark notification as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      invalidateAllNotificationQueries(queryClient);
      showSuccess('All notifications marked as read');
    },
    onError: (error) => {
      showApiError(error, 'Failed to mark all notifications as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId) => notificationAPI.deleteNotification(notificationId),
    onSuccess: () => {
      invalidateAllNotificationQueries(queryClient);
      showSuccess('Notification deleted successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to delete notification');
    },
  });

  const notifications = notificationsData?.notifications || [];
  const pagination = getNotificationPagination(notificationsData?.pagination, page);

  useEffect(() => {
    if (!isLoading && !isFetching && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [isLoading, isFetching, page, pagination.totalPages]);

  const openNotification = (notification, actionUrl) => {
    enterBuyerViewForUrl(actionUrl, roles);
    navigate(actionUrl);
    if (!notification.isRead) markAsReadMutation.mutate(notification._id);
  };

  if (isLoading && !notificationsData) return <Loading message="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg">Notifications</h1>
          <p className="text-fg-muted mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className=""
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      <NotificationFilterTabs value={filter} onChange={onFilterChange} unreadCount={unreadCount} />

      <Card variant="hud">
        <CardHeader>
          <CardTitle>
            {filter === 'unread' ? 'Unread Notifications' : filter === 'read' ? 'Read Notifications' : 'All Notifications'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const actionUrl = resolveNotificationActionUrl(notification.actionUrl, roles);
                const isRefund = showRefundBadge && notification.type === 'refund';
                return (
                /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
                <div
                  key={notification._id}
                  className={`p-4 rounded-lg border ${
                    notification.isRead
                      ? 'bg-secondary border-border'
                      : 'bg-accent/10 border-accent'
                  } ${actionUrl ? 'cursor-pointer hover:border-accent/50' : ''}`}
                  role={actionUrl ? 'button' : undefined}
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- see above
                  tabIndex={actionUrl ? 0 : undefined}
                  onClick={() => {
                    if (actionUrl) openNotification(notification, actionUrl);
                  }}
                  onKeyDown={(e) => {
                    if (!actionUrl) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openNotification(notification, actionUrl);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-5 h-5 text-accent-on-dark" />
                        {!notification.isRead && (
                          <Badge variant="default" className="bg-accent">
                            New
                          </Badge>
                        )}
                        {isRefund && (
                          <Badge variant="outline" className="border-amber-500 text-warning">
                            Refund
                          </Badge>
                        )}
                        <span className="text-fg-muted text-sm">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-fg font-semibold mb-1">{notification.title || 'Notification'}</h3>
                      <p className="text-fg-muted">{notification.message}</p>
                      {notification.type && !isRefund && (
                        <Badge variant="outline" className="mt-2">
                          {notification.type}
                        </Badge>
                      )}
                      {showActionHint && actionUrl && (
                        <p className="text-accent-on-dark text-sm mt-2 flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          View details
                        </p>
                      )}
                    </div>
                    <div role="presentation" className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
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
                        onClick={() => deleteMutation.mutate(notification._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
              })
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-fg-subtle mx-auto mb-4" />
                <p className="text-fg-muted text-lg">No notifications yet</p>
              </div>
            )}
          </div>
          {pagination.total > 0 && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-brand-cyan/10">
              <p className="text-sm text-fg-muted">
                Page {page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-border text-fg-muted"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || isFetching}
                  className="border-border text-fg-muted"
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

export default NotificationsPage;
