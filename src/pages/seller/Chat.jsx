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

const SellerChat = () => {
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
    queryKey: ['seller-conversations'],
    queryFn: () => chatAPI.getConversations({ role: 'seller' }).then(res => res.data.data),
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
    queryFn: ({ pageParam = 1 }) => 
      chatAPI.getMessages(selectedConversation, { page: pageParam, limit: 25 }).then(res => res.data.data),
    enabled: !!selectedConversation && !!user, // Only fetch when conversation is selected and user is authenticated
    initialPageParam: 1,
    retry: 2,
    retryDelay: 1000,
    staleTime: 10000, // Consider data fresh for 10 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination && lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  // Flatten paginated messages
  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flatMap(page => page.messages || []);
  }, [messagesData?.pages]);

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !selectedConversation) return;

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
      // Refresh conversations list
      queryClient.invalidateQueries(['seller-conversations']);
    };

    const handleMessageReceived = (data) => {
      // Don't invalidate queries - we already handle new messages via 'new_message' event
      // Invalidating here causes unnecessary refetch and performance issues
      // The message is already added to cache in handleNewMessage above
    };

    socket.emit('join_conversation', selectedConversation);
    socket.on('new_message', handleNewMessage);
    socket.on('message_received', handleMessageReceived);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_received', handleMessageReceived);
      socket.emit('leave_conversation', selectedConversation);
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
      queryClient.invalidateQueries(['seller-conversations']);
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
      queryClient.invalidateQueries(['seller-conversations']);
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && socket) {
      markAsReadMutation.mutate(selectedConversation);
      socket.emit('mark_read', selectedConversation);
    }
  }, [selectedConversation, socket, markAsReadMutation]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && selectedConversation && socket) {
      const messageText = message.trim();
      
      // Optimistic UI: Add message to cache immediately before sending
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        conversationId: selectedConversation,
        senderId: user,
        receiverId: conversation?.buyerId,
        messageText,
        messageType: 'text',
        isRead: false,
        sentAt: new Date(),
        isOptimistic: true, // Flag to identify optimistic messages
      };
      
      queryClient.setQueryData(['conversation-messages', selectedConversation], (old) => {
        if (!old) return old;
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
      
      // Send via socket for real-time delivery
      socket.emit('send_message', {
        conversationId: selectedConversation,
        messageText,
      });
      
      // If socket fails, we can add error handling here later
      // For now, socket is the primary method and it handles everything
    } else if (message.trim() && selectedConversation && !socket) {
      // Fallback: If socket is not available, use REST API
      sendMessageMutation.mutate({
        conversationId: selectedConversation,
        messageText: message.trim(),
      });
      setMessage('');
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
        <Card className="lg:col-span-2 bg-primary border-gray-700 flex flex-col max-w-full h-full min-h-0 overflow-hidden">
          <CardHeader className="shrink-0 border-b border-gray-700 px-4 py-3">
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
                    // Infinite scroll: Load older messages when scrolling to top
                    const { scrollTop } = e.target;
                    if (scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
                      fetchNextPage();
                    }
                  }}
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loading message="Loading messages..." />
                    </div>
                  ) : (
                    <>
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No messages yet</div>
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
                            
                            // Check if message is from current user (seller)
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

export default SellerChat;
