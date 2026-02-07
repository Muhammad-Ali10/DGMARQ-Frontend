import { useState, useEffect, memo } from 'react';
import { cn } from '../../lib/utils';
import { Loader2, ImageOff } from 'lucide-react';

const getThumbnailUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/w_300,c_limit,q_auto/');
};

const MessageBubble = memo(({ message, isOwn, senderName, senderAvatar }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [message.attachment]);
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
          {message.messageType === 'image' ? (
            <div className="space-y-2">
              {message.localPreviewUrl && !message.attachment ? (
                <div className="relative">
                  <img
                    src={message.localPreviewUrl}
                    alt=""
                    className="max-w-[280px] max-h-[240px] rounded object-cover opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                </div>
              ) : message.uploadStatus === 'pending' && !message.attachment ? (
                <div className="flex items-center gap-2 min-w-[120px] min-h-[80px] bg-gray-700/50 rounded p-3">
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                  <span className="text-xs opacity-80">Uploading...</span>
                </div>
              ) : message.uploadStatus === 'failed' ? (
                <div className="flex items-center gap-2 min-w-[120px] min-h-[80px] bg-red-900/30 rounded p-3">
                  <ImageOff className="h-5 w-5 shrink-0" />
                  <span className="text-xs opacity-80">Upload failed</span>
                </div>
              ) : (message.attachment || message.localPreviewUrl) && !imgError ? (
                <div className="relative">
                  <img
                    src={message.localPreviewUrl || getThumbnailUrl(message.attachment)}
                    alt={message.messageText || 'Image'}
                    loading="lazy"
                    className={cn(
                      'max-w-[280px] max-h-[240px] rounded object-cover cursor-pointer transition-opacity',
                      imgLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                    onClick={() => message.attachment && setLightboxOpen(true)}
                  />
                  {!imgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700/50 rounded min-w-[120px] min-h-[80px]">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              ) : null}
              {(message.messageText && message.messageText !== 'Image') && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.messageText}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.messageText || message.message}
            </p>
          )}
        </div>

        {lightboxOpen && message.attachment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={message.attachment}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Timestamp */}
        <span className="text-gray-500 text-xs mt-1 px-1">
          {formatTime(message.sentAt || message.createdAt)}
        </span>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;

