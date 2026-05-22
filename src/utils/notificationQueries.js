/**
 * Invalidate all notification-related React Query caches (bell + role pages + dashboard).
 */
export const invalidateAllNotificationQueries = (queryClient) => {
  const keys = [
    ['notifications'],
    ['seller-notifications'],
    ['admin-notifications'],
    ['notification-unread-count'],
    ['unread-count'],
    ['seller-unread-count'],
    ['admin-unread-count'],
    ['unread-notifications'],
  ];
  keys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
};
