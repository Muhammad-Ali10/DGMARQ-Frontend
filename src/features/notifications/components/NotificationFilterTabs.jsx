import { cn } from '@lib/utils';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

/**
 * All / Unread / Read filter tabs for the notification pages.
 * Controlled: pass `value` and `onChange`. Optional `unreadCount` shows a badge.
 */
const NotificationFilterTabs = ({ value, onChange, unreadCount = 0 }) => (
  <div className="inline-flex rounded-lg border border-border bg-secondary p-1">
    {TABS.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onChange(tab.key)}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
          value === tab.key
            ? 'bg-accent text-fg'
            : 'text-fg-muted hover:text-white hover:bg-gray-700/50',
        )}
      >
        {tab.label}
        {tab.key === 'unread' && unreadCount > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive px-1.5 text-xs text-fg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    ))}
  </div>
);

export default NotificationFilterTabs;
