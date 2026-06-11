import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '../../services/api';
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { MessageSquare, Send, ImagePlus } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import ErrorBoundary from '../../components/ErrorBoundary';
import MessageBubble from '../../components/chat/MessageBubble';
import ChatMessageSkeleton from '../../components/chat/ChatMessageSkeleton';
import { useSelector } from 'react-redux';
import { showApiError } from '../../utils/toast';

// ─── Helper: append message to infinite query cache with dedup ───
function appendMessageToCache(queryClient, queryKey, newMsg) {
  queryClient.setQueryData(queryKey, (old) => {
    if (!old?.pages?.length) return old;
    const lastPage = old.pages[old.pages.length - 1];
    const existing = lastPage.messages || [];
    const msgId = newMsg._id?.toString();

    // Dedup by _id
    if (msgId && existing.some(m => m._id?.toString() === msgId)) return old;

    // Remove optimistic message that this real message replaces
    const filtered = existing.filter(m => {
      if (!m.isOptimistic) return true;
      const mText = m.messageText || '';
      const nText = newMsg.messageText || '';
      const mSender = m.senderId?._id?.toString() || m.senderId?.toString();
      const nSender = newMsg.senderId?._id?.toString() || newMsg.senderId?.toString();
      return !(mText === nText && mSender === nSender);
    });

    return {
      ...old,
      pages: old.pages.map((page, i) =>
        i === old.pages.length - 1
          ? { ...page, messages: [...filtered, newMsg] }
          : page
      ),
    };
  });
}

const CONVERSATIONS_DEBOUNCE_MS = 2000;
let userConversationsCache = { ts: 0, data: [], pending: null };

const UserChat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationFromUrl = searchParams.get('conversation');
  const [selectedConversation, setSelectedConversation] = useState(conversationFromUrl || null);
  const [message, setMessage] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const isTypingRef = useRef(false);
  const typingStopTimerRef = useRef(null);
  const peerTypingTimerRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fetchNextPageTimeoutRef = useRef(null);
  // ─── Scroll management state (per conversation) ───
  // initialScrollDone: have we pinned to the bottom for this conversation yet?
  // prependAnchor: scrollHeight/scrollTop captured right before loading an older
  // page, so we can restore the visual position after the older messages prepend.
  // scrollMeta: first/last message ids of the last render, to tell a prepend
  // (older page) apart from an append (new incoming/sent message).
  const initialScrollDoneRef = useRef(false);
  const prependAnchorRef = useRef(null);
  const scrollMetaRef = useRef({ firstId: null, lastId: null });
  const selectedConversationRef = useRef(selectedConversation);
  selectedConversationRef.current = selectedConversation;
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { markNotificationAsRead } = useChatNotifications();
  const { user } = useSelector((state) => state.auth);
  const myId = user?._id?.toString();

  // ─── Conversations query ───
  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['user-conversations'],
    queryFn: async () => {
      const now = Date.now();
      if (userConversationsCache.pending) return userConversationsCache.pending;
      if (now - userConversationsCache.ts < CONVERSATIONS_DEBOUNCE_MS) {
        return userConversationsCache.data;
      }
      userConversationsCache.pending = chatAPI
        .getConversations({ role: 'buyer' })
        .then((res) => {
          const payload = res?.data?.data;
          const normalized = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.conversations)
              ? payload.conversations
              : [];
          userConversationsCache = { ts: Date.now(), data: normalized, pending: null };
          return normalized;
        })
        .catch((error) => {
          userConversationsCache.pending = null;
          throw error;
        });
      return userConversationsCache.pending;
    },
    enabled: !!user,
    staleTime: CONVERSATIONS_DEBOUNCE_MS,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retryDelay: CONVERSATIONS_DEBOUNCE_MS,
    useErrorBoundary: false,
  });

  useEffect(() => {
    if (conversationFromUrl && conversations && !selectedConversation) {
      const convExists = conversations.find(c => c._id === conversationFromUrl);
      if (convExists) setSelectedConversation(conversationFromUrl);
    }
  }, [conversationFromUrl, conversations, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      setSearchParams({ conversation: selectedConversation });
      markNotificationAsRead(selectedConversation);
    }
  }, [selectedConversation, setSearchParams, markNotificationAsRead]);

  // ─── Clear stale cache when switching conversations ───
  const prevConvRef = useRef(null);
  useEffect(() => {
    if (selectedConversation && prevConvRef.current && prevConvRef.current !== selectedConversation) {
      queryClient.removeQueries({ queryKey: ['conversation-messages', prevConvRef.current] });
    }
    prevConvRef.current = selectedConversation;
    // A new conversation must re-pin to the bottom on its first render.
    initialScrollDoneRef.current = false;
    prependAnchorRef.current = null;
    scrollMetaRef.current = { firstId: null, lastId: null };
  }, [selectedConversation, queryClient]);

  // ─── Messages infinite query ───
  const { data: messagesData, isLoading: messagesLoading, fetchNextPage, hasNextPage, isFetchingNextPage, error: messagesError } = useInfiniteQuery({
    queryKey: ['conversation-messages', selectedConversation],
    queryFn: ({ pageParam }) => {
      const params = pageParam ? { cursor: pageParam, limit: 20 } : { limit: 20 };
      return chatAPI.getMessages(selectedConversation, params).then(res => res.data.data);
    },
    enabled: !!selectedConversation && !!user,
    initialPageParam: null,
    retry: (failureCount, error) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
      return failureCount < 1;
    },
    retryDelay: 1000,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage?.hasMore ?? lastPage?.pagination?.hasMore;
      const nextCursor = lastPage?.nextCursor ?? lastPage?.pagination?.nextCursor;
      return hasMore && nextCursor ? nextCursor : undefined;
    },
    meta: { skipErrorToast: true },
  });

  // ─── Deduplicate + sort messages ───
  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    const all = messagesData.pages.flatMap(page => page.messages || []);
    const seen = new Set();
    const unique = [];
    for (const msg of all) {
      const id = msg._id?.toString();
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      unique.push(msg);
    }
    unique.sort((a, b) => new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt));
    return unique;
  }, [messagesData?.pages]);

  // ─── Socket: join conversation room + recover missed messages on reconnect ───
  useEffect(() => {
    if (!socket || !selectedConversation) return;
    const joinRoom = () => socket.emit('join_conversation', selectedConversation);
    joinRoom();
    socket.on('connect', joinRoom);
    // Reconnection recovery: after a dropped connection the live push for any
    // messages sent while we were offline is gone, so re-fetch the thread (and
    // the conversation list) once the socket reconnects.
    const onReconnect = () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedConversation], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
    };
    socket.io?.on?.('reconnect', onReconnect);
    return () => {
      socket.off('connect', joinRoom);
      socket.io?.off?.('reconnect', onReconnect);
      if (socket.connected) socket.emit('leave_conversation', selectedConversation);
    };
  }, [socket, selectedConversation, queryClient]);

  // ─── Socket: new_message from conversation room ───
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const handleNewMessage = (msg) => {
      if (!msg?._id) return;
      const convId = msg.conversationId?.toString();
      // CRITICAL: Only process messages for the SELECTED conversation
      if (convId !== selectedConversation) return;

      appendMessageToCache(queryClient, ['conversation-messages', selectedConversation], msg);

      queryClient.setQueryData(['user-conversations'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((conv) =>
          conv._id?.toString() === convId
            ? { ...conv, lastMessage: msg.messageText || conv.lastMessage }
            : conv
        );
      });
    };

    const handleMessageUpdated = (msg) => {
      if (msg.conversationId?.toString() !== selectedConversation) return;
      queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: (page.messages || []).map((m) =>
              m._id?.toString() === msg._id?.toString() ? { ...m, ...msg } : m
            ),
          })),
        };
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdated);
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdated);
    };
  }, [socket, selectedConversation, queryClient]);

  // ─── Socket: message_received from personal room (backup delivery) ───
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      const { conversationId: convId, message: msg } = data || {};
      if (!msg?._id) return;
      const senderId = msg.senderId?._id?.toString() || msg.senderId?.toString();
      if (senderId === myId) return; // skip own echo

      const currentConv = selectedConversationRef.current;
      if (currentConv && convId?.toString() === currentConv) {
        appendMessageToCache(queryClient, ['conversation-messages', currentConv], msg);
      }
      queryClient.setQueryData(['user-conversations'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((conv) =>
          conv._id?.toString() === convId?.toString()
            ? { ...conv, lastMessage: msg.messageText || conv.lastMessage }
            : conv
        );
      });
    };
    socket.on('message_received', handler);
    return () => { socket.off('message_received', handler); };
  }, [socket, myId, queryClient]);

  // ─── Typing indicator (room-scoped) ───
  useEffect(() => {
    if (!socket || !selectedConversation) return;
    const onPeerTyping = ({ userId, isTyping }) => {
      if (!userId || userId.toString() === myId) return; // ignore own echo
      setPeerTyping(!!isTyping);
      if (peerTypingTimerRef.current) clearTimeout(peerTypingTimerRef.current);
      if (isTyping) {
        // Safety auto-clear if the matching "stop" event is missed.
        peerTypingTimerRef.current = setTimeout(() => setPeerTyping(false), 5000);
      }
    };
    socket.on('user_typing', onPeerTyping);
    return () => {
      socket.off('user_typing', onPeerTyping);
      if (peerTypingTimerRef.current) clearTimeout(peerTypingTimerRef.current);
      setPeerTyping(false);
      // Leaving this thread: stop my own typing here.
      if (typingStopTimerRef.current) { clearTimeout(typingStopTimerRef.current); typingStopTimerRef.current = null; }
      if (isTypingRef.current && socket.connected) {
        socket.emit('typing', { conversationId: selectedConversation, isTyping: false });
      }
      isTypingRef.current = false;
    };
  }, [socket, selectedConversation, myId]);

  // ─── Mutations ───
  const sendMessageMutation = useMutation({
    mutationFn: (data) => chatAPI.sendMessage(data),
    onSuccess: (response) => {
      const sent = response?.data?.data;
      if (sent && selectedConversation) {
        appendMessageToCache(queryClient, ['conversation-messages', selectedConversation], sent);
        queryClient.setQueryData(['user-conversations'], (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((conv) =>
            conv._id?.toString() === selectedConversation
              ? { ...conv, lastMessage: sent.messageText || conv.lastMessage }
              : conv
          );
        });
      }
    },
    onError: (error) => {
      // Remove optimistic messages on error
      if (selectedConversation) {
        queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: (page.messages || []).filter((m) => !m.isOptimistic),
            })),
          };
        });
      }
      if (error?.response?.status === 429) {
        showApiError({ message: 'Sending too fast. Please wait a moment.' }, 'Rate limited');
      } else {
        showApiError(error, 'Failed to send message');
      }
    },
  });

  const sendImageMessageMutation = useMutation({
    mutationFn: ({ formData }) => chatAPI.sendImageMessage(formData),
    onSuccess: (response, variables) => {
      const sentMessage = response?.data?.data;
      if (variables.localPreviewUrl) URL.revokeObjectURL(variables.localPreviewUrl);
      if (sentMessage && selectedConversation) {
        queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
          if (!old?.pages?.length) return old;
          const lastPage = old.pages[old.pages.length - 1];
          const filtered = (lastPage.messages || []).filter(
            (m) => m._id?.toString() !== sentMessage._id?.toString() && m._id !== variables.tempId
          );
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === old.pages.length - 1 ? { ...page, messages: [...filtered, sentMessage] } : page
            ),
          };
        });
        queryClient.setQueryData(['user-conversations'], (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((conv) =>
            conv._id?.toString() === selectedConversation ? { ...conv, lastMessage: 'Image' } : conv
          );
        });
      }
    },
    onError: (error, variables) => {
      if (variables.localPreviewUrl) URL.revokeObjectURL(variables.localPreviewUrl);
      if (selectedConversation && variables.tempId) {
        queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: (page.messages || []).filter((m) => m._id !== variables.tempId),
            })),
          };
        });
      }
      if (error?.response?.status === 429) {
        showApiError({ message: 'Sending too fast. Please wait a moment.' }, 'Rate limited');
      } else {
        showApiError(error, 'Failed to send image');
      }
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (conversationId) => chatAPI.markAsRead(conversationId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['user-conversations'] }); },
    retry: false,
  });

  // ─── Scroll management ───
  // Runs synchronously after every message-list change, before paint, so the
  // user never sees a flash at the wrong position. Three cases:
  //  1. First render of a conversation → jump to the bottom (newest message).
  //  2. Older page just prepended (firstId changed, lastId unchanged) → restore
  //     the prior visual position so the thread doesn't jump under the user.
  //  3. New message appended (lastId changed) → follow to the bottom only if the
  //     user was already near the bottom (don't yank them up out of history).
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || messages.length === 0) return;
    const firstId = messages[0]?._id?.toString() || null;
    const lastId = messages[messages.length - 1]?._id?.toString() || null;
    const prev = scrollMetaRef.current;

    if (!initialScrollDoneRef.current) {
      el.scrollTop = el.scrollHeight;
      initialScrollDoneRef.current = true;
    } else if (prependAnchorRef.current && firstId !== prev.firstId && lastId === prev.lastId) {
      // Older messages were prepended: keep the same message under the viewport.
      const { scrollHeight: prevSH, scrollTop: prevST } = prependAnchorRef.current;
      el.scrollTop = el.scrollHeight - prevSH + prevST;
      prependAnchorRef.current = null;
    } else if (lastId !== prev.lastId) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 250;
      if (nearBottom) el.scrollTop = el.scrollHeight;
    }

    scrollMetaRef.current = { firstId, lastId };
  }, [messages]);

  const handleScrollToTop = useCallback(() => {
    if (fetchNextPageTimeoutRef.current) return;
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPageTimeoutRef.current = setTimeout(() => {
      const el = scrollContainerRef.current;
      if (el) {
        // Snapshot the position so the layout effect can restore it once the
        // older page prepends (otherwise the thread jumps under the user).
        prependAnchorRef.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
      }
      fetchNextPage();
      fetchNextPageTimeoutRef.current = null;
    }, 200);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // ─── Mark as read ───
  const markAsReadRef = useRef(null);
  useEffect(() => {
    if (!selectedConversation || markAsReadRef.current === selectedConversation) return;
    markAsReadRef.current = selectedConversation;
    const t = setTimeout(() => {
      if (socket && isConnected) socket.emit('mark_read', selectedConversation);
      else markAsReadMutation.mutate(selectedConversation);
    }, 100);
    return () => clearTimeout(t);
  }, [selectedConversation, socket, isConnected, markAsReadMutation]);

  // ─── Send handlers ───
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showApiError({ message: 'Invalid file type. Use JPEG, PNG, GIF or WebP' }, 'Invalid image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showApiError({ message: 'Image must be under 5MB' }, 'File too large');
      return;
    }
    const tempId = `temp-img-${Date.now()}`;
    const localPreviewUrl = URL.createObjectURL(file);
    const optimisticMessage = {
      _id: tempId, conversationId: selectedConversation, senderId: user,
      messageText: 'Image', messageType: 'image', uploadStatus: 'pending',
      localPreviewUrl, isRead: false, sentAt: new Date(), isOptimistic: true,
    };
    queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
      if (!old?.pages?.length) return old;
      return {
        ...old,
        pages: old.pages.map((page, i) =>
          i === old.pages.length - 1 ? { ...page, messages: [...(page.messages || []), optimisticMessage] } : page
        ),
      };
    });
    const formData = new FormData();
    formData.append('conversationId', selectedConversation);
    formData.append('messageText', 'Image');
    formData.append('image', file);
    sendImageMessageMutation.mutate({ formData, tempId, localPreviewUrl });
    e.target.value = '';
  };

  // Debounced typing: emit one 'typing:true' per burst, 'typing:false' after a
  // 2.5s pause. The backend rebroadcasts room-scoped to the other participant.
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (!socket || !selectedConversation) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { conversationId: selectedConversation, isTyping: true });
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (socket.connected) socket.emit('typing', { conversationId: selectedConversation, isTyping: false });
    }, 2500);
  };

  const stopTyping = () => {
    if (typingStopTimerRef.current) { clearTimeout(typingStopTimerRef.current); typingStopTimerRef.current = null; }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (socket?.connected && selectedConversation) {
        socket.emit('typing', { conversationId: selectedConversation, isTyping: false });
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation) return;
    const messageText = message.trim();
    stopTyping();

    // Optimistic UI
    const optimisticMessage = {
      _id: `temp-${Date.now()}`, conversationId: selectedConversation,
      senderId: user, messageText, messageType: 'text',
      isRead: false, sentAt: new Date(), isOptimistic: true,
    };
    queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
      if (!old?.pages?.length) return old;
      return {
        ...old,
        pages: old.pages.map((page, i) =>
          i === old.pages.length - 1 ? { ...page, messages: [...(page.messages || []), optimisticMessage] } : page
        ),
      };
    });
    setMessage('');

    // Socket-first with HTTP fallback
    if (socket && isConnected) {
      // FIX: timeout the socket send so a lost/missing ACK falls back to HTTP
      // instead of leaving the optimistic bubble stuck forever.
      socket.timeout(8000).emit('send_message', { conversationId: selectedConversation, messageText }, (err, ack) => {
        if (err || (ack && ack.error)) {
          sendMessageMutation.mutate({ conversationId: selectedConversation, messageText });
        }
      });
    } else {
      sendMessageMutation.mutate({ conversationId: selectedConversation, messageText });
    }
  };

  if (conversationsLoading) return <Loading message="Loading conversations..." />;
  if (conversationsError) {
    return <ErrorMessage message={conversationsError?.response?.data?.message || conversationsError?.message || 'Failed to load conversations'} />;
  }

  const conversation = (conversations ?? []).find((c) => c?._id === selectedConversation);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-4rem)] min-h-0 max-h-[calc(100vh-4rem)] -m-4 md:-m-6 lg:-m-8">
      <div className="shrink-0 mb-4 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Chat</h1>
        <p className="text-gray-400 mt-1">Chat with sellers about your orders</p>
        {isConnected && <Badge variant="success" className="mt-2">Connected</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 overflow-hidden">
        {/* Conversations List */}
        <Card className="bg-primary border-gray-700 flex flex-col h-full min-h-0 overflow-hidden">
          <CardHeader className="shrink-0 border-b border-gray-700">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}>
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No conversations yet</div>
            ) : (
              <div className="space-y-2">
                {(conversations ?? []).map((conv) => (
                  <div
                    key={conv?._id}
                    onClick={() => setSelectedConversation(conv?._id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conv?._id
                        ? 'bg-accent'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium truncate">
                        {conv.sellerId?.shopName || 'Seller'}
                      </span>
                      {(conv?.unreadCountBuyer ?? 0) > 0 && (
                        <Badge variant="destructive">{conv?.unreadCountBuyer}</Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {conv?.lastMessage || (conv?.orderId
                        ? `Order: $${conv?.orderId?.totalAmount?.toFixed(2) || '0.00'}`
                        : 'No messages yet')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Messages - Fixed Width Container */}
        <Card className="lg:col-span-2 bg-primary border-gray-700 flex flex-col max-w-full h-full min-h-0 overflow-hidden">
          <CardHeader className="shrink-0 border-b border-gray-700 px-4 py-3">
            <CardTitle className="text-white text-lg">
              {conversation ? `Chat with ${conversation.sellerId?.shopName || 'Seller'}` : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
            {selectedConversation ? (
              <>
                {/* Messages Area - Fixed width, scrollable with infinite scroll */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0" 
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}
                  onScroll={(e) => {
                    const { scrollTop } = e.target;
                    if (initialScrollDoneRef.current && scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
                      handleScrollToTop();
                    }
                  }}
                >
                  {messagesLoading ? (
                    <div className="max-w-2xl mx-auto space-y-4 py-4">
                      {[...Array(5)].map((_, i) => (
                        <ChatMessageSkeleton key={i} isOwn={i % 2 === 1} />
                      ))}
                    </div>
                  ) : messagesError ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <p className="text-red-400 mb-2 font-medium">Failed to load messages</p>
                      <p className="text-gray-400 text-sm mb-4">
                        {messagesError?.response?.data?.message || messagesError?.message || 'Please try again'}
                      </p>
                      <Button 
                        onClick={() => queryClient.refetchQueries({ queryKey: ['conversation-messages', selectedConversation] })}
                        variant="outline"
                        size="sm"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <>
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                          <MessageSquare className="h-16 w-16 text-gray-600 mb-4 opacity-50" />
                          <p className="text-gray-400 text-lg font-medium mb-2">No messages yet</p>
                          <p className="text-gray-500 text-sm">Start the conversation by sending a message</p>
                        </div>
                      ) : (
                        <div className="max-w-2xl mx-auto">
                          {isFetchingNextPage && (
                            <div className="flex justify-center py-2">
                              <Loading message="Loading older messages..." />
                            </div>
                          )}
                          {messages.map((msg) => {
                            const senderInfo = msg.senderId;
                            const senderId = senderInfo?._id?.toString() || senderInfo?.toString() || msg.senderId?.toString();
                            const senderName = senderInfo?.name || senderInfo?.username || 'Unknown';
                            const senderAvatar = senderInfo?.profileImage || null;
                            const isOwn = user?._id && senderId === user._id.toString();
                            return (
                              <MessageBubble
                                key={msg._id || `temp-${msg.sentAt}`}
                                message={msg}
                                isOwn={isOwn}
                                senderName={senderName}
                                senderAvatar={senderAvatar}
                              />
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Typing indicator */}
                {peerTyping && (
                  <div className="shrink-0 px-5 pb-1 text-xs text-gray-400 italic">
                    typing…
                  </div>
                )}

                {/* Input Area - Fixed at bottom */}
                <div className="shrink-0 p-4 border-t border-gray-700 bg-primary">
                  <form onSubmit={handleSendMessage} className="flex gap-2 max-w-2xl mx-auto">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={sendImageMessageMutation.isPending || (!isConnected && !socket)}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                    <Input
                      value={message}
                      onChange={handleMessageChange}
                      placeholder="Type your message..."
                      className="bg-gray-800 border-gray-700 text-white flex-1"
                      disabled={sendMessageMutation.isPending || (!isConnected && !socket)}
                    />
                    <Button 
                      type="submit" 
                      disabled={sendMessageMutation.isPending || !message.trim() || (!isConnected && !socket)}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </ErrorBoundary>
  );
};

export default UserChat;
