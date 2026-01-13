import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '../../services/api';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { MessageSquare, Send } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import MessageBubble from '../../components/chat/MessageBubble';
import { useSelector } from 'react-redux';
import { showApiError } from '../../utils/toast';

const UserChat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationFromUrl = searchParams.get('conversation');
  const [selectedConversation, setSelectedConversation] = useState(conversationFromUrl || null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { markNotificationAsRead } = useChatNotifications();
  const { user } = useSelector((state) => state.auth);

  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['user-conversations'],
    queryFn: () => chatAPI.getConversations({ role: 'buyer' }).then(res => res.data.data),
    enabled: !!user, // Only fetch when user is authenticated
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Set conversation from URL param when conversations load
  useEffect(() => {
    if (conversationFromUrl && conversations && !selectedConversation) {
      const convExists = conversations.find(c => c._id === conversationFromUrl);
      if (convExists) {
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setSelectedConversation(conversationFromUrl);
        }, 0);
      }
    }
  }, [conversationFromUrl, conversations, selectedConversation]);

  // Update URL when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setSearchParams({ conversation: selectedConversation });
      // Mark notification as read when opening conversation
      markNotificationAsRead(selectedConversation);
    }
  }, [selectedConversation, setSearchParams, markNotificationAsRead]);

  const { data: messagesData, isLoading: messagesLoading, fetchNextPage, hasNextPage, isFetchingNextPage, error: messagesError } = useInfiniteQuery({
    queryKey: ['conversation-messages', selectedConversation],
    queryFn: ({ pageParam }) => {
      // Use cursor-based pagination for better performance
      const params = pageParam 
        ? { cursor: pageParam, limit: 15 } 
        : { limit: 15 }; // Initial load: 15 messages
      return chatAPI.getMessages(selectedConversation, params).then(res => res.data.data);
    },
    enabled: !!selectedConversation && !!user, // Only fetch when conversation is selected and user is authenticated
    initialPageParam: null, // Start with null (no cursor for initial load)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors like 401, 403, 404)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Don't retry on timeout - let it fail fast
      if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
        return false;
      }
      // Only retry once for network errors (not timeouts)
      return failureCount < 1;
    },
    retryDelay: 1000, // Fixed 1 second delay
    staleTime: 60000, // Consider data fresh for 60 seconds
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    getNextPageParam: (lastPage) => {
      // Use cursor-based pagination: return nextCursor if hasMore
      if (lastPage?.pagination?.hasMore && lastPage.pagination.nextCursor) {
        return lastPage.pagination.nextCursor;
      }
      return undefined;
    },
    // IMPORTANT: Don't show error toasts during loading - only show real failures
    meta: {
      skipErrorToast: true, // Skip showing toast for query errors
    },
  });

  // Flatten paginated messages
  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flatMap(page => page.messages || []);
  }, [messagesData?.pages]);

  // Socket.IO room join - IMMEDIATE and INDEPENDENT of message fetch
  useEffect(() => {
    if (!socket || !selectedConversation) return;
    
    const DEBUG_SOCKET = import.meta.env.DEV;
    
    // Handle socket errors for room join
    const handleSocketError = (error) => {
      // Don't show toast - errors are handled in UI
      // The message fetch will show error state if it fails
      // Removed console.error for production
    };
    
    // Handle successful room join
    const handleJoinedConversation = (data) => {
      // Room joined successfully - no action needed
      // Removed console.log for production
    };
    
    // Join room immediately when conversation is selected
    socket.emit('join_conversation', selectedConversation);
    
    // Listen for join confirmation and errors
    socket.on('joined_conversation', handleJoinedConversation);
    socket.on('error', handleSocketError);
    
    return () => {
      // Clean up listeners
      socket.off('joined_conversation', handleJoinedConversation);
      socket.off('error', handleSocketError);
      // Leave room when conversation changes or component unmounts
      if (socket.connected) {
        socket.emit('leave_conversation', selectedConversation);
      }
    };
  }, [socket, selectedConversation]);

  // Socket.IO event handlers - SEPARATE from room join
  // Use refs to prevent duplicate listeners on re-render
  const socketHandlersRef = useRef({});
  
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    // Clean up previous handlers if they exist
    if (socketHandlersRef.current.handleNewMessage) {
      socket.off('new_message', socketHandlersRef.current.handleNewMessage);
    }
    if (socketHandlersRef.current.handleMessageReceived) {
      socket.off('message_received', socketHandlersRef.current.handleMessageReceived);
    }
    if (socketHandlersRef.current.handleSocketError) {
      socket.off('error', socketHandlersRef.current.handleSocketError);
    }

    // Handle socket errors (separate from room join errors)
    const handleSocketError = (error) => {
      // Don't show toast - this is handled by message fetch error state
      // Removed console.error for production
    };

    const handleNewMessage = (newMessage) => {
      if (newMessage.conversationId?.toString() === selectedConversation?.toString()) {
        queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
          if (!old || !old.pages || old.pages.length === 0) return old;
          
          const lastPage = old.pages[old.pages.length - 1];
          const existingMessages = lastPage.messages || [];
          
          // Dedupe: Check if message already exists by _id
          const existingMessageIds = new Set(existingMessages.map(msg => msg._id?.toString()));
          const newMessageId = newMessage._id?.toString();
          
          if (newMessageId && existingMessageIds.has(newMessageId)) {
            return old; // Message already exists by ID, don't add duplicate
          }
          
          // Remove optimistic message if this is the real one (replace temp message)
          const messageText = newMessage.messageText || newMessage.message || '';
          const senderId = newMessage.senderId?._id?.toString() || newMessage.senderId?.toString();
          const sentAt = newMessage.sentAt || newMessage.createdAt;
          
          // Check for optimistic message to replace
          const filteredMessages = existingMessages.filter(msg => {
            if (msg.isOptimistic) {
              const msgText = msg.messageText || msg.message || '';
              const msgSenderId = msg.senderId?._id?.toString() || msg.senderId?.toString();
              const msgSentAt = msg.sentAt || msg.createdAt;
              
              // Same text, same sender, within 5 seconds = replace optimistic with real
              if (msgText === messageText && 
                  msgSenderId === senderId && 
                  sentAt && msgSentAt) {
                const timeDiff = Math.abs(new Date(sentAt) - new Date(msgSentAt));
                if (timeDiff < 5000) { // 5 seconds
                  return false; // Remove optimistic message
                }
              }
            }
            return true;
          });
          
          // Additional dedupe: Check by content + sender + timestamp (within 2 seconds)
          const isDuplicate = filteredMessages.some(msg => {
            const msgText = msg.messageText || msg.message || '';
            const msgSenderId = msg.senderId?._id?.toString() || msg.senderId?.toString();
            const msgSentAt = msg.sentAt || msg.createdAt;
            
            // Same text, same sender, within 2 seconds
            if (msgText === messageText && 
                msgSenderId === senderId && 
                sentAt && msgSentAt) {
              const timeDiff = Math.abs(new Date(sentAt) - new Date(msgSentAt));
              if (timeDiff < 2000) { // 2 seconds
                return true;
              }
            }
            return false;
          });
          
          if (isDuplicate) {
            return old; // Duplicate detected by content, don't add
          }
          
          // Update last page with new message
          return {
            ...old,
            pages: old.pages.map((page, index) => 
              index === old.pages.length - 1
                ? { ...page, messages: [...filteredMessages, newMessage] }
                : page
            ),
          };
        });
      }
      queryClient.invalidateQueries(['user-conversations']);
    };

    const handleMessageReceived = (data) => {
      // Don't invalidate queries - we already handle new messages via 'new_message' event
      // Invalidating here causes unnecessary refetch and performance issues
      // The message is already added to cache in handleNewMessage above
    };
    
    // Store handlers in ref for cleanup
    socketHandlersRef.current = {
      handleNewMessage,
      handleMessageReceived,
      handleSocketError,
    };
    
    socket.on('new_message', handleNewMessage);
    socket.on('message_received', handleMessageReceived);
    socket.on('error', handleSocketError);
    
    return () => {
      // Clean up listeners using stored handlers
      if (socketHandlersRef.current.handleNewMessage) {
        socket.off('new_message', socketHandlersRef.current.handleNewMessage);
      }
      if (socketHandlersRef.current.handleMessageReceived) {
        socket.off('message_received', socketHandlersRef.current.handleMessageReceived);
      }
      if (socketHandlersRef.current.handleSocketError) {
        socket.off('error', socketHandlersRef.current.handleSocketError);
      }
      socketHandlersRef.current = {};
    };
  }, [socket, selectedConversation, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => chatAPI.sendMessage(data),
    onSuccess: (response) => {
      // Message saved via HTTP API - socket event will update UI in real-time
      // Just remove optimistic message if exists
      if (response?.data?.data && selectedConversation) {
        const sentMessage = response.data.data;
        queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
          if (!old || !old.pages || old.pages.length === 0) return old;
          
          const lastPage = old.pages[old.pages.length - 1];
          const existingMessages = lastPage.messages || [];
          
          // Remove optimistic message (socket event will add the real one)
          const filteredMessages = existingMessages.filter(msg => !msg.isOptimistic || msg._id?.toString() !== sentMessage._id?.toString());
          
          return {
            ...old,
            pages: old.pages.map((page, index) => 
              index === old.pages.length - 1
                ? { ...page, messages: filteredMessages }
                : page
            ),
          };
        });
      }
      queryClient.invalidateQueries(['user-conversations']);
    },
    onError: (error) => {
      // Remove optimistic message on error
      if (selectedConversation) {
        queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
          if (!old || !old.pages || old.pages.length === 0) return old;
          
          const lastPage = old.pages[old.pages.length - 1];
          const filteredMessages = (lastPage.messages || []).filter(msg => !msg.isOptimistic);
          
          return {
            ...old,
            pages: old.pages.map((page, index) => 
              index === old.pages.length - 1
                ? { ...page, messages: filteredMessages }
                : page
            ),
          };
        });
      }
      // Show error toast with proper error handling
      showApiError(error, 'Failed to send message');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (conversationId) => chatAPI.markAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-conversations']);
    },
    onError: (error) => {
      // Silently handle errors - mark as read is a background operation
      // Don't show toast or log errors
    },
    retry: false, // Don't retry - if it fails, socket will handle it
  });

  // Smooth scroll to bottom only on new messages (not on initial load or pagination)
  const prevMessagesLengthRef = useRef(0);
  useEffect(() => {
    const currentLength = messages.length;
    const prevLength = prevMessagesLengthRef.current;
    
    // Only auto-scroll if new message was added at the end (not pagination)
    if (currentLength > prevLength && messagesEndRef.current) {
      // Check if we're near the bottom before scrolling
      const messagesContainer = messagesEndRef.current.parentElement;
      if (messagesContainer) {
        const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 200;
        if (isNearBottom) {
          // Use requestAnimationFrame for smooth scroll
          requestAnimationFrame(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          });
        }
      }
    }
    prevMessagesLengthRef.current = currentLength;
  }, [messages.length]);

  // Mark as read when conversation is selected
  // Use socket if available (faster), fallback to HTTP only if socket not connected
  const markAsReadRef = useRef(null);
  useEffect(() => {
    if (!selectedConversation) return;
    
    // Prevent duplicate calls
    if (markAsReadRef.current === selectedConversation) return;
    markAsReadRef.current = selectedConversation;
    
    // Small delay to ensure socket is ready
    const timeoutId = setTimeout(() => {
      if (socket && isConnected) {
        // Use socket for real-time marking (faster, no HTTP overhead)
        socket.emit('mark_read', selectedConversation);
      } else if (!socket || !isConnected) {
        // Fallback to HTTP only if socket is not available
        markAsReadMutation.mutate(selectedConversation);
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedConversation, socket, isConnected, markAsReadMutation]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation) return;
    
    const messageText = message.trim();
    
    // Optimistic UI: Add message to cache immediately before sending
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      conversationId: selectedConversation,
      senderId: user,
      receiverId: conversation?.sellerId,
      messageText,
      messageType: 'text',
      isRead: false,
      sentAt: new Date(),
      isOptimistic: true, // Flag to identify optimistic messages
    };
    
    queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
      if (!old || !old.pages || old.pages.length === 0) return old;
      const lastPage = old.pages[old.pages.length - 1];
      return {
        ...old,
        pages: old.pages.map((page, index) => 
          index === old.pages.length - 1
            ? { ...page, messages: [...(page.messages || []), optimisticMessage] }
            : page
        ),
      };
    });
    
    // Clear input immediately for better UX
    setMessage('');
    
    // Send via HTTP API first (backend will emit socket event after saving)
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      messageText,
    });
  };

  if (conversationsLoading) return <Loading message="Loading conversations..." />;

  const conversation = conversations?.find((c) => c._id === selectedConversation);

  return (
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
                        {conv.sellerId?.shopName || 'Seller'}
                      </span>
                      {conv.unreadCountBuyer > 0 && (
                        <Badge variant="destructive">{conv.unreadCountBuyer}</Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {conv.lastMessage || (conv.orderId 
                        ? `Order: $${conv.orderId?.totalAmount?.toFixed(2) || '0.00'}`
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
                  className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0" 
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}
                  onScroll={(e) => {
                    // Infinite scroll: Load older messages when scrolling to top
                    // Add slight delay to prevent rapid firing
                    const { scrollTop } = e.target;
                    if (scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
                      // Small delay to simulate natural loading (1-2 seconds as requested)
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
                      ) : (
                        <div className="max-w-2xl mx-auto">
                          {isFetchingNextPage && (
                            <div className="flex justify-center py-2">
                              <Loading message="Loading older messages..." />
                            </div>
                          )}
                          {messages.map((msg) => {
                            // Get sender info (senderId is populated with User data)
                            const senderInfo = msg.senderId;
                            const senderId = senderInfo?._id?.toString() || senderInfo?.toString() || msg.senderId?.toString();
                            const senderName = senderInfo?.name || senderInfo?.username || 'Unknown';
                            const senderAvatar = senderInfo?.profileImage || null;
                            
                            // Check if message is from current user (buyer)
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

export default UserChat;
