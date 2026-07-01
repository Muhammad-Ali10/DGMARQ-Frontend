// Public surface of the notifications feature. Import from '@features/notifications'
// — never reach into the feature's internal files from outside.
export { default as NotificationBell } from './components/NotificationBell';
export { default as NotificationsPage } from './components/NotificationsPage';
export { useNotifications } from './hooks/useNotifications';
export { invalidateAllNotificationQueries } from './utils/notificationQueries';
