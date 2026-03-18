import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '../../services/api';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { MessageSquare, Send, ImagePlus } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import MessageBubble from '../../components/chat/MessageBubble';
import VirtualizedMessageList from '../../components/chat/VirtualizedMessageList';
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

const SellerChat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationFromUrl = searchParams.get('conversation');
  const [selectedConversation, setSelectedConversation] = useState(conversationFromUrl || null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const imageInputRef = useRef(null);
  const fetchNextPageTimeoutRef = useRef(null);
  const selectedConversationRef = useRef(selectedConversation);
  selectedConversationRef.current = selectedConversation;
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { markNotificationAsRead } = useChatNotifications();
  const { user } = useSelector((state) => state.auth);
  const myId = user?._id?.toString();

  // ─── Conversations query ───
  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['seller-conversations'],
    queryFn: () => chatAPI.getConversations({ role: 'seller' }).then(res => res.data.data),
    enabled: !!user,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
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

  // ─── Socket: join conversation room (re-join on reconnect) ───
  useEffect(() => {
    if (!socket || !selectedConversation) return;
    const joinRoom = () => socket.emit('join_conversation', selectedConversation);
    joinRoom();
    socket.on('connect', joinRoom);
    return () => {
      socket.off('connect', joinRoom);
      if (socket.connected) socket.emit('leave_conversation', selectedConversation);
    };
  }, [socket, selectedConversation]);

  // ─── Socket: new_message from conversation room ───
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const handleNewMessage = (msg) => {
      if (!msg?._id) return;
      const convId = msg.conversationId?.toString();
      // CRITICAL: Only process messages for the SELECTED conversation
      if (convId !== selectedConversation) return;

      appendMessageToCache(queryClient, ['conversation-messages', selectedConversation], msg);

      queryClient.setQueryData(['seller-conversations'], (old) => {
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
      queryClient.setQueryData(['seller-conversations'], (old) => {
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

  // ─── Mutations ───
  const sendMessageMutation = useMutation({
    mutationFn: (data) => chatAPI.sendMessage(data),
    onSuccess: (response) => {
      const sent = response?.data?.data;
      if (sent && selectedConversation) {
        appendMessageToCache(queryClient, ['conversation-messages', selectedConversation], sent);
        queryClient.setQueryData(['seller-conversations'], (old) => {
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
        queryClient.setQueryData(['seller-conversations'], (old) => {
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
    onSuccess: () => { queryClient.invalidateQueries(['seller-conversations']); },
    retry: false,
  });

  // ─── Auto-scroll on new messages ───
  const prevMessagesLengthRef = useRef(0);
  useEffect(() => {
    const len = messages.length;
    if (len > prevMessagesLengthRef.current && scrollContainerRef.current && len < 40) {
      const el = scrollContainerRef.current;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    }
    prevMessagesLengthRef.current = len;
  }, [messages.length]);

  const handleScrollToTop = useCallback(() => {
    if (fetchNextPageTimeoutRef.current) return;
    fetchNextPageTimeoutRef.current = setTimeout(() => {
      fetchNextPage();
      fetchNextPageTimeoutRef.current = null;
    }, 200);
  }, [fetchNextPage]);

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
      receiverId: conversation?.buyerId, messageText: 'Image', messageType: 'image',
      uploadStatus: 'pending', localPreviewUrl, isRead: false, sentAt: new Date(), isOptimistic: true,
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation) return;
    const messageText = message.trim();

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
      socket.emit('send_message', { conversationId: selectedConversation, messageText }, (ack) => {
        if (ack && ack.error) {
          sendMessageMutation.mutate({ conversationId: selectedConversation, messageText });
        }
      });
    } else {
      sendMessageMutation.mutate({ conversationId: selectedConversation, messageText });
    }
  };

  if (conversationsLoading) return <Loading message="Loading conversations..." />;

  const conversation = conversations?.find((c) => c._id === selectedConversation);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] min-h-0 max-h-[calc(100vh-4rem)] -m-4 md:-m-6 lg:-m-8">
      <div className="shrink-0 mb-4 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Chat</h1>
        <p className="text-gray-400 mt-1">Communicate with buyers</p>
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
            {conversations?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No conversations yet</div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv._id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conv._id
                        ? 'bg-accent'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium truncate">
                        {conv.buyerId?.name || 'Buyer'}
                      </span>
                      {conv.unreadCountSeller > 0 && (
                        <Badge variant="destructive">{conv.unreadCountSeller}</Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {conv.lastMessage || `Order: $${conv.orderId?.totalAmount?.toFixed(2) || '0.00'}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Messages - Fixed Width Container */}
        <Card className="lg:col-span-2 bg-primary border-gray-700 flex flex-col max-w-full py-2 h-full min-h-0 overflow-hidden">
          <CardHeader className="shrink-0 border-b border-gray-700 px-4 !py-0">
            <CardTitle className="text-white text-lg">
              {conversation ? `Chat with ${conversation.buyerId?.name || 'Buyer'}` : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
            {selectedConversation ? (
              <>
                {/* Messages Area - Fixed width, scrollable with infinite scroll */}
                <div 
                  className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0" 
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}
                  onScroll={(e) => {
                    const { scrollTop } = e.target;
                    if (scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
                      setTimeout(() => {
                        if (hasNextPage && !isFetchingNextPage) {
                          fetchNextPage();
                        }
                      }, 300); // 300ms delay for smooth UX
                    }
                  }}
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loading message="Loading messages..." />
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
                      ) : messages.length > 40 ? (
                        <VirtualizedMessageList
                          messages={messages}
                          currentUserId={user}
                          scrollContainerRef={scrollContainerRef}
                          onScrollToTop={handleScrollToTop}
                          hasNextPage={hasNextPage}
                          isFetchingNextPage={isFetchingNextPage}
                        />
                      ) : (
                        <div className="max-w-4xl mx-auto">
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
                      onChange={(e) => setMessage(e.target.value)}
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
  );
};

export default SellerChat;
