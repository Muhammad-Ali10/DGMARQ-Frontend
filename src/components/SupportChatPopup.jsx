import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { supportAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Loading } from './ui/loading';
import { Send, X, Headphones, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const SupportChatPopup = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);

  // Fetch user's support chats
  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['user-support-chats-popup'],
    queryFn: () => supportAPI.getMySupportChats().then(res => res.data.data),
    enabled: isOpen,
  });

  // Fetch messages for selected chat
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['support-messages-popup', selectedChat],
    queryFn: () => supportAPI.getSupportMessages(selectedChat).then(res => res.data.data),
    enabled: !!selectedChat && isOpen,
  });

  const messages = messagesData?.messages || [];

  // Auto-select first chat if available
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChat) {
      const openChat = chats.find(c => c.status === 'open') || chats[0];
      setSelectedChat(openChat._id);
    }
  }, [chats, selectedChat]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !selectedChat) return;

    // Join support chat room when connected
    const joinChat = () => {
      if (socket.connected) {
        socket.emit('join_support_chat', selectedChat);
      }
    };

    // Join immediately if already connected, otherwise wait for connection
    if (isConnected) {
      joinChat();
    }

    // Listen for new messages
    const handleNewMessage = (message) => {
      if (message.supportChatId?.toString() === selectedChat) {
        queryClient.invalidateQueries(['support-messages-popup', selectedChat]);
        queryClient.invalidateQueries(['user-support-chats-popup']);
      }
    };

    // Listen for errors
    const handleError = (error) => {
      console.error('Support chat socket error:', error);
    };

    // Handle connection
    const handleConnect = () => {
      joinChat();
    };

    socket.on('support_message', handleNewMessage);
    socket.on('error', handleError);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('support_message', handleNewMessage);
      socket.off('error', handleError);
      socket.off('connect', handleConnect);
      if (selectedChat && socket.connected) {
        socket.emit('leave_support_chat', selectedChat);
      }
    };
  }, [socket, isConnected, selectedChat, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Calculate unread count
  useEffect(() => {
    if (chats && onUnreadCountChange) {
      const unread = chats.reduce((total, chat) => {
        return total + (chat.unreadCountUser || 0);
      }, 0);
      onUnreadCountChange(unread);
    }
  }, [chats, onUnreadCountChange]);

  const createChatMutation = useMutation({
    mutationFn: (data) => supportAPI.createSupportChat(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['user-support-chats-popup']);
      const newChat = response.data?.data?.chat;
      if (newChat?._id) {
        setSelectedChat(newChat._id);
      }
      setDialogOpen(false);
      setSubject('');
      setInitialMessage('');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, data }) => supportAPI.sendSupportMessage(chatId, data),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries(['support-messages-popup', selectedChat]);
      queryClient.invalidateQueries(['user-support-chats-popup']);
    },
  });

  const handleCreateChat = (e) => {
    e.preventDefault();
    createChatMutation.mutate({
      subject: subject.trim(),
      initialMessage: initialMessage.trim(),
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && selectedChat) {
      sendMessageMutation.mutate({
        chatId: selectedChat,
        data: { messageText: message.trim() },
      });
    }
  };

  const selectedChatData = chats?.find((c) => c._id === selectedChat);

  const getStatusBadge = (status) => {
    const variants = {
      open: 'default',
      pending: 'secondary',
      closed: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[400px] bg-primary border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-accent" />
          <h3 className="text-white font-semibold">Support Chat</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Chat List / Messages */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-1/3 border-r border-gray-700 bg-gray-900 overflow-y-auto">
          <div className="p-2">
            <Button
              size="sm"
              className="w-full mb-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          {chatsLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
          ) : chats?.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">No chats</div>
          ) : (
            <div className="space-y-1 p-2">
              {chats?.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat._id)}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedChat === chat._id
                      ? 'bg-accent text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">
                      {chat.subject || 'No subject'}
                    </span>
                    {chat.unreadCountUser > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {chat.unreadCountUser > 9 ? '9+' : chat.unreadCountUser}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(chat.status)}
                    <span className="text-xs opacity-70">
                      {new Date(chat.lastMessageAt || chat.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-2 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium text-sm">
                      {selectedChatData?.subject || 'Support Chat'}
                    </h4>
                    <p className="text-gray-400 text-xs">
                      {selectedChatData?.status === 'open' ? 'Open' : 'Closed'}
                    </p>
                  </div>
                  {getStatusBadge(selectedChatData?.status)}
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messagesLoading ? (
                  <Loading message="Loading messages..." />
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.senderType === 'user';
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-2 ${
                            isUser
                              ? 'bg-accent text-white'
                              : 'bg-gray-800 text-gray-200'
                          }`}
                        >
                          <p className="text-sm">{msg.messageText}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.sentAt || msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedChatData?.status !== 'closed' && (
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-700 bg-gray-800"
                >
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="bg-gray-900 border-gray-700 text-white flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={sendMessageMutation.isPending || !message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Headphones className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a chat or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create New Chat Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new support ticket to get help
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChat} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-gray-300">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What do you need help with?"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-300">Message</Label>
              <Textarea
                id="message"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Describe your issue..."
                required
                rows={4}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createChatMutation.isPending || !subject.trim() || !initialMessage.trim()}
              >
                {createChatMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportChatPopup;

