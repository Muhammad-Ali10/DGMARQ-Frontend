import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '@services/api';
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { MessageSquare, Send, ImagePlus, Ban, ShieldOff } from 'lucide-react';
import { useSocket } from '@hooks/useSocket';
import { invalidateAllNotificationQueries } from '@features/notifications/utils/notificationQueries';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { ConfirmationModal } from '@components/common/ConfirmationModal';
import { EmptyState } from '@components/common/EmptyState';
import MessageBubble from './MessageBubble';
import ChatMessageSkeleton from './ChatMessageSkeleton';
import { useSelector } from 'react-redux';
import { showApiError, showSuccess } from '@utils/toast';

function appendMessageToCache(queryClient, queryKey, newMsg) {
  queryClient.setQueryData(queryKey, (old) => {
    if (!old?.pages?.length) return old;
    const lastPage = old.pages[old.pages.length - 1];
    const existing = lastPage.messages || [];
    const msgId = newMsg._id?.toString();

    if (msgId && existing.some(m => m._id?.toString() === msgId)) return old;

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

const BLOCKED_LINK =
  'font-medium underline underline-offset-4 rounded-sm hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const CONVERSATIONS_PAGE_SIZE = 20;

const SEND_ERROR_MESSAGES = {
  rate_limited: 'Sending too fast. Please wait a moment.',
  blocked: 'This conversation is blocked.',
  access_denied: "You don't have access to this conversation.",
  not_found: 'This conversation no longer exists.',
  invalid_message: 'Your message is empty or longer than 2000 characters.',
  invalid_data: 'Your message could not be sent.',
};

const sameId = (a, b) => a != null && b != null && a.toString() === b.toString();

const normalizeConversationsPage = (payload) => {
  if (Array.isArray(payload)) return { conversations: payload, pagination: null };
  return {
    conversations: Array.isArray(payload?.conversations) ? payload.conversations : [],
    pagination: payload?.pagination || null,
  };
};

const mapConversations = (old, fn) =>
  old?.pages
    ? { ...old, pages: old.pages.map((page) => ({ ...page, conversations: fn(page.conversations || []) })) }
    : old;

const patchConversation = (old, convId, patch) =>
  mapConversations(old, (list) => list.map((conv) => (sameId(conv?._id, convId) ? patch(conv) : conv)));

const bumpConversation = (old, convId, patch) => {
  if (!old?.pages?.length) return old;
  let found = null;
  const pages = old.pages.map((page) => ({
    ...page,
    conversations: (page.conversations || []).filter((conv) => {
      if (!sameId(conv?._id, convId)) return true;
      found = conv;
      return false;
    }),
  }));
  if (!found) return old;
  pages[0] = { ...pages[0], conversations: [patch(found), ...pages[0].conversations] };
  return { ...old, pages };
};

const hasConversation = (data, convId) =>
  Boolean(data?.pages?.some((page) => (page.conversations || []).some((conv) => sameId(conv?._id, convId))));

const ROLE_CONFIG = {
  buyer: {
    conversationsKey: 'user-conversations',
    headerSubtitle: 'Chat with sellers about your orders',
    getPeerName: (conv) => conv?.sellerId?.shopName || 'Seller',
    unreadField: 'unreadCountBuyer',
    supportPath: '/buyer-support',
    getOrderPath: (conv) => (conv?.orderId?._id ? `/user/orders/${conv.orderId._id}` : null),
    chatCardClassName: 'lg:col-span-2 flex flex-col max-w-full h-full min-h-0 overflow-hidden',
    chatHeaderClassName: 'shrink-0 border-b border-brand-cyan/10 px-4 py-3',
    messagesWidthClassName: 'max-w-2xl mx-auto',
  },
  seller: {
    conversationsKey: 'seller-conversations',
    headerSubtitle: 'Communicate with buyers',
    getPeerName: (conv) => conv?.buyerId?.name || 'Buyer',
    unreadField: 'unreadCountSeller',
    supportPath: '/seller-support',
    getOrderPath: () => null,
    chatCardClassName: 'lg:col-span-2 flex flex-col max-w-full py-2 h-full min-h-0 overflow-hidden',
    chatHeaderClassName: 'shrink-0 border-b border-brand-cyan/10 px-4 py-0!',
    messagesWidthClassName: 'max-w-4xl mx-auto',
  },
};

const ChatPage = ({ role }) => {
  const config = ROLE_CONFIG[role];
  const { conversationsKey, unreadField } = config;
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationFromUrl = searchParams.get('conversation');
  const [selectedConversation, setSelectedConversation] = useState(conversationFromUrl || null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const isTypingRef = useRef(false);
  const typingStopTimerRef = useRef(null);
  const peerTypingTimerRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fetchNextPageTimeoutRef = useRef(null);
  const initialScrollDoneRef = useRef(false);
  const prependAnchorRef = useRef(null);
  const scrollMetaRef = useRef({ firstId: null, lastId: null });
  const selectedConversationRef = useRef(selectedConversation);
  selectedConversationRef.current = selectedConversation;
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const myId = user?._id?.toString();

  const {
    data: conversationPages,
    isLoading: conversationsLoading,
    error: conversationsError,
    fetchNextPage: fetchMoreConversations,
    hasNextPage: hasMoreConversations,
    isFetchingNextPage: loadingMoreConversations,
  } = useInfiniteQuery({
    queryKey: [conversationsKey],
    queryFn: ({ pageParam }) =>
      chatAPI
        .getConversations({ role, page: pageParam, limit: CONVERSATIONS_PAGE_SIZE })
        .then((res) => normalizeConversationsPage(res?.data?.data)),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      return pagination && pagination.page < pagination.pages ? pagination.page + 1 : undefined;
    },
    enabled: !!user,
    staleTime: 2000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retryDelay: 2000,
  });

  const conversations = useMemo(() => {
    const seen = new Set();
    return (conversationPages?.pages || [])
      .flatMap((page) => page.conversations || [])
      .filter((conv) => {
        const id = conv?._id?.toString();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [conversationPages]);

  const dropOptimisticMessages = useCallback((conversationId) => {
    queryClient.setQueryData(['conversation-messages', conversationId], (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          messages: (page.messages || []).filter((m) => !m.isOptimistic),
        })),
      };
    });
  }, [queryClient]);

  useEffect(() => {
    if (conversationFromUrl && conversations && !selectedConversation) {
      const convExists = conversations.find(c => c._id === conversationFromUrl);
      if (convExists) setSelectedConversation(conversationFromUrl);
    }
  }, [conversationFromUrl, conversations, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      setSearchParams({ conversation: selectedConversation });
    }
  }, [selectedConversation, setSearchParams]);

  const prevConvRef = useRef(null);
  useEffect(() => {
    if (selectedConversation && prevConvRef.current && prevConvRef.current !== selectedConversation) {
      queryClient.removeQueries({ queryKey: ['conversation-messages', prevConvRef.current] });
    }
    prevConvRef.current = selectedConversation;
    initialScrollDoneRef.current = false;
    prependAnchorRef.current = null;
    scrollMetaRef.current = { firstId: null, lastId: null };
  }, [selectedConversation, queryClient]);

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
  });

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

  useEffect(() => {
    if (!socket || !selectedConversation) return;
    const joinRoom = () => socket.emit('join_conversation', selectedConversation);
    joinRoom();
    socket.on('connect', joinRoom);
    const onReconnect = () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedConversation], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [conversationsKey] });
    };
    socket.io?.on?.('reconnect', onReconnect);
    return () => {
      socket.off('connect', joinRoom);
      socket.io?.off?.('reconnect', onReconnect);
      if (socket.connected) socket.emit('leave_conversation', selectedConversation);
    };
  }, [socket, selectedConversation, queryClient, conversationsKey]);

  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const handleNewMessage = (msg) => {
      if (!msg?._id) return;
      const convId = msg.conversationId?.toString();
      if (convId !== selectedConversation) return;

      appendMessageToCache(queryClient, ['conversation-messages', selectedConversation], msg);

      queryClient.setQueryData([conversationsKey], (old) =>
        bumpConversation(old, convId, (conv) => ({ ...conv, lastMessage: msg.messageText || conv.lastMessage }))
      );
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
  }, [socket, selectedConversation, queryClient, conversationsKey]);

  useEffect(() => {
    if (!socket) return;
    const handleBlockChanged = (payload) => {
      if (!payload?.conversationId) return;
      queryClient.setQueryData([conversationsKey], (old) =>
        patchConversation(old, payload.conversationId, (conv) => ({
          ...conv,
          status: payload.status,
          blockedBy: payload.blockedBy,
        }))
      );
    };
    socket.on('conversation_block_changed', handleBlockChanged);
    return () => socket.off('conversation_block_changed', handleBlockChanged);
  }, [socket, queryClient, conversationsKey]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      const { conversationId: convId, message: msg } = data || {};
      if (!msg?._id) return;
      const senderId = msg.senderId?._id?.toString() || msg.senderId?.toString();
      if (senderId === myId) return;

      if (!hasConversation(queryClient.getQueryData([conversationsKey]), convId)) {
        queryClient.invalidateQueries({ queryKey: [conversationsKey] });
        return;
      }

      const currentConv = selectedConversationRef.current;
      const isOpen = Boolean(currentConv) && sameId(convId, currentConv);
      if (isOpen) {
        appendMessageToCache(queryClient, ['conversation-messages', currentConv], msg);
      }
      queryClient.setQueryData([conversationsKey], (old) =>
        bumpConversation(old, convId, (conv) => ({
          ...conv,
          lastMessage: msg.messageText || conv.lastMessage,
          ...(isOpen ? {} : { [unreadField]: (conv[unreadField] || 0) + 1 }),
        }))
      );
    };
    socket.on('message_received', handler);
    return () => { socket.off('message_received', handler); };
  }, [socket, myId, queryClient, conversationsKey, unreadField]);

  useEffect(() => {
    if (!socket || !selectedConversation) return;
    const onPeerTyping = ({ userId, isTyping }) => {
      if (!userId || userId.toString() === myId) return;
      setPeerTyping(!!isTyping);
      if (peerTypingTimerRef.current) clearTimeout(peerTypingTimerRef.current);
      if (isTyping) {
        peerTypingTimerRef.current = setTimeout(() => setPeerTyping(false), 5000);
      }
    };
    socket.on('user_typing', onPeerTyping);
    return () => {
      socket.off('user_typing', onPeerTyping);
      if (peerTypingTimerRef.current) clearTimeout(peerTypingTimerRef.current);
      setPeerTyping(false);
      if (typingStopTimerRef.current) { clearTimeout(typingStopTimerRef.current); typingStopTimerRef.current = null; }
      if (isTypingRef.current && socket.connected) {
        socket.emit('typing', { conversationId: selectedConversation, isTyping: false });
      }
      isTypingRef.current = false;
    };
  }, [socket, selectedConversation, myId]);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => chatAPI.sendMessage(data),
    onSuccess: (response) => {
      const sent = response?.data?.data;
      if (sent && selectedConversation) {
        appendMessageToCache(queryClient, ['conversation-messages', selectedConversation], sent);
        queryClient.setQueryData([conversationsKey], (old) =>
          bumpConversation(old, selectedConversation, (conv) => ({ ...conv, lastMessage: sent.messageText || conv.lastMessage }))
        );
      }
    },
    onError: (error) => {
      if (selectedConversation) dropOptimisticMessages(selectedConversation);
      if (error?.response?.status === 429) {
        showApiError({ message: 'Sending too fast. Please wait a moment.' }, 'Rate limited');
      } else {
        showApiError(error, 'Failed to send message');
      }
    },
  });

  const resendUnlessDelivered = async (conversationId, messageText, tempId) => {
    const key = ['conversation-messages', conversationId];
    const cached = queryClient.getQueryData(key)?.pages?.flatMap((page) => page.messages || []);
    if (cached) {
      if (!cached.some((m) => m._id === tempId)) return;
      const known = new Set(cached.map((m) => m._id?.toString()));
      const recent = await chatAPI
        .getMessages(conversationId, { limit: 5 })
        .then((res) => res?.data?.data?.messages || [], () => []);
      const delivered = recent.find((m) =>
        !known.has(m._id?.toString())
        && sameId(m.senderId?._id || m.senderId, myId)
        && m.messageText === messageText);
      if (delivered) {
        appendMessageToCache(queryClient, key, delivered);
        return;
      }
    }
    sendMessageMutation.mutate({ conversationId, messageText });
  };

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
        queryClient.setQueryData([conversationsKey], (old) =>
          bumpConversation(old, selectedConversation, (conv) => ({ ...conv, lastMessage: 'Image' }))
        );
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [conversationsKey] });
      invalidateAllNotificationQueries(queryClient);
    },
    retry: false,
  });

  const blockMutation = useMutation({
    mutationFn: (conversationId) => chatAPI.toggleBlock(conversationId).then((r) => r.data.data),
    onSuccess: (data) => {
      const patch = { status: data?.status, blockedBy: data?.blockedBy ?? null };
      queryClient.setQueryData([conversationsKey], (old) =>
        patchConversation(old, data?.conversationId, (conv) => ({ ...conv, ...patch }))
      );
      queryClient.invalidateQueries({ queryKey: [conversationsKey] });
      showSuccess(data?.status === 'blocked' ? 'Conversation blocked' : 'Conversation unblocked');
    },
    onError: (err) => showApiError(err, 'Failed to update block status'),
  });

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
        prependAnchorRef.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
      }
      fetchNextPage();
      fetchNextPageTimeoutRef.current = null;
    }, 200);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const markAsReadRef = useRef(null);
  useEffect(() => {
    if (!selectedConversation || markAsReadRef.current === selectedConversation) return;
    markAsReadRef.current = selectedConversation;
    const conversationId = selectedConversation;
    const t = setTimeout(() => {
      queryClient.setQueryData([conversationsKey], (old) =>
        patchConversation(old, conversationId, (conv) => ({ ...conv, [unreadField]: 0 }))
      );
      if (socket && isConnected) {
        socket.emit('mark_read', conversationId, (ack) => {
          if (ack?.notificationsCleared) invalidateAllNotificationQueries(queryClient);
        });
      } else {
        markAsReadMutation.mutate(conversationId);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [selectedConversation, socket, isConnected, markAsReadMutation, queryClient, conversationsKey, unreadField]);

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

    if (socket && isConnected) {
      const conversationId = selectedConversation;
      socket.timeout(8000).emit('send_message', { conversationId, messageText }, (err, ack) => {
        if (err || ack?.error === 'server_error') {
          resendUnlessDelivered(conversationId, messageText, optimisticMessage._id);
          return;
        }
        if (ack?.error) {
          dropOptimisticMessages(conversationId);
          if (ack.error === 'blocked') queryClient.invalidateQueries({ queryKey: [conversationsKey] });
          showApiError({ message: SEND_ERROR_MESSAGES[ack.error] || SEND_ERROR_MESSAGES.invalid_data }, 'Message not sent');
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
  const orderPath = conversation ? config.getOrderPath(conversation) : null;

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-4rem)] min-h-0 max-h-[calc(100vh-4rem)] -m-4 md:-m-6 lg:-m-8">
      <div className="shrink-0 mb-4 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">Chat</h1>
        <p className="text-fg-muted mt-1">{config.headerSubtitle}</p>
        {isConnected && <Badge variant="success" className="mt-2">Connected</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 overflow-hidden">
        <Card variant="hud" className="flex flex-col h-full min-h-0 overflow-hidden">
          <CardHeader className="shrink-0 border-b ">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}>
            {conversations.length === 0 ? (
              <EmptyState title="No conversations yet" className="py-8" />
            ) : (
              <div className="space-y-2">
                {(conversations ?? []).map((conv) => (
                  <button
                    type="button"
                    key={conv?._id}
                    onClick={() => setSelectedConversation(conv?._id)}
                    className={`block w-full text-left p-3 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      selectedConversation === conv?._id
                        ? 'bg-accent'
                        : 'bg-surface-2 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-fg font-medium truncate">
                        {config.getPeerName(conv)}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {conv?.status === 'blocked' && (
                          <Badge variant="neutral">
                            <Ban aria-hidden="true" />
                            Blocked
                          </Badge>
                        )}
                        {conv?.[unreadField] > 0 && (
                          <Badge variant="destructive">{conv[unreadField]}</Badge>
                        )}
                      </span>
                    </div>
                    <p className="text-fg-muted text-sm truncate">
                      {conv?.lastMessage || (conv?.orderId
                        ? `Order: $${conv?.orderId?.totalAmount?.toFixed(2) || '0.00'}`
                        : 'No messages yet')}
                    </p>
                  </button>
                ))}
                {hasMoreConversations && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={loadingMoreConversations}
                    onClick={() => fetchMoreConversations()}
                  >
                    {loadingMoreConversations ? 'Loading…' : 'Load more conversations'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="hud" className={config.chatCardClassName}>
          <CardHeader className={config.chatHeaderClassName}>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>
                {conversation ? `Chat with ${config.getPeerName(conversation)}` : 'Select a conversation'}
              </CardTitle>
              {conversation && (() => {
                const isBlocked = conversation.status === 'blocked';
                const blockedByMe = isBlocked && conversation.blockedBy?.toString() === myId;
                if (isBlocked && !blockedByMe) return null;
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={blockMutation.isPending}
                    onClick={() => setBlockConfirmOpen(true)}
                    className={isBlocked
                      ? 'border-emerald-600/60 text-success hover:bg-emerald-500/10'
                      : 'border-red-600/60 text-danger hover:bg-red-500/10'}
                  >
                    {isBlocked ? <ShieldOff className="h-4 w-4 mr-1.5" /> : <Ban className="h-4 w-4 mr-1.5" />}
                    {isBlocked ? 'Unblock' : 'Block'}
                  </Button>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
            {selectedConversation ? (
              <>
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
                    <div className={`${config.messagesWidthClassName} space-y-4 py-4`}>
                      {[...Array(5)].map((_, i) => (
                        <ChatMessageSkeleton key={i} isOwn={i % 2 === 1} />
                      ))}
                    </div>
                  ) : messagesError ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <p className="text-danger mb-2 font-medium">Failed to load messages</p>
                      <p className="text-fg-muted text-sm mb-4">
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
                          <MessageSquare className="h-16 w-16 text-fg-subtle mb-4 opacity-50" />
                          <p className="text-fg-muted text-lg font-medium mb-2">No messages yet</p>
                          <p className="text-fg-subtle text-sm">Start the conversation by sending a message</p>
                        </div>
                      ) : (
                        <div className={config.messagesWidthClassName}>
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

                {peerTyping && (
                  <div className="shrink-0 px-5 pb-1 text-xs text-fg-muted italic">
                    typing…
                  </div>
                )}

                <div className="shrink-0 p-4 border-t border-brand-cyan/10">
                  {conversation?.status === 'blocked' ? (
                    <div className="max-w-2xl mx-auto flex items-start gap-2 rounded-md border border-red-600/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      <Ban className="h-4 w-4 shrink-0 mt-0.5" />
                      {conversation.blockedBy?.toString() === myId ? (
                        <span>This conversation is blocked. Click Unblock above to resume messaging.</span>
                      ) : (
                        <span>
                          The other party has blocked this conversation. Blocking only stops messages
                          here — you can still{' '}
                          {orderPath && (
                            <>
                              <Link to={orderPath} className={BLOCKED_LINK}>
                                open a refund request on the order
                              </Link>{' '}
                              or{' '}
                            </>
                          )}
                          <Link to={config.supportPath} className={BLOCKED_LINK}>
                            contact support
                          </Link>
                          .
                        </span>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-2 max-w-2xl mx-auto">
                      <input
                        ref={imageInputRef}
                        type="file"
                        aria-label="Attach an image"
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
                        className="bg-surface-2 border-border text-fg flex-1"
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
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-fg-muted">
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

      <ConfirmationModal
        open={blockConfirmOpen}
        onOpenChange={setBlockConfirmOpen}
        title={conversation?.status === 'blocked' ? 'Unblock this conversation?' : 'Block this conversation?'}
        description={
          conversation?.status === 'blocked'
            ? 'Both of you will be able to send messages in this conversation again.'
            : 'Neither party will be able to send messages in this conversation until you unblock it. You can unblock it at any time.'
        }
        confirmText={conversation?.status === 'blocked' ? 'Unblock' : 'Block'}
        variant={conversation?.status === 'blocked' ? 'default' : 'destructive'}
        onConfirm={() => blockMutation.mutate(selectedConversation)}
      />
    </ErrorBoundary>
  );
};

export default ChatPage;
