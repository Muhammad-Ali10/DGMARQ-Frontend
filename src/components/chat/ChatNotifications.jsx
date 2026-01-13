import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, MessageSquare, ShoppingBag, DollarSign, RefreshCw, Star } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../hooks/useNotifications';
import { useSelector } from 'react-redux';

/**
 * Notifications Component
 * Displays a bell icon with badge count and dropdown of all notifications
 */
const ChatNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount, markNotificationAsRead, removeNotification } = useNotifications();
  
  // Filter to show only unread notifications first, then read ones
  const sortedNotifications = Array.isArray(notifications) 
    ? [...notifications].sort((a, b) => {
        if (a.isRead === b.isRead) {
          return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
        }
        return a.isRead ? 1 : -1;
      })
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Determine notifications route based on user role
  const getNotificationsRoute = () => {
    const roles = user?.roles || [];
    const normalizedRoles = Array.isArray(roles) ? roles.map(r => String(r).toLowerCase()) : [];
    
    if (normalizedRoles.includes('admin')) {
      return '/admin/notifications';
    } else if (normalizedRoles.includes('seller')) {
      return '/seller/notifications';
    } else {
      return '/user/notifications';
    }
  };

  // Determine chat route based on user role
  const getChatRoute = () => {
    const roles = user?.roles || [];
    const normalizedRoles = Array.isArray(roles) ? roles.map(r => String(r).toLowerCase()) : [];
    
    if (normalizedRoles.includes('admin')) {
      return '/admin/support';
    } else if (normalizedRoles.includes('seller')) {
      return '/seller/chat';
    } else {
      return '/user/chat';
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark notification as read
    await markNotificationAsRead(notification.notificationId || notification.id);
    setIsOpen(false);
    
    // Navigate based on notification type and actionUrl
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.type === 'chat' && notification.data?.conversationId) {
      const chatRoute = getChatRoute();
      navigate(`${chatRoute}?conversation=${notification.data.conversationId}`);
    } else {
      // Default: navigate to notifications page
      navigate(getNotificationsRoute());
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'chat':
        return MessageSquare;
      case 'order':
        return ShoppingBag;
      case 'payout':
        return DollarSign;
      case 'refund':
        return RefreshCw;
      case 'review':
        return Star;
      case 'system':
      default:
        return Bell;
    }
  };

  const getNotificationIconColor = (type) => {
    switch (type) {
      case 'chat':
        return 'text-blue-400';
      case 'order':
        return 'text-green-400';
      case 'payout':
        return 'text-yellow-400';
      case 'refund':
        return 'text-orange-400';
      case 'review':
        return 'text-purple-400';
      case 'system':
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute right-0 mt-2 w-80 bg-[#041536] border border-gray-700 rounded-lg shadow-xl z-50',
            'max-h-96 overflow-hidden flex flex-col'
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" />
              <h3 className="text-white font-semibold text-sm">Notifications</h3>
              {sortedNotifications.filter(n => !n.isRead).length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {sortedNotifications.filter(n => !n.isRead).length} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Notifications List */}
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
                  const IconComponent = getNotificationIcon(notification.type);
                  const iconColor = getNotificationIconColor(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "p-4 hover:bg-gray-700/50 cursor-pointer transition-colors group",
                        !notification.isRead && "bg-accent/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0",
                          !notification.isRead && "bg-accent/20"
                        )}>
                          <IconComponent className={cn("w-5 h-5", iconColor)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">
                                {notification.title}
                              </p>
                              {notification.type && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {notification.type}
                                </Badge>
                              )}
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm line-clamp-2">
                            {notification.message}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.notificationId || notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600 rounded"
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

          {/* Footer - View All */}
          {sortedNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(getNotificationsRoute());
                }}
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

export default ChatNotifications;

