import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, MessageSquare } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import { useSelector } from 'react-redux';

/**
 * Chat Notifications Component
 * Displays a bell icon with badge count and dropdown of recent chat notifications
 */
const ChatNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount, markNotificationAsRead, removeNotification } = useChatNotifications();

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

  // Determine chat route based on user role
  const getChatRoute = () => {
    const roles = user?.roles || [];
    const normalizedRoles = Array.isArray(roles) ? roles.map(r => String(r).toLowerCase()) : [];
    
    if (normalizedRoles.includes('admin')) {
      return '/admin/support'; // Admin might not have chat, use support
    } else if (normalizedRoles.includes('seller')) {
      return '/seller/chat';
    } else {
      return '/user/chat';
    }
  };

  const handleNotificationClick = (notification) => {
    const chatRoute = getChatRoute();
    markNotificationAsRead(notification.conversationId);
    setIsOpen(false);
    
    // Navigate to chat with conversation ID
    navigate(`${chatRoute}?conversation=${notification.conversationId}`);
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

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Chat notifications"
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
              <MessageSquare className="w-5 h-5 text-accent" />
              <h3 className="text-white font-semibold text-sm">Chat Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
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
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No new messages</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="p-4 hover:bg-gray-700/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {notification.senderAvatar ? (
                        <img
                          src={notification.senderAvatar}
                          alt={notification.senderName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-accent/30 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent/30 flex-shrink-0">
                          <span className="text-accent font-semibold text-xs">
                            {getInitials(notification.senderName)}
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-white font-medium text-sm truncate">
                            {notification.senderName}
                          </p>
                          <span className="text-gray-400 text-xs flex-shrink-0">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-2">
                          {notification.messageText}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - View All */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(getChatRoute());
                }}
                className="w-full text-center text-accent hover:text-accent/80 text-sm font-medium py-2"
              >
                View All Messages
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatNotifications;

