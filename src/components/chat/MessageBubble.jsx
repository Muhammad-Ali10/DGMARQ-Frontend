import { cn } from '../../lib/utils';

/**
 * Message Bubble Component
 * Displays a single message with avatar, name, text, and timestamp
 */
const MessageBubble = ({ message, isOwn, senderName, senderAvatar }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isOwn ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar - Always show on left for received messages */}
      {!isOwn && (
        <div className="shrink-0">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="w-10 h-10 rounded-full object-cover border-2 border-accent/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent/30">
              <span className="text-accent font-semibold text-xs">
                {getInitials(senderName)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        'flex flex-col',
        isOwn ? 'items-end max-w-[75%]' : 'items-start max-w-[75%]'
      )}>
        {/* Sender Name (only for received messages) */}
        {!isOwn && senderName && (
          <span className="text-gray-400 text-xs mb-1 px-1">
            {senderName}
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-lg px-4 py-2.5 shadow-sm',
            isOwn
              ? 'bg-accent text-white rounded-br-sm'
              : 'bg-gray-800 text-white rounded-bl-sm'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.messageText || message.message}
          </p>
        </div>

        {/* Timestamp */}
        <span className="text-gray-500 text-xs mt-1 px-1">
          {formatTime(message.sentAt || message.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;

