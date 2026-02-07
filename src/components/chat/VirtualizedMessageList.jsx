import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import MessageBubble from './MessageBubble';

const ESTIMATED_ROW_HEIGHT = 80;

const VirtualizedMessageList = ({ messages, currentUserId, scrollContainerRef, onScrollToTop, hasNextPage, isFetchingNextPage }) => {
  const parentRef = scrollContainerRef;
  const prevLastIdRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const lastId = messages.length > 0 ? messages[messages.length - 1]?._id?.toString() : null;
  useEffect(() => {
    if (messages.length === 0) return;
    if (lastId !== prevLastIdRef.current) {
      prevLastIdRef.current = lastId;
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
      });
    }
  }, [messages.length, lastId]);

  useEffect(() => {
    if (!parentRef.current || !onScrollToTop) return;
    const el = parentRef.current;
    const handleScroll = () => {
      if (el.scrollTop < 150 && hasNextPage && !isFetchingNextPage) {
        onScrollToTop();
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [onScrollToTop, hasNextPage, isFetchingNextPage]);

  const renderMessage = useCallback((msg) => {
    const senderInfo = msg.senderId;
    const senderId = senderInfo?._id?.toString() || senderInfo?.toString() || msg.senderId?.toString();
    const senderName = senderInfo?.name || senderInfo?.username || 'Unknown';
    const senderAvatar = senderInfo?.profileImage || null;
    const isOwn = currentUserId?._id && senderId === currentUserId._id.toString();
    return (
      <MessageBubble
        message={msg}
        isOwn={isOwn}
        senderName={senderName}
        senderAvatar={senderAvatar}
      />
    );
  }, [currentUserId]);

  if (messages.length === 0) return null;

  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
      className="max-w-2xl mx-auto"
    >
      {virtualItems.map((virtualRow) => {
        const msg = messages[virtualRow.index];
        return (
          <div
            key={msg._id || virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderMessage(msg)}
          </div>
        );
      })}
    </div>
  );
};

export default VirtualizedMessageList;
