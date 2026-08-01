import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, ChevronDown } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ImageLightbox from './ImageLightbox';
import TypingIndicator from './TypingIndicator';
import { isMineForSide, isGroupedWith, sameDay, dayLabel } from '../utils/supportChat';

const BOTTOM_THRESHOLD = 80; // px from bottom still counts as "at bottom"
const TOP_THRESHOLD = 60; // px from top triggers "load older"
const ESTIMATED_ROW_HEIGHT = 72; // rough first-paint estimate; rows self-measure

/**
 * Scrollable message viewport shared by every support chat UI.
 *
 * Performance behaviours:
 *  - Rows are windowed with @tanstack/react-virtual (dynamic measurement), so a
 *    long support thread never mounts every bubble. Matches the buyer/seller
 *    chat (see chat/VirtualizedMessageList.jsx).
 *  - Infinite upward pagination (onLoadOlder) with scroll-position preservation.
 *  - Smart auto-scroll: jumps to bottom on a new message ONLY when already near
 *    the bottom (or the message is mine); otherwise shows a "New messages"
 *    pill instead of yanking the user away from history.
 *  - Scroll handler throttled with requestAnimationFrame.
 *  - Each bubble is React.memo'd; date separators + sender grouping computed here.
 */
const MessageList = ({
  messages,
  side = 'customer',
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  onRetry,
  typing = false,
  typingLabel = 'Support',
  emptyText = 'No messages yet',
  className = '',
}) => {
  const containerRef = useRef(null);
  const atBottomRef = useRef(true);
  const rafRef = useRef(0);
  const prevLastKeyRef = useRef(null);
  const prevLenRef = useRef(0);
  const [showJump, setShowJump] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const openImage = useCallback((src) => setLightbox(src), []);
  const closeImage = useCallback(() => setLightbox(null), []);

  // Precompute per-message rendering flags (mine / grouped / day separator).
  const rows = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = i > 0 ? messages[i - 1] : null;
      const ts = msg.sentAt || msg.createdAt;
      const prevTs = prev ? prev.sentAt || prev.createdAt : null;
      const showDay = !prev || !sameDay(ts, prevTs);
      return {
        msg,
        key: msg._id || msg.clientId,
        isMine: isMineForSide(msg, side),
        isGrouped: !showDay && isGroupedWith(msg, prev),
        showDay,
        dayText: showDay ? dayLabel(ts) : null,
      };
    });
  }, [messages, side]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
    getItemKey: (index) => rows[index]?.key ?? index,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = containerRef.current;
    if (!el) return;
    if (rows.length > 0) {
      rowVirtualizer.scrollToIndex(rows.length - 1, { align: 'end', behavior });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
    atBottomRef.current = true;
    setShowJump(false);
  }, [rows.length, rowVirtualizer]);

  // rAF-throttled scroll handler: tracks bottom proximity and triggers
  // upward pagination with scroll-anchor preservation.
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = containerRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      atBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD;
      if (atBottomRef.current && showJump) setShowJump(false);

      if (el.scrollTop < TOP_THRESHOLD && hasMore && !isLoadingOlder && onLoadOlder) {
        const prevHeight = el.scrollHeight;
        const prevTop = el.scrollTop;
        Promise.resolve(onLoadOlder()).then((added) => {
          if (added > 0) {
            requestAnimationFrame(() => {
              const el2 = containerRef.current;
              if (el2) el2.scrollTop = el2.scrollHeight - prevHeight + prevTop;
            });
          }
        });
      }
    });
  }, [hasMore, isLoadingOlder, onLoadOlder, showJump]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // Keep the typing indicator in view if the user is already at the bottom.
  useEffect(() => {
    if (typing && atBottomRef.current) {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [typing]);

  // Auto-scroll decision runs whenever the message set changes. Only an APPENDED
  // last message (new key at the tail) triggers it — prepended history keeps its
  // key at the tail unchanged, so it never auto-scrolls.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || rows.length === 0) {
      prevLenRef.current = messages.length;
      return;
    }
    const last = messages[messages.length - 1];
    const lastKey = last ? last._id || last.clientId : null;
    const wasEmpty = prevLenRef.current === 0;
    const appended = lastKey && lastKey !== prevLastKeyRef.current;

    if (wasEmpty && messages.length > 0) {
      // initial load: land at the bottom
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(rows.length - 1, { align: 'end' });
      });
    } else if (appended) {
      const mine = last && isMineForSide(last, side);
      const stick = atBottomRef.current || mine;
      if (stick) {
        requestAnimationFrame(() => {
          rowVirtualizer.scrollToIndex(rows.length - 1, { align: 'end' });
        });
      }
      // Reacting to an inbound message: stick to bottom if near it, otherwise
      // surface the "new messages" pill.
       
      setShowJump(!stick);
    }
    prevLastKeyRef.current = lastKey;
    prevLenRef.current = messages.length;
  }, [messages, side, rows.length, rowVirtualizer]);

  return (
    <div className={`relative flex-1 overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-3 py-2"
      >
        {isLoadingOlder && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-fg-muted" />
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <div className="text-center text-[11px] text-fg-subtle py-2">
            Beginning of the conversation
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-fg-muted text-sm text-center px-4">
            {emptyText}
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;
              const { msg, key, isMine, isGrouped, showDay, dayText } = row;
              return (
                <div
                  key={key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {showDay && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] text-fg-muted bg-surface-2/80 px-3 py-0.5 rounded-full">
                        {dayText}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isMine={isMine}
                    isGrouped={isGrouped}
                    onRetry={onRetry}
                    onOpenImage={openImage}
                  />
                </div>
              );
            })}
          </div>
        )}
        {typing && <TypingIndicator label={typingLabel} />}
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-accent text-fg text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:opacity-90 transition-opacity"
        >
          New messages <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}

      <ImageLightbox src={lightbox} onClose={closeImage} />
    </div>
  );
};

export default MessageList;
