import { memo, useMemo } from 'react';
import { Check, CheckCheck, Clock, AlertCircle, RotateCw, Lock } from 'lucide-react';
import LazyChatImage from './LazyChatImage';
import { timeLabel } from '../utils/supportChat';

/**
 * A single chat message. Wrapped in React.memo with an explicit comparator so a
 * keystroke in the input (or a new message elsewhere) never re-renders bubbles
 * whose own data hasn't changed. Date formatting is memoized per message.
 */
const MessageBubbleBase = ({ message, isMine, isGrouped, onRetry, onOpenImage }) => {
  const time = useMemo(
    () => timeLabel(message.sentAt || message.createdAt),
    [message.sentAt, message.createdAt]
  );

  // System messages (ticket created, status changed, assigned…) render centered.
  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-fg-muted bg-surface-2/60 px-3 py-1 rounded-full">
          {message.messageText}
        </span>
      </div>
    );
  }

  const status = message.__status; // 'sending' | 'failed' | undefined (=sent)
  const isImage = message.messageType === 'image' || !!message.attachment;
  const isInternal = !!message.isInternal;
  const senderName =
    message.senderName || message.senderId?.name || (isMine ? 'You' : 'Support');

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${
        isGrouped ? 'mt-0.5' : 'mt-3'
      } animate-in fade-in slide-in-from-bottom-1 duration-200`}
    >
      <div
        className={`max-w-[78%] rounded-lg px-3 py-2 text-sm break-words ${
          isInternal
            ? 'bg-yellow-900/40 border border-yellow-700/60 text-yellow-100'
            : isMine
              ? 'bg-accent text-fg'
              : 'bg-surface-2 text-gray-100'
        }`}
      >
        {isInternal && (
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-warning/90 mb-1">
            <Lock className="h-3 w-3" /> Internal note
          </div>
        )}
        {!isGrouped && !isMine && !isInternal && (
          <div className="text-xs font-medium opacity-70 mb-1">{senderName}</div>
        )}

        {isImage && message.attachment ? (
          <LazyChatImage
            src={message.attachment}
            alt={message.messageText || 'Attachment'}
            onOpen={onOpenImage}
            className="mb-1"
          />
        ) : null}

        {message.messageText && (message.messageText !== 'Image' || !isImage) && (
          <p className="whitespace-pre-wrap">{message.messageText}</p>
        )}

        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
          <span>{time}</span>
          {isMine && status !== 'failed' && (
            status === 'sending' ? (
              <Clock className="h-3 w-3" aria-label="Sending" />
            ) : message.isRead ? (
              <CheckCheck className="h-3 w-3 text-info" aria-label="Read" />
            ) : (
              <Check className="h-3 w-3" aria-label="Sent" />
            )
          )}
        </div>

        {status === 'failed' && (
          <button
            type="button"
            onClick={() => onRetry?.(message)}
            className="mt-1 flex items-center gap-1 text-[11px] text-danger hover:text-red-200"
          >
            <AlertCircle className="h-3 w-3" /> Failed — retry <RotateCw className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};

const areEqual = (prev, next) =>
  prev.isMine === next.isMine &&
  prev.isGrouped === next.isGrouped &&
  prev.onRetry === next.onRetry &&
  prev.onOpenImage === next.onOpenImage &&
  prev.message._id === next.message._id &&
  prev.message.clientId === next.message.clientId &&
  prev.message.__status === next.message.__status &&
  prev.message.isRead === next.message.isRead &&
  prev.message.isInternal === next.message.isInternal &&
  prev.message.attachment === next.message.attachment &&
  prev.message.messageText === next.message.messageText;

const MessageBubble = memo(MessageBubbleBase, areEqual);
export default MessageBubble;
