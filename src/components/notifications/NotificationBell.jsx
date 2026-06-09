import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, X, MessageSquare, ShoppingBag, DollarSign, RefreshCw, Star,
  LifeBuoy, Heart, Package, ShieldAlert, CreditCard, Volume2, VolumeX, CheckCheck,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../hooks/useNotifications';
import { resolveNotificationActionUrl } from '../../utils/notificationActionUrl';
import { invalidateAllNotificationQueries } from '../../utils/notificationQueries';
import { notificationAPI } from '../../services/api';
import { isSoundEnabled, setSoundEnabled, subscribeSoundPref } from '../../utils/notificationSound';

/**
 * Global notification bell: unread badge, dropdown list, mark-read, remove,
 * mark-all-read, a sound on/off toggle, and a "View all" link. Real-time via
 * useNotifications (Socket.IO + polling) which also plays the ding.
 */
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, roles: authRoles } = useSelector((state) => state.auth);
  const roles = authRoles?.length ? authRoles : (user?.roles || []);
  const { notifications, unreadCount, markNotificationAsRead, removeNotification } = useNotifications();

  // Keep the toggle in sync if changed from another tab/component.
  useEffect(() => subscribeSoundPref(setSoundOn), []);

  const sortedNotifications = Array.isArray(notifications)
    ? [...notifications].sort((a, b) => {
        if (a.isRead === b.isRead) return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
        return a.isRead ? 1 : -1;
      })
    : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const normalizedRoles = Array.isArray(roles) ? roles.map((r) => String(r).toLowerCase()) : [];
  const rolePrefix = normalizedRoles.includes('admin') ? '/admin'
    : normalizedRoles.includes('seller') ? '/seller' : '/user';
  const getNotificationsRoute = () => `${rolePrefix}/notifications`;

  const handleNotificationClick = async (notification) => {
    await markNotificationAsRead(notification.notificationId || notification.id);
    setIsOpen(false);
    const actionUrl = resolveNotificationActionUrl(notification.actionUrl, roles);
    if (actionUrl) navigate(actionUrl);
    else navigate(getNotificationsRoute());
  };

  const handleMarkAll = async () => {
    try {
      await notificationAPI.markAllAsRead();
      invalidateAllNotificationQueries(queryClient);
    } catch { /* non-blocking */ }
  };

  const toggleSound = () => setSoundEnabled(!soundOn);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const ICONS = {
    chat: MessageSquare, order: ShoppingBag, payout: DollarSign, refund: RefreshCw,
    review: Star, support: LifeBuoy, wishlist: Heart, product: Package,
    account: ShieldAlert, subscription: CreditCard,
  };
  const ICON_COLORS = {
    chat: 'text-blue-400', order: 'text-green-400', payout: 'text-yellow-400',
    refund: 'text-orange-400', review: 'text-purple-400', support: 'text-cyan-400',
    wishlist: 'text-pink-400', product: 'text-emerald-400', account: 'text-red-400',
    subscription: 'text-indigo-400',
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute right-0 mt-2 w-80 sm:w-96 bg-[#041536] border border-gray-700 rounded-lg shadow-xl z-50',
            'max-h-[28rem] overflow-hidden flex flex-col'
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" />
              <h3 className="text-white font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                title={soundOn ? 'Sound on — click to mute' : 'Sound off — click to enable'}
                className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-white rounded transition-colors"
              >
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  title="Mark all as read"
                  className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-white rounded transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7 text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {sortedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notifications</p>
                <p className="text-xs text-gray-500 mt-1">New notifications will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {sortedNotifications.map((notification) => {
                  const IconComponent = ICONS[notification.type] || Bell;
                  const iconColor = ICON_COLORS[notification.type] || 'text-gray-400';
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'p-4 hover:bg-gray-700/50 cursor-pointer transition-colors group',
                        !notification.isRead && 'bg-accent/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0',
                          !notification.isRead && 'bg-accent/20'
                        )}>
                          <IconComponent className={cn('w-5 h-5', iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-white font-medium text-sm truncate">{notification.title}</p>
                            <span className="text-gray-400 text-xs flex-shrink-0">{formatTime(notification.timestamp)}</span>
                          </div>
                          <p className="text-gray-300 text-sm line-clamp-2">{notification.message}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNotification(notification.notificationId || notification.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600 rounded"
                          aria-label="Remove notification"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {sortedNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={() => { setIsOpen(false); navigate(getNotificationsRoute()); }}
                className="w-full text-center text-accent hover:text-accent/80 text-sm font-medium py-2"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
