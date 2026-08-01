import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { returnRefundAPI } from '@services/api';
import { useSocket } from '@hooks/useSocket';
import { Send, Loader2, ImagePlus, X, CheckCheck, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import SafeImage from '@components/ui/safe-image';

// M12: a refund in a FINAL state has a hard-locked chat (matches the backend
// guard in addRefundMessage). SELLER_REJECTED stays open — buyer can escalate.
export const isRefundChatLocked = (status) =>
  ['COMPLETED', 'ADMIN_REJECTED', 'completed', 'rejected'].includes(status);

/**
 * WhatsApp-style refund chat with optimistic updates.
 * - Customer and Admin can always send.
 * - Seller can only send when admin requests input (pass canSend accordingly).
 * - Pass `locked` when the refund is in a final state: input is hidden and a
 *   "chat closed" notice is shown regardless of role.
 */
export default function RefundChat({ refundId, canSend, locked = false }) {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?._id;

  const [localMessage, setLocalMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const selectedImagesRef = useRef([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const { socket, isConnected } = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: ['refund-messages', refundId],
    queryFn: () =>
      returnRefundAPI
        .getRefundMessages(refundId)
        .then((res) => res.data.data?.messages || []),
    enabled: !!refundId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Memoized so the scroll effect below doesn't see a new array identity on
  // every render (react-hooks/exhaustive-deps).
  const messages = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const addMessageMutation = useMutation({
    mutationFn: (payload) => returnRefundAPI.addRefundMessage(refundId, payload),
    onMutate: async (payload) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['refund-messages', refundId] });

      const previousMessages = queryClient.getQueryData(['refund-messages', refundId]);

      // Only add optimistic message for text-only (not FormData/images)
      if (!(payload instanceof FormData)) {
        const optimisticMessage = {
          _id: `optimistic-${Date.now()}`,
          senderId: currentUserId,
          senderRole: user?.roles?.includes('admin') ? 'admin' : user?.roles?.includes('seller') ? 'seller' : 'customer',
          message: payload.message,
          attachments: [],
          createdAt: new Date().toISOString(),
          _optimistic: true,
        };

        queryClient.setQueryData(['refund-messages', refundId], (old) => {
          const existing = Array.isArray(old) ? old : [];
          return [...existing, optimisticMessage];
        });
      }

      return { previousMessages };
    },
    onError: (err, _payload, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['refund-messages', refundId], context.previousMessages);
      }
      const msg = err.response?.data?.message || 'Failed to send message';
      if (err.response?.status === 429) {
        toast.error('Sending too fast. Please wait a moment.');
      } else {
        toast.error(msg);
      }
    },
    onSuccess: () => {
      // Replace optimistic messages with real server data
      queryClient.invalidateQueries({ queryKey: ['refund-messages', refundId] });
      setLocalMessage('');
      setSelectedImages((prev) => {
        prev.forEach((item) => URL.revokeObjectURL(item.preview));
        return [];
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  });

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Real-time updates via Socket.IO — append directly instead of refetching
  useEffect(() => {
    if (!socket || !refundId) return;

    const handleRefundMessage = (payload) => {
      if (!payload || !payload.refundId) return;
      if (payload.refundId.toString() !== refundId.toString()) return;

      const incoming = payload.message;
      if (!incoming) return;

      // Skip if the message is from current user (already handled by optimistic update)
      const senderId = incoming.senderId?._id || incoming.senderId;
      if (senderId?.toString() === currentUserId?.toString()) {
        // Still sync to replace optimistic with real data, but debounced
        queryClient.invalidateQueries({ queryKey: ['refund-messages', refundId] });
        return;
      }

      // Append incoming message directly to cache (no refetch needed)
      queryClient.setQueryData(['refund-messages', refundId], (old) => {
        const existing = Array.isArray(old) ? old : [];
        // Deduplicate by _id
        if (incoming._id && existing.some((m) => m._id === incoming._id)) {
          return existing;
        }
        return [...existing, incoming];
      });
    };

    socket.on('refund_message', handleRefundMessage);
    return () => {
      socket.off('refund_message', handleRefundMessage);
    };
  }, [socket, isConnected, refundId, queryClient, currentUserId]);

  function handleFileChange(event) {
    const incoming = Array.from(event.target.files || []);
    if (incoming.length === 0) return;

    const next = [...selectedImages];
    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are allowed');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is larger than 5MB`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} images`);
        break;
      }
      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setSelectedImages(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(imageId) {
    setSelectedImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== imageId);
    });
  }

  function handleSend(e) {
    e?.preventDefault();
    const msg = (localMessage || '').trim();
    if ((!msg && selectedImages.length === 0) || !canSend || locked) return;
    if (addMessageMutation.isPending) return;

    if (selectedImages.length > 0) {
      const formData = new FormData();
      if (msg) formData.append('message', msg);
      selectedImages.forEach((item) => formData.append('images', item.file));
      addMessageMutation.mutate(formData);
      return;
    }

    addMessageMutation.mutate({ message: msg });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function isOwnMessage(m) {
    if (!currentUserId) return false;
    const senderId = m.senderId?._id || m.senderId;
    return senderId?.toString() === currentUserId.toString();
  }

  function isSystemMessage(m) {
    return m.senderRole === 'system';
  }

  function getRoleBadgeColor(role) {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-danger';
      case 'seller': return 'bg-amber-500/20 text-warning';
      case 'customer': return 'bg-blue-500/20 text-info';
      default: return 'bg-gray-500/20 text-fg-muted';
    }
  }

  // Group messages by date
  const groupedMessages = [];
  let lastDate = '';
  for (const m of messages) {
    const date = formatDate(m.createdAt);
    if (date !== lastDate) {
      groupedMessages.push({ type: 'date', date });
      lastDate = date;
    }
    groupedMessages.push({ type: 'message', data: m });
  }

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15">
          <MessageSquare className="w-4 h-4 text-accent-on-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-fg">Refund Chat</p>
          <p className="text-xs text-fg-subtle">
            {isConnected ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                Connecting...
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-1 min-h-[180px] max-h-[52vh] sm:max-h-[400px]"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(14, 81, 226, 0.03) 0%, transparent 50%)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-fg-muted py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-fg-subtle">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation</p>
          </div>
        ) : (
          groupedMessages.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${idx}`} className="flex justify-center py-2">
                  <span className="px-3 py-1 text-[11px] font-medium text-fg-muted bg-white/[0.05] rounded-full">
                    {item.date}
                  </span>
                </div>
              );
            }

            const m = item.data;
            const own = isOwnMessage(m);
            const system = isSystemMessage(m);
            const optimistic = m._optimistic;

            if (system) {
              return (
                <div key={m._id} className="flex justify-center py-1">
                  <div className="px-4 py-1.5 text-xs text-fg-muted bg-white/[0.04] rounded-full border border-white/[0.04] max-w-[80%] text-center">
                    {m.message}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m._id}
                className={`flex ${own ? 'justify-end' : 'justify-start'} mb-1`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-3 py-2 ${
                    own
                      ? 'bg-accent/90 rounded-br-md'
                      : 'bg-white/[0.06] rounded-bl-md'
                  } ${optimistic ? 'opacity-70' : ''}`}
                >
                  {!own && (
                    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1 ${getRoleBadgeColor(m.senderRole)}`}>
                      {m.senderRole}
                    </span>
                  )}

                  {m.message && (
                    <p className={`text-[13px] sm:text-sm leading-relaxed break-words ${own ? 'text-fg' : 'text-fg'}`}>
                      {m.message}
                    </p>
                  )}

                  {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                    <div className={`grid gap-1.5 mt-1.5 ${m.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {m.attachments.map((attachment, aIdx) => (
                        <a
                          key={`${m._id}-att-${aIdx}`}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                        >
                          <SafeImage
                            src={attachment.url}
                            alt={`Attachment ${aIdx + 1}`}
                            className="w-full h-24 sm:h-32 object-cover"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className={`flex items-center gap-1 mt-1 ${own ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${own ? 'text-fg/60' : 'text-fg-subtle'}`}>
                      {formatTime(m.createdAt)}
                    </span>
                    {own && (
                      optimistic
                        ? <Loader2 className="w-3 h-3 animate-spin text-fg/50" />
                        : <CheckCheck className="w-3.5 h-3.5 text-fg/60" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {locked ? (
        <div className="border-t border-white/[0.06] px-4 py-3 text-center">
          <p className="text-xs text-fg-subtle">
            This refund request is closed — the chat is locked.
          </p>
        </div>
      ) : canSend ? (
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          {selectedImages.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
              {selectedImages.map((item) => (
                <div key={item.id} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/[0.1]">
                  <SafeImage src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-fg hover:bg-black/90 transition-colors"
                    onClick={() => removeImage(item.id)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            aria-label="Attach an image to this message"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={addMessageMutation.isPending || selectedImages.length >= MAX_FILES}
              className="shrink-0 p-2.5 rounded-full text-fg-muted hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
            >
              <ImagePlus className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                aria-label="Message"
                value={localMessage}
                onChange={(e) => setLocalMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-[13px] sm:text-sm text-fg placeholder:text-gray-500 resize-none focus:outline-none focus:border-accent/50 transition-colors max-h-24 overflow-y-auto"
                style={{ minHeight: '40px' }}
              />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={addMessageMutation.isPending || (!localMessage.trim() && selectedImages.length === 0)}
              className="shrink-0 p-2.5 rounded-full bg-accent hover:bg-accent/80 text-fg transition-colors disabled:opacity-40 disabled:hover:bg-accent"
            >
              {addMessageMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/[0.06] px-4 py-3 text-center">
          <p className="text-xs text-fg-subtle">You can only reply when admin requests your input.</p>
        </div>
      )}
    </div>
  );
}
