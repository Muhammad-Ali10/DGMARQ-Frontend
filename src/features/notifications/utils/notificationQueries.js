export const invalidateAllNotificationQueries = (queryClient) => {
  const keys = [
    ['notifications'],
    ['seller-notifications'],
    ['admin-notifications'],
    ['notification-unread-count'],
  ];
  keys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
};
